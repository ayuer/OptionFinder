import React, { useState } from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export type TabType = 'chat' | 'settings';

interface Tab {
  type: TabType;
  label: string;
  icon: string;
}

import { WatchlistPanel } from './WatchlistPanel';
import type { HistoryItem } from '../services/messageTypes';

export const Layout: React.FC<LayoutProps> = ({
  children,
}) => {
  const [showWatchlist, setShowWatchlist] = useState(false);

  React.useEffect(() => {
    const handleOpenWatchlist = () => setShowWatchlist(true);
    window.addEventListener('openWatchlist', handleOpenWatchlist);
    return () => window.removeEventListener('openWatchlist', handleOpenWatchlist);
  }, []);

  const handleRestore = (item: HistoryItem) => {
    setShowWatchlist(false);
    // Dispatch event for ChatInterface to pick up
    window.dispatchEvent(new CustomEvent('restoreWatchlist', { detail: item }));
  };

  return (
    <div className="flex flex-col h-screen w-full bg-chrome-bg relative">
      {/* Content Area */}
      {children}

      {/* Watchlist Panel Overlay */}
      {showWatchlist && (
        <WatchlistPanel
          onClose={() => setShowWatchlist(false)}
          onRestore={handleRestore}
        />
      )}
    </div>
  );
};

// Tab Content Wrapper Component
export const TabContent: React.FC<{
  tabType: TabType;
  isActive?: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ isActive = false, children, className = '' }) => {
  if (!isActive) return null;

  return <div className={`h-full ${className}`}>{children}</div>;
};
