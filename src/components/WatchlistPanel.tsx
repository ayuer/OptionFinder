import React, { useEffect, useState } from 'react';
import { WatchlistService } from '../services/WatchlistService';
import type { HistoryItem } from '../services/messageTypes';
import { useMessagesDispatch } from '../services/messageHooks';
import { ExternalLink, ListFilter, GripVertical, Calendar, Clock } from 'lucide-react';

interface WatchlistPanelProps {
    onClose: () => void;
    onRestore: (item: HistoryItem) => void;
}

export const WatchlistPanel: React.FC<WatchlistPanelProps> = ({ onClose, onRestore }) => {
    const [watchlist, setWatchlist] = useState<HistoryItem[]>([]);
    const dispatch = useMessagesDispatch();

    const loadWatchlist = () => {
        setWatchlist(WatchlistService.getWatchlist());
    };

    // Calculate days to expiration
    const calculateDTE = (expirationDate: string): number => {
        const expDate = new Date(expirationDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expDate.setHours(0, 0, 0, 0);
        const diffTime = expDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Format expiration date
    const formatExpirationDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    useEffect(() => {
        loadWatchlist();
        window.addEventListener('watchlistUpdated', loadWatchlist);
        return () => {
            window.removeEventListener('watchlistUpdated', loadWatchlist);
        };
    }, []);

    const handleRestore = (item: HistoryItem) => {
        onRestore(item);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        WatchlistService.deleteWatchlistItem(id);
    };

    const handleSymbolClick = (e: React.MouseEvent, symbol: string) => {
        e.stopPropagation();
        // Calculate timestamp for 40-60 days from now
        const now = new Date();
        const targetDate = new Date(now.getTime() + 50 * 24 * 60 * 60 * 1000);
        // Find the next Friday (standard option expiry)
        const day = targetDate.getDay();
        const diff = (day <= 5) ? (5 - day) : (12 - day);
        targetDate.setDate(targetDate.getDate() + diff);
        targetDate.setHours(12, 0, 0, 0); // Noon UTC roughly

        const timestamp = Math.floor(targetDate.getTime() / 1000);
        const url = `https://finance.yahoo.com/quote/${symbol}/options/?date=${timestamp}&type=puts`;

        // Use chrome.tabs to update the current tab
        if (typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.id) {
                    chrome.tabs.update(tabs[0].id, { url });
                }
            });
        } else {
            window.open(url, '_blank');
        }
    };

    const onDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData('index', index.toString());
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const onDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData('index'));
        if (dragIndex === dropIndex) return;

        const newWatchlist = [...watchlist];
        const [draggedItem] = newWatchlist.splice(dragIndex, 1);
        newWatchlist.splice(dropIndex, 0, draggedItem);

        setWatchlist(newWatchlist);
        WatchlistService.reorderWatchlist(newWatchlist);
    };

    return (
        <div className="absolute inset-x-0 bottom-0 top-0 bg-white z-50 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="p-5 border-b border-neutral-200 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2.5 tracking-wider">
                    <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center">
                        <ListFilter className="w-4 h-4 text-white" />
                    </div>
                    My Watchlist
                </h3>
                <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-xl transition-all duration-200 active:scale-95">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                {watchlist.length === 0 ? (
                    <div className="text-center text-neutral-400 text-sm mt-10">Your watchlist is empty</div>
                ) : (
                    <div className="space-y-2">
                        {watchlist.map((item, index) => {
                            const dte = calculateDTE(item.expirationDate);
                            const formattedDate = formatExpirationDate(item.expirationDate);

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleRestore(item)}
                                    draggable
                                    onDragStart={(e) => onDragStart(e, index)}
                                    onDragOver={onDragOver}
                                    onDrop={(e) => onDrop(e, index)}
                                    className="bg-white p-4 rounded-xl border border-neutral-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100/50 cursor-pointer transition-all duration-200 group relative hover:-translate-y-0.5"
                                >
                                    {/* Drag Handle & Delete Button */}
                                    <div className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-300 cursor-grab active:cursor-grabbing">
                                        <GripVertical className="w-3 h-3" />
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(e, item.id)}
                                        className="absolute top-3 right-3 text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                                    >
                                        ✕
                                    </button>

                                    <div className="pl-4">
                                        {/* Header: Symbol + Expiration */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div
                                                onClick={(e) => handleSymbolClick(e, item.symbol)}
                                                className="font-black text-2xl text-blue-600 hover:text-blue-700 flex items-center gap-1.5 group/symbol"
                                            >
                                                {item.symbol}
                                                <ExternalLink className="w-4 h-4 opacity-0 group-hover/symbol:opacity-100 transition-opacity" />
                                            </div>

                                            {/* Expiration Date - More Prominent */}
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                                                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                                    <span className="text-xs font-bold text-blue-700">
                                                        {formattedDate}
                                                    </span>
                                                </div>
                                                {/* DTE Badge */}
                                                <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black ${
                                                    dte <= 7 ? 'bg-red-50 text-red-600' :
                                                    dte <= 30 ? 'bg-orange-50 text-orange-600' :
                                                    'bg-neutral-100 text-neutral-600'
                                                }`}>
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {dte}d
                                                </div>
                                            </div>
                                        </div>

                                        {/* Price & Valuation */}
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-sm">
                                                <span className="text-neutral-500 font-medium">Price: </span>
                                                <span className="text-neutral-900 font-bold text-base">${item.price.toFixed(2)}</span>
                                            </div>

                                            {item.valuation && (
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="text-neutral-400 font-medium">Valuation:</span>
                                                    <span className="text-blue-600 font-bold">${item.valuation.toFixed(2)}</span>
                                                    <span className={`font-bold px-1.5 py-0.5 rounded ${
                                                        item.price > item.valuation
                                                            ? 'bg-red-50 text-red-600'
                                                            : 'bg-emerald-50 text-emerald-600'
                                                    }`}>
                                                        {item.price > item.valuation ? '↑' : '↓'}
                                                        {Math.abs((item.price - item.valuation) / item.valuation * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Sentiment - Only show if exists */}
                                        {item.analysis && (
                                            <div className="flex items-center justify-between text-[10px]">
                                                <div className={`px-2 py-1 rounded-md font-bold uppercase ${
                                                    item.analysis.sentiment === 'bullish' ? 'bg-emerald-50 text-emerald-600' :
                                                    item.analysis.sentiment === 'bearish' ? 'bg-rose-50 text-rose-600' :
                                                    'bg-neutral-100 text-neutral-600'
                                                }`}>
                                                    {item.analysis.sentiment}
                                                </div>
                                                <span className="text-neutral-400">
                                                    {new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
