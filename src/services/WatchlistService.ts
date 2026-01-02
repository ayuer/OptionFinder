import type { HistoryItem } from './messageTypes';

const WATCHLIST_STORAGE_KEY = 'option_tool_watchlist';
const MAX_WATCHLIST_ITEMS = 50;

export const WatchlistService = {
    getWatchlist: (): HistoryItem[] => {
        try {
            const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to parse watchlist:', error);
            return [];
        }
    },

    saveWatchlistItem: (item: HistoryItem): void => {
        try {
            const watchlist = WatchlistService.getWatchlist();
            // Avoid duplicates for same symbol/date
            const filtered = watchlist.filter(i => !(i.symbol === item.symbol && i.expirationDate === item.expirationDate));
            const newWatchlist = [item, ...filtered].slice(0, MAX_WATCHLIST_ITEMS);
            localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(newWatchlist));
            window.dispatchEvent(new Event('watchlistUpdated'));
        } catch (error) {
            console.error('Failed to save watchlist item:', error);
        }
    },

    clearWatchlist: (): void => {
        localStorage.removeItem(WATCHLIST_STORAGE_KEY);
    },

    deleteWatchlistItem: (id: string): void => {
        try {
            const watchlist = WatchlistService.getWatchlist();
            const newWatchlist = watchlist.filter(item => item.id !== id);
            localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(newWatchlist));
            window.dispatchEvent(new Event('watchlistUpdated'));
        } catch (error) {
            console.error('Failed to delete watchlist item:', error);
        }
    },

    updateValuation: (symbol: string, expirationDate: string, valuation: number): void => {
        try {
            const watchlist = WatchlistService.getWatchlist();
            const index = watchlist.findIndex(i => i.symbol === symbol && i.expirationDate === expirationDate);
            if (index !== -1) {
                watchlist[index].valuation = valuation;
                localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
                window.dispatchEvent(new Event('watchlistUpdated'));
            }
        } catch (error) {
            console.error('Failed to update valuation:', error);
        }
    },

    reorderWatchlist: (items: HistoryItem[]): void => {
        try {
            localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(items));
            window.dispatchEvent(new Event('watchlistUpdated'));
        } catch (error) {
            console.error('Failed to reorder watchlist:', error);
        }
    }
};
