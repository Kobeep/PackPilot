import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

export function useKeyboardShortcuts(searchInputRef: React.RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { closeDetail, detailApp } = useAppStore.getState();

      // Escape: close modal or clear search
      if (e.key === 'Escape') {
        if (detailApp) {
          closeDetail();
          return;
        }
        const { searchQuery, setSearchQuery } = useAppStore.getState();
        if (searchQuery) {
          setSearchQuery('');
        }
        searchInputRef.current?.blur();
        return;
      }

      // Ctrl+K or Cmd+K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Ctrl+Shift+I: Install selected
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        const { selectedApps, installSelectedApps, isInstalling } = useAppStore.getState();
        if (selectedApps.size > 0 && !isInstalling) {
          installSelectedApps();
        }
        return;
      }

      // Ctrl+Shift+U: Check updates
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'U') {
        e.preventDefault();
        useAppStore.getState().checkUpdates();
        return;
      }

      // Ctrl+E: Export profile
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        useAppStore.getState().exportProfile();
        return;
      }

      // Ctrl+I: Import profile (without shift)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'i') {
        e.preventDefault();
        useAppStore.getState().importProfile();
        return;
      }

      // Ctrl+B: Toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        useAppStore.getState().toggleSidebar();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchInputRef]);
}
