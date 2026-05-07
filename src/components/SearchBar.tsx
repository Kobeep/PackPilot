import { Search, X, Loader2, Command } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { forwardRef } from 'react';

interface SearchBarProps {}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>((_props, ref) => {
  const { searchQuery, setSearchQuery, isSearching } = useAppStore();

  return (
    <div className="h-20 border-b border-white/5 flex items-center px-8 bg-background/50 backdrop-blur-xl sticky top-0 z-10">
      <div className="relative w-full max-w-2xl group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary transition-colors">
          <Search size={20} />
        </div>
        <input
          ref={ref}
          type="text"
          className="w-full bg-surface/50 border border-white/5 rounded-2xl py-3 pl-12 pr-24 text-text placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all shadow-inner"
          placeholder="Search for apps, tools, or games..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-2">
          {isSearching && (
            <Loader2 className="animate-spin text-primary" size={18} />
          )}
          {searchQuery && !isSearching && (
            <button 
              onClick={() => setSearchQuery('')}
              className="text-text-muted hover:text-text transition-colors"
            >
              <X size={18} />
            </button>
          )}
          {!searchQuery && (
            <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-surface-hover border border-white/10 text-text-muted/50 text-xs font-mono">
              <Command size={10} /> K
            </kbd>
          )}
        </div>
      </div>
    </div>
  );
});

SearchBar.displayName = 'SearchBar';
