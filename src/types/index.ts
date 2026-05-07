// ─── App Model ───────────────────────────────────────────────────────────
export interface AppModel {
  id: string;
  name: string;
  description: string;
  publisher: string;
  version: string;
  category?: string;
  icon_url?: string;
  source: string;
}

/** Group of the same app from different sources (for deduplication). */
export interface AppGroup {
  /** Canonical name used for display. */
  name: string;
  /** All source variants of this app. */
  variants: AppModel[];
  /** The currently selected/preferred source. */
  preferredSource: string;
}

// ─── Installation ────────────────────────────────────────────────────────
export interface InstallProgress {
  appId: string;
  status: 'pending' | 'downloading' | 'installing' | 'completed' | 'failed';
  progress: number; // 0 to 100
  message?: string;
}

export interface InstallRequest {
  id: string;
  source: string;
}

// ─── UI State ────────────────────────────────────────────────────────────
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

export type Theme = 'dark' | 'light';

export type Category = 
  | 'All'
  | 'Browsers'
  | 'Development'
  | 'Communication'
  | 'Media'
  | 'Utilities'
  | 'Gaming'
  | 'Productivity';

// ─── Profiles ────────────────────────────────────────────────────────────
export interface ProfileApp {
  id: string;
  name: string;
  source: string;
  category: string;
}

export interface PostInstallScript {
  trigger_after: string;
  script: string;
}

export interface Profile {
  name: string;
  description: string;
  created_at: string;
  platform: 'windows' | 'macos' | 'linux';
  apps: ProfileApp[];
  post_install_scripts?: PostInstallScript[];
}

// ─── Search Cache ────────────────────────────────────────────────────────
export interface CachedSearch {
  query: string;
  results: AppModel[];
  timestamp: number;
}

// ─── Package Manager Info ────────────────────────────────────────────────
export interface PackageManagerInfo {
  name: string;
  available: boolean;
}

// ─── Settings ────────────────────────────────────────────────────────────
export interface AppSettings {
  theme: Theme;
  sidebarCollapsed: boolean;
  enabledManagers: string[];
  maxConcurrentInstalls: number;
  searchDebounceMs: number;
  cacheExpiryMs: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  sidebarCollapsed: false,
  enabledManagers: [],
  maxConcurrentInstalls: 3,
  searchDebounceMs: 400,
  cacheExpiryMs: 5 * 60 * 1000, // 5 minutes
};
