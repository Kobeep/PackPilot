import { create } from 'zustand';
import {
  AppModel,
  Category,
  InstallProgress,
  ToastMessage,
  Theme,
  CachedSearch,
  PackageManagerInfo,
  AppSettings,
  DEFAULT_SETTINGS,
  Profile,
} from '../types';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { save, open } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';

// ─── Module-scoped state ─────────────────────────────────────────────────
let searchTimeout: ReturnType<typeof setTimeout> | null = null;
const searchCache: Map<string, CachedSearch> = new Map();

// ─── Helpers ─────────────────────────────────────────────────────────────
function sanitizeId(id: string): string {
  // Strip anything that's not alphanumeric, dots, dashes, underscores, or slashes
  return id.replace(/[^a-zA-Z0-9._\-\/]/g, '');
}

function getPlatform(): 'windows' | 'macos' | 'linux' {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('win')) return 'windows';
  if (ua.includes('mac')) return 'macos';
  return 'linux';
}

// ─── Store Interface ─────────────────────────────────────────────────────
interface AppState {
  // Data
  availableApps: AppModel[];
  selectedApps: Map<string, AppModel>;
  searchQuery: string;
  activeCategory: Category;
  installProgress: Record<string, InstallProgress>;
  isInstalling: boolean;
  isSearching: boolean;
  toasts: ToastMessage[];
  detailApp: AppModel | null;
  availableManagers: PackageManagerInfo[];

  // Settings & Theme
  settings: AppSettings;
  
  // Queue ordering
  installOrder: string[];

  // Actions — Data
  setAvailableApps: (apps: AppModel[]) => void;
  toggleAppSelection: (app: AppModel) => void;
  selectApp: (app: AppModel) => void;
  deselectApp: (appId: string) => void;
  clearSelection: () => void;
  setSearchQuery: (query: string) => void;
  setActiveCategory: (category: Category) => void;
  updateInstallProgress: (progress: InstallProgress) => void;
  setIsInstalling: (isInstalling: boolean) => void;
  performSearch: (query: string) => void;
  installSelectedApps: () => Promise<void>;

  // Actions — Detail Modal
  openDetail: (app: AppModel) => void;
  closeDetail: () => void;

  // Actions — Profiles
  exportProfile: () => Promise<void>;
  importProfile: () => Promise<void>;

  // Actions — Toast
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  // Actions — Settings & Theme
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  updateSettings: (partial: Partial<AppSettings>) => void;

  // Actions — Queue ordering
  reorderInstallQueue: (fromIndex: number, toIndex: number) => void;

  // Actions — Package Manager Detection
  detectManagers: () => Promise<void>;

  // Actions — Uninstall & Update
  uninstallApp: (appId: string, source: string) => Promise<void>;
  checkUpdates: () => Promise<void>;

  // Actions — Init
  initEventListeners: () => void;
  clearCache: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // ─── Initial State ───────────────────────────────────────────────────
  availableApps: [],
  selectedApps: new Map(),
  searchQuery: '',
  activeCategory: 'All',
  installProgress: {},
  isInstalling: false,
  isSearching: false,
  toasts: [],
  detailApp: null,
  availableManagers: [],
  settings: { ...DEFAULT_SETTINGS },
  installOrder: [],

  // ─── Data Actions ────────────────────────────────────────────────────
  setAvailableApps: (apps) => set({ availableApps: apps }),
  
  toggleAppSelection: (app) => set((state) => {
    const newSelection = new Map(state.selectedApps);
    const newOrder = [...state.installOrder];
    if (newSelection.has(app.id)) {
      newSelection.delete(app.id);
      const idx = newOrder.indexOf(app.id);
      if (idx > -1) newOrder.splice(idx, 1);
    } else {
      newSelection.set(app.id, app);
      if (!newOrder.includes(app.id)) newOrder.push(app.id);
    }
    return { selectedApps: newSelection, installOrder: newOrder };
  }),

  selectApp: (app) => set((state) => {
    const newSelection = new Map(state.selectedApps);
    const newOrder = [...state.installOrder];
    if (!newSelection.has(app.id)) {
      newSelection.set(app.id, app);
      newOrder.push(app.id);
    }
    return { selectedApps: newSelection, installOrder: newOrder };
  }),

  deselectApp: (appId) => set((state) => {
    const newSelection = new Map(state.selectedApps);
    newSelection.delete(appId);
    return {
      selectedApps: newSelection,
      installOrder: state.installOrder.filter(id => id !== appId),
    };
  }),
  
