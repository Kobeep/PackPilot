import { Package, Globe, Code2, MessageSquare, Music, Wrench, Gamepad2, FileText, Settings, Download, Upload, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { Category } from '../types';
import { clsx } from 'clsx';
import { useState } from 'react';
import { SettingsPanel } from './SettingsPanel';

const categories: { name: Category; icon: React.ReactNode; keywords: string[] }[] = [
  { name: 'All', icon: <Package size={18} />, keywords: [] },
  { name: 'Browsers', icon: <Globe size={18} />, keywords: ['browser', 'web', 'chrome', 'firefox'] },
  { name: 'Development', icon: <Code2 size={18} />, keywords: ['ide', 'editor', 'git', 'code', 'dev'] },
  { name: 'Communication', icon: <MessageSquare size={18} />, keywords: ['chat', 'message', 'discord', 'slack'] },
  { name: 'Media', icon: <Music size={18} />, keywords: ['player', 'video', 'audio', 'music', 'media'] },
  { name: 'Utilities', icon: <Wrench size={18} />, keywords: ['tool', 'system', 'utility', 'monitor'] },
  { name: 'Gaming', icon: <Gamepad2 size={18} />, keywords: ['game', 'steam', 'lutris', 'emulator'] },
  { name: 'Productivity', icon: <FileText size={18} />, keywords: ['office', 'document', 'note', 'pdf'] },
];

export function Sidebar() {
  const { activeCategory, setActiveCategory, selectedApps, exportProfile, importProfile, settings, toggleSidebar, checkUpdates } = useAppStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const collapsed = settings.sidebarCollapsed;

  // Count selected apps per category (rough keyword match)
  const getCategoryCount = (cat: Category): number => {
    if (cat === 'All') return selectedApps.size;
    const catInfo = categories.find(c => c.name === cat);
    if (!catInfo) return 0;
    let count = 0;
    selectedApps.forEach((app) => {
      const searchSpace = `${app.name} ${app.description} ${app.category || ''}`.toLowerCase();
      if (catInfo.keywords.some(kw => searchSpace.includes(kw))) {
        count++;
      }
    });
    return count;
  };

  return (
    <>
      <div className={clsx(
        "bg-surface border-r border-white/5 flex flex-col h-full transition-all duration-300 relative",
        collapsed ? "w-16" : "w-64"
      )}>
        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-8 w-6 h-6 bg-surface border border-white/10 rounded-full flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-hover transition-all z-10 shadow-lg"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Logo */}
        <div className={clsx("p-6 flex items-center gap-3", collapsed && "justify-center px-3")}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Package className="text-white" size={24} />
          </div>
          {!collapsed && (
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent tracking-tight">
              PackPilot
            </h1>
          )}
        </div>

        <div className="flex-1 px-2 py-2 flex flex-col gap-1 overflow-y-auto">
          {!collapsed && (
            <div className="text-xs font-semibold text-text-muted/60 uppercase tracking-wider mb-2 mt-4 px-3">
              Categories
            </div>
          )}
          
          {categories.map((category) => {
            const count = getCategoryCount(category.name);
            return (
              <button
                key={category.name}
                onClick={() => setActiveCategory(category.name)}
                className={clsx(
                  "w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 group",
                  collapsed ? "justify-center p-2.5" : "px-3 py-2.5",
                  activeCategory === category.name
                    ? "bg-primary/10 text-primary"
                    : "text-text-muted hover:bg-surface-hover hover:text-text"
                )}
                title={collapsed ? category.name : undefined}
              >
                <div className={clsx(
                  "transition-transform duration-200 group-hover:scale-110 shrink-0",
                  activeCategory === category.name ? "text-primary" : "text-text-muted"
                )}>
                  {category.icon}
                </div>
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{category.name}</span>
                    {count > 0 && (
                      <span className="min-w-[22px] h-[22px] flex items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold border border-primary/30">
                        {count}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}

          <div className="mt-auto pt-4 border-t border-white/5 flex flex-col gap-1">
            <button
              onClick={importProfile}
              className={clsx(
                "w-full flex items-center gap-3 rounded-lg text-sm font-medium text-text-muted hover:bg-surface-hover hover:text-text transition-colors",
                collapsed ? "justify-center p-2.5" : "px-3 py-2.5"
              )}
              title={collapsed ? "Import Profile" : undefined}
            >
              <Upload size={18} />
              {!collapsed && "Import Profile"}
            </button>
            <button
              onClick={exportProfile}
              className={clsx(
                "w-full flex items-center gap-3 rounded-lg text-sm font-medium text-text-muted hover:bg-surface-hover hover:text-text transition-colors",
                collapsed ? "justify-center p-2.5" : "px-3 py-2.5"
              )}
              title={collapsed ? "Export Profile" : undefined}
            >
              <Download size={18} />
              {!collapsed && "Export Profile"}
            </button>
            <button
              onClick={() => checkUpdates()}
              className={clsx(
                "w-full flex items-center gap-3 rounded-lg text-sm font-medium text-text-muted hover:bg-surface-hover hover:text-text transition-colors",
                collapsed ? "justify-center p-2.5" : "px-3 py-2.5"
              )}
              title={collapsed ? "Check Updates" : undefined}
            >
              <RefreshCw size={18} />
              {!collapsed && "Check Updates"}
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className={clsx(
                "w-full flex items-center gap-3 rounded-lg text-sm font-medium text-text-muted hover:bg-surface-hover hover:text-text transition-colors mt-2",
                collapsed ? "justify-center p-2.5" : "px-3 py-2.5"
              )}
              title={collapsed ? "Settings" : undefined}
            >
              <Settings size={18} />
              {!collapsed && "Settings"}
            </button>
          </div>
        </div>
      </div>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
