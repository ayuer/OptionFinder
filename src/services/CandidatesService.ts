import type { CandidateItem } from './messageTypes';

const CANDIDATES_STORAGE_KEY = 'option_tool_candidates';

export const CandidatesService = {
    getCandidates: (): CandidateItem[] => {
        try {
            const stored = localStorage.getItem(CANDIDATES_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to parse candidates:', error);
            return [];
        }
    },

    saveCandidate: (item: CandidateItem): void => {
        try {
            const candidates = CandidatesService.getCandidates();
            // Avoid duplicates for same symbol/strike/type/date
            const isDuplicate = candidates.some(c =>
                c.symbol === item.symbol &&
                c.strike === item.strike &&
                c.type === item.type &&
                c.expirationDate === item.expirationDate
            );

            if (isDuplicate) return;

            const newCandidates = [item, ...candidates];
            localStorage.setItem(CANDIDATES_STORAGE_KEY, JSON.stringify(newCandidates));
            window.dispatchEvent(new Event('candidatesUpdated'));
        } catch (error) {
            console.error('Failed to save candidate:', error);
        }
    },

    removeCandidate: (id: string): void => {
        try {
            const candidates = CandidatesService.getCandidates();
            const newCandidates = candidates.filter(c => c.id !== id);
            localStorage.setItem(CANDIDATES_STORAGE_KEY, JSON.stringify(newCandidates));
            window.dispatchEvent(new Event('candidatesUpdated'));
        } catch (error) {
            console.error('Failed to remove candidate:', error);
        }
    },

    clearCandidates: (): void => {
        localStorage.removeItem(CANDIDATES_STORAGE_KEY);
        window.dispatchEvent(new Event('candidatesUpdated'));
    },

    /**
     * Get all pinned strike prices for a specific symbol and expiration date
     * @param symbol - Stock symbol (e.g., 'AAPL')
     * @param expirationDate - Expiration date string (e.g., 'Dec 20, 2024')
     * @returns Array of strike prices that have been pinned to Candidates Pool
     */
    getPinnedStrikesForContext: (symbol: string, expirationDate: string): number[] => {
        try {
            const candidates = CandidatesService.getCandidates();
            const pinnedStrikes = candidates
                .filter(c =>
                    c.symbol === symbol &&
                    c.expirationDate === expirationDate
                )
                .map(c => c.strike);

            // Remove duplicates and return
            return Array.from(new Set(pinnedStrikes));
        } catch (error) {
            console.error('Failed to get pinned strikes:', error);
            return [];
        }
    }
};