  clearSelection: () => set({ selectedApps: new Map(), installOrder: [] }),
  
  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().performSearch(query);
  },
  
  setActiveCategory: (category) => {
    set({ activeCategory: category });
  },
  
  updateInstallProgress: (progress) => set((state) => ({
    installProgress: {
      ...state.installProgress,
      [progress.appId]: progress
    }
  })),
  
  setIsInstalling: (isInstalling) => set({ isInstalling }),

  // ─── Search with Caching & Debounce ──────────────────────────────────
  performSearch: (query: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      searchTimeout = null;
    }

    if (!query.trim()) {
      set({ availableApps: [], isSearching: false });
      return;
    }

    // Check cache first
    const cacheKey = query.trim().toLowerCase();
    const cached = searchCache.get(cacheKey);
    const cacheExpiry = get().settings.cacheExpiryMs;
    if (cached && Date.now() - cached.timestamp < cacheExpiry) {
      set({ availableApps: cached.results, isSearching: false });
      return;
    }
    
    const debounceMs = get().settings.searchDebounceMs;
    searchTimeout = setTimeout(async () => {
      if (get().searchQuery !== query) return;
      
      set({ isSearching: true });
      
      try {
        const results: AppModel[] = await invoke('search_apps', { query });
        if (get().searchQuery === query) {
          // Cache the results
          searchCache.set(cacheKey, {
            query: cacheKey,
            results,
            timestamp: Date.now(),
          });
          set({ availableApps: results });
        }
      } catch (error) {
        console.error("Failed to search apps:", error);
        if (get().searchQuery === query) {
          set({ availableApps: [] });
          get().addToast({
            type: 'error',
            title: 'Search Failed',
            message: 'Could not reach package managers. Please try again.',
          });
        }
      } finally {
        if (get().searchQuery === query) {
          set({ isSearching: false });
        }
      }
    }, debounceMs);
  },

  // ─── Install with Progress Events ────────────────────────────────────
  installSelectedApps: async () => {
    const { selectedApps, installOrder, setIsInstalling, addToast, updateInstallProgress, clearSelection } = get();
    
    if (selectedApps.size === 0) return;
    setIsInstalling(true);

    // Build install list in user-specified order
    const orderedApps = installOrder
      .map(id => selectedApps.get(id))
      .filter((app): app is AppModel => !!app);

    // Set all to pending
    for (const app of orderedApps) {
      updateInstallProgress({
        appId: app.id,
        status: 'pending',
        progress: 0,
        message: 'Waiting in queue...',
      });
    }

    try {
      const apps = orderedApps.map(app => ({
        id: sanitizeId(app.id),
        source: app.source,
      }));

      const errors: string[] = await invoke('install_selected', { apps });
      
      if (errors.length === 0) {
        addToast({
          type: 'success',
          title: 'Installation Complete',
          message: `Successfully installed ${apps.length} app(s).`,
        });
      } else {
        addToast({
          type: 'warning',
          title: 'Some Installations Failed',
          message: `${errors.length} of ${apps.length} app(s) had errors.`,
        });
      }
    } catch (e) {
      console.error("Installation failed", e);
      addToast({
        type: 'error',
        title: 'Installation Failed',
        message: String(e),
      });
    } finally {
      setIsInstalling(false);
      clearSelection();
    }
  },

  // ─── Detail Modal ────────────────────────────────────────────────────
  openDetail: (app) => set({ detailApp: app }),
  closeDetail: () => set({ detailApp: null }),

  // ─── Profile Export/Import ───────────────────────────────────────────
  exportProfile: async () => {
    try {
      const selectedAppsList = Array.from(get().selectedApps.values());
      if (selectedAppsList.length === 0) {
        get().addToast({
          type: 'warning',
          title: 'No Apps Selected',
          message: 'Select at least one app before exporting a profile.',
        });
        return;
      }

      const profile: Profile = {
        name: "PackPilot Export",
        description: "Exported app selection from PackPilot",
        created_at: new Date().toISOString(),
        platform: getPlatform(),
        apps: selectedAppsList.map(app => ({
          id: app.id,
          name: app.name,
          source: app.source,
          category: app.category || 'Utility',
        })),
      };

      const profileData = JSON.stringify(profile, null, 2);

      const filePath = await save({
        filters: [{
          name: 'PackPilot Profile',
          extensions: ['json']
        }]
      });

      if (filePath) {
        await writeTextFile(filePath, profileData);
        get().addToast({
          type: 'success',
          title: 'Profile Exported',
          message: `Saved ${selectedAppsList.length} app(s) to profile.`,
        });
      }
    } catch (e) {
      console.error("Failed to export profile:", e);
      get().addToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Could not save the profile file.',
      });
    }
  },

  importProfile: async () => {
    try {
      const filePath = await open({
        multiple: false,
        filters: [{
          name: 'PackPilot Profile',
          extensions: ['json']
        }]
      });

      if (filePath && typeof filePath === 'string') {
        const contents = await readTextFile(filePath);
        let data: Partial<Profile>;
        try {
          data = JSON.parse(contents);
        } catch {
          get().addToast({
            type: 'error',
            title: 'Invalid JSON',
            message: 'The file contains invalid JSON. Please check the file format.',
          });
          return;
        }
        
        if (data.apps && Array.isArray(data.apps)) {
          const newMap = new Map(get().selectedApps);
          const newOrder = [...get().installOrder];
          let addedCount = 0;
          let skippedCount = 0;

          for (const app of data.apps) {
            if (!app.id) {
              skippedCount++;
              continue;
            }
            if (!newMap.has(app.id)) {
              newMap.set(app.id, {
                id: app.id,
                name: app.name || app.id,
                description: '',
                publisher: 'Unknown',
                version: 'Latest',
                category: app.category,
                source: app.source || 'unknown',
              });
              newOrder.push(app.id);
              addedCount++;
            }
          }

          set({ selectedApps: newMap, installOrder: newOrder });

          const profileName = data.name || 'profile';
          let msg = `Added ${addedCount} new app(s) from "${profileName}".`;
          if (skippedCount > 0) msg += ` ${skippedCount} skipped (missing ID).`;

          get().addToast({
            type: 'success',
            title: 'Profile Imported',
            message: msg,
          });
        } else {
          get().addToast({
            type: 'error',
            title: 'Invalid Profile',
            message: 'The selected file does not contain a valid app list.',
          });
        }
      }
    } catch (e) {
      console.error("Failed to import profile:", e);
      get().addToast({
        type: 'error',
        title: 'Import Failed',
        message: 'Could not read the profile file.',
      });
    }
  },

  // ─── Toast System ────────────────────────────────────────────────────
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newToast: ToastMessage = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 5000);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  // ─── Settings & Theme ────────────────────────────────────────────────
  setTheme: (theme) => {
    set((state) => ({
      settings: { ...state.settings, theme },
    }));
    // Apply theme class to document
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('packpilot-theme', theme);
    } catch { /* ignore in Tauri context */ }
  },

  toggleSidebar: () => {
    set((state) => ({
      settings: {
        ...state.settings,
        sidebarCollapsed: !state.settings.sidebarCollapsed,
      },
    }));
  },

  updateSettings: (partial) => {
    set((state) => ({
      settings: { ...state.settings, ...partial },
    }));
  },

  // ─── Queue Reordering ────────────────────────────────────────────────
  reorderInstallQueue: (fromIndex, toIndex) => {
    set((state) => {
      const newOrder = [...state.installOrder];
      const [moved] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, moved);
      return { installOrder: newOrder };
    });
  },

  // ─── Package Manager Detection ───────────────────────────────────────
  detectManagers: async () => {
    try {
      const managers: PackageManagerInfo[] = await invoke('detect_managers');
      set({ availableManagers: managers });
    } catch (e) {
      console.error("Failed to detect package managers:", e);
    }
  },

  // ─── Uninstall ───────────────────────────────────────────────────────
  uninstallApp: async (appId, source) => {
    try {
      await invoke('uninstall_app', { appId: sanitizeId(appId), source });
      get().addToast({
        type: 'success',
        title: 'App Uninstalled',
        message: `${appId} has been removed.`,
      });
    } catch (e) {
      console.error("Uninstall failed:", e);
      get().addToast({
        type: 'error',
        title: 'Uninstall Failed',
        message: String(e),
      });
    }
  },

  // ─── Update Checker ──────────────────────────────────────────────────
  checkUpdates: async () => {
    try {
      const updates: AppModel[] = await invoke('check_updates');
      if (updates.length > 0) {
        get().addToast({
          type: 'info',
          title: 'Updates Available',
          message: `${updates.length} app(s) have updates available.`,
        });
        set({ availableApps: updates });
      } else {
        get().addToast({
          type: 'success',
          title: 'All Up to Date',
          message: 'All installed apps are up to date.',
        });
      }
    } catch (e) {
      console.error("Update check failed:", e);
      get().addToast({
        type: 'error',
        title: 'Update Check Failed',
        message: String(e),
      });
    }
  },

  // ─── Event Listeners (Tauri) ─────────────────────────────────────────
  initEventListeners: () => {
    // Listen for install progress events from the Rust backend
    listen<InstallProgress>('install-progress', (event) => {
      get().updateInstallProgress(event.payload);
    }).catch(console.error);

    // Restore theme from localStorage
    try {
      const savedTheme = localStorage.getItem('packpilot-theme') as 'dark' | 'light' | null;
      if (savedTheme) {
        set((state) => ({
          settings: { ...state.settings, theme: savedTheme },
        }));
        document.documentElement.setAttribute('data-theme', savedTheme);
      }
    } catch { /* ignore */ }

    // Detect available package managers on startup
    get().detectManagers();
  },

  clearCache: () => {
    searchCache.clear();
    get().addToast({
      type: 'info',
      title: 'Cache Cleared',
      message: 'Search cache has been cleared.',
    });
  },
}));
