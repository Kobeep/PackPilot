import { useRef, useEffect } from 'react';
import { ShieldCheck, ShieldOff } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { SearchBar } from './components/SearchBar';
import { AppCard } from './components/AppCard';
import { InstallQueue } from './components/InstallQueue';
import { ToastContainer } from './components/Toast';
import { AppDetailModal } from './components/AppDetailModal';
import { SkeletonGrid } from './components/SkeletonCard';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAppStore } from './stores/appStore';
import { clsx } from 'clsx';

function App() {
  const { availableApps, activeCategory, searchQuery, isSearching, settings, updateSettings, initEventListeners } = useAppStore();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize Tauri event listeners & detect managers on mount
  useEffect(() => {
    initEventListeners();
  }, []);

  // Register keyboard shortcuts
  useKeyboardShortcuts(searchInputRef);

  const filteredApps = availableApps.filter(app => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = app.name.toLowerCase().includes(searchLower) || 
                          app.description.toLowerCase().includes(searchLower);

    // Verified filter
    if (settings.verifiedOnly && !app.is_verified) return false;

    let matchesCategory = true;
    if (activeCategory !== 'All') {
      const categoryLower = activeCategory.toLowerCase();
      const keywords: Record<string, string[]> = {
        'browsers': ['browser', 'web', 'internet', 'chrome', 'firefox', 'edge', 'brave', 'opera', 'chromium', 'surf'],
        'development': ['ide', 'editor', 'git', 'docker', 'code', 'compiler', 'programming', 'dev', 'sdk', 'debug', 'terminal', 'vim', 'emacs', 'neovim'],
        'communication': ['chat', 'message', 'call', 'discord', 'slack', 'teams', 'zoom', 'skype', 'telegram', 'signal', 'email', 'mail'],
        'media': ['player', 'video', 'audio', 'music', 'vlc', 'spotify', 'obs', 'media', 'stream', 'photo', 'image', 'gimp', 'blender'],
        'utilities': ['tool', 'system', 'utility', 'zip', 'extract', 'monitor', 'backup', 'archive', 'file', 'manager', 'calculator', 'clock'],
        'gaming': ['game', 'gaming', 'steam', 'lutris', 'wine', 'proton', 'emulator', 'controller', 'gamepad'],
        'productivity': ['office', 'document', 'spreadsheet', 'presentation', 'note', 'calendar', 'task', 'pdf', 'libreoffice', 'obsidian', 'notion'],
      };

      const targetKeywords = keywords[categoryLower] || [categoryLower];
      const searchSpace = `${app.name} ${app.description} ${app.category || ''}`.toLowerCase();
      matchesCategory = targetKeywords.some(kw => searchSpace.includes(kw));
    }

    return matchesCategory && matchesSearch;
  });

  // Sort: installed first, then by relevance
  const sortedApps = [...filteredApps].sort((a, b) => {
    const searchLower = searchQuery.toLowerCase();
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    
    // Verified apps first
    if (a.is_verified && !b.is_verified) return -1;
    if (!a.is_verified && b.is_verified) return 1;

    // Exact match wins
    if (aName === searchLower && bName !== searchLower) return -1;
    if (bName === searchLower && aName !== searchLower) return 1;
    
    // Starts-with wins
    const aStarts = aName.startsWith(searchLower);
    const bStarts = bName.startsWith(searchLower);
    if (aStarts && !bStarts) return -1;
    if (bStarts && !aStarts) return 1;
    
    if (aStarts && bStarts) return aName.length - bName.length;
    
    return aName.localeCompare(bName);
  });

  // Deduplicate: group apps with the same name from different sources
  const deduplicatedApps = (() => {
    const seen = new Map<string, number>();
    const result: typeof sortedApps = [];
    for (const app of sortedApps) {
      const key = app.name.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, result.length);
        result.push(app);
      }
    }
    return result;
  })();

  const resultCount = deduplicatedApps.length;
  const verifiedCount = deduplicatedApps.filter(a => a.is_verified).length;
  const installedCount = deduplicatedApps.filter(a => a.is_installed).length;

  return (
    <div className={`flex h-screen bg-background text-text overflow-hidden selection:bg-primary/30 ${settings.theme}`}>
      <Sidebar />

      <div className="flex-1 flex flex-col relative">
        <SearchBar ref={searchInputRef} />

        <div className="flex-1 overflow-auto p-8 pb-32">
          {isSearching ? (
            <SkeletonGrid count={8} />
          ) : deduplicatedApps.length > 0 ? (
            <>
              {/* Results header with stats + verified filter toggle */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4 text-sm text-text-muted">
                  <span className="font-medium">
                    {resultCount} result{resultCount !== 1 ? 's' : ''}
                  </span>
                  {installedCount > 0 && (
                    <span className="px-2 py-1 rounded-md bg-success/10 text-success border border-success/20 text-xs font-semibold">
                      {installedCount} installed
                    </span>
                  )}
                  <span className="px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
                    {verifiedCount} verified
                  </span>
                </div>

                {/* Verified Only toggle */}
                <button
                  onClick={() => updateSettings({ verifiedOnly: !settings.verifiedOnly })}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                    settings.verifiedOnly
                      ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                      : "bg-surface-hover text-text-muted border-white/10 hover:border-white/20"
                  )}
                >
                  {settings.verifiedOnly ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                  {settings.verifiedOnly ? 'Verified Only' : 'All Sources'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {deduplicatedApps.map(app => (
                  <AppCard key={`${app.source}-${app.id}`} app={app} />
                ))}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-text-muted">
              {searchQuery ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-surface border border-white/5 flex items-center justify-center mb-6">
                    <span className="text-4xl">🔍</span>
                  </div>
                  <p className="text-xl font-medium">No apps found</p>
                  <p className="text-sm mt-2 text-text-muted/70">
                    {settings.verifiedOnly
                      ? 'Try disabling "Verified Only" to see more results'
                      : 'Try adjusting your search or category filter'}
                  </p>
                  {settings.verifiedOnly && (
                    <button
                      onClick={() => updateSettings({ verifiedOnly: false })}
                      className="mt-4 px-4 py-2 rounded-xl bg-surface border border-white/5 text-sm text-text-muted hover:text-text hover:border-white/10 transition-all"
                    >
                      Show all sources
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className="w-24 h-24 rounded-full bg-surface border border-white/5 flex items-center justify-center mb-6">
                    <span className="text-5xl">📦</span>
                  </div>
                  <p className="text-xl font-semibold">Search for apps to install</p>
                  <p className="text-sm mt-2 text-text-muted/70 max-w-md text-center">
                    Start typing to search across all your package managers. Try "chrome", "vscode", or "discord".
                  </p>
                  <div className="flex gap-2 mt-6">
                    {['Chrome', 'VS Code', 'Discord', 'VLC'].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => useAppStore.getState().setSearchQuery(suggestion)}
                        className="px-4 py-2 rounded-xl bg-surface border border-white/5 text-sm text-text-muted hover:text-text hover:border-white/10 transition-all hover:shadow-lg"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        <InstallQueue />
      </div>

      <ToastContainer />
      <AppDetailModal />
    </div>
  );
}

export default App;
