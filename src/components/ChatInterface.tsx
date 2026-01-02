import React, { useState, useEffect, useRef } from 'react';
import { AIService, type APIMessage } from '../services/AIService';
import { useMessages, useMessagesDispatch } from '../services/messageHooks';
import { useAIConfig } from '../services/aiConfigHooks';
import { WatchlistService } from '../services/WatchlistService';
import { OptionChainService } from '../services/OptionChainService';
import { CandidatesService } from '../services/CandidatesService';
import { WatchlistPanel } from './WatchlistPanel';
import type { OptionChainData, AiGeneratedOptionAnalysis, HistoryItem, CandidateItem } from '../services/messageTypes';
import logoIcon from '../assets/logo.png';
import {
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ReferenceArea,
  ReferenceLine,
  ComposedChart,
  BarChart,
  LineChart,
  Line
} from 'recharts';
import { RefreshCw, TrendingUp, AlertCircle, Layers, Activity, ListFilter, History, BarChart2, Plus, Pin, Trash2, ArrowRight, Table, Settings, Check, X } from 'lucide-react';

const getModelDisplayName = (provider: string) => {
  switch (provider) {
    case 'gemini': return 'Gemini';
    case 'claude': return 'Claude 3.5';
    default: return 'AI Assistant';
  }
};

// --- Sub Components ---

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return <TooltipContent data={payload[0].payload} label={label} />;
  }
  return null;
};

const TooltipContent = ({ data, label, isFixed, onPin, onCancel, isPinned }: any) => {
  const isPositive = data.percentChange >= 0;
  const sentimentColor = isPositive ? 'text-emerald-600' : 'text-rose-600';
  const sentimentBg = isPositive ? 'bg-emerald-50' : 'bg-rose-50';

  return (
    <div className={`bg-white p-0 border-2 border-neutral-300 shadow-[0_12px_40px_rgba(0,0,0,0.2)] rounded-2xl min-w-[220px] z-[100] overflow-hidden font-sans ${isFixed ? 'ring-2 ring-blue-500 animate-in zoom-in-95 duration-200' : 'ring-4 ring-white/80'}`} style={{ background: 'white', opacity: 1 }}>
      {/* Header: Strike & Type */}
      <div className="bg-gradient-to-r from-neutral-50 to-neutral-100/50 px-4 py-2 border-b border-neutral-200 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Strike</span>
          <span className="text-lg font-black text-neutral-800">${label}</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-black text-indigo-400 tracking-wider block">IV</span>
          <span className="text-sm font-bold text-indigo-600">{data.iv.toFixed(1)}%</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Hero Section: Price & Delta */}
        <div className="flex justify-between items-end pb-2 border-b border-dashed border-neutral-100">
          <div>
            <span className="text-[10px] text-neutral-400 font-bold uppercase block mb-0.5">Option Price</span>
            <span className="text-2xl font-black text-neutral-900 tracking-tight">${data.price.toFixed(2)}</span>
          </div>
          <div className="text-right">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${sentimentBg} ${sentimentColor} mb-1 inline-block`}>
              {isPositive ? '+' : ''}{data.percentChange.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* New Metrics: Delta & Yield */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
            <span className="text-[9px] text-blue-400 font-black uppercase block mb-0.5">Est. Delta</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span className="text-sm font-bold text-blue-700">
                {(() => {
                  const delta = data.hasCall ? data.callDelta : data.putDelta;
                  // Always show at least 3 decimals to make small OTM deltas visible
                  if (Math.abs(delta) < 0.001) return delta.toFixed(4);
                  if (Math.abs(delta) < 0.1) return delta.toFixed(3);
                  return delta.toFixed(2);
                })()}
              </span>
            </div>
          </div>
          <div className="bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50">
            <span className="text-[9px] text-emerald-500 font-black uppercase block mb-0.5">Ann. Yield</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-sm font-bold text-emerald-700">
                {data.yield ? data.yield.toFixed(1) : '0.0'}%
              </span>
            </div>
          </div>
        </div>

        {/* Secondary Grid */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs pb-2">
          <div className="flex justify-between">
            <span className="text-neutral-400">Open Int.</span>
            <span className="font-bold text-neutral-700">{data.oi.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Volume</span>
            <span className="font-bold text-neutral-700">{data.volume.toLocaleString()}</span>
          </div>
        </div>

        {/* Pinned Status Indicator */}
        {isPinned && !isFixed && (
          <div className="px-3 py-2 bg-orange-50 rounded-lg border border-orange-100 flex items-center justify-center gap-2">
            <Pin className="w-3.5 h-3.5 text-orange-600" />
            <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider">
              Already in Pool
            </span>
          </div>
        )}

        {/* Actions for Fixed Card */}
        {isFixed && (
          <div className="flex gap-2 pt-2 border-t border-neutral-100">
            <button
              onClick={onCancel}
              className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase text-neutral-400 hover:bg-neutral-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onPin}
              className="flex-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 shadow-lg shadow-blue-100 transition-all active:scale-95"
            >
              <Pin className="w-3 h-3" />
              Add to Pool
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const CandidatesDashboard: React.FC<{
  candidates: CandidateItem[];
  onRemove: (id: string) => void;
  onNavigate: (url: string) => void;
}> = ({ candidates, onRemove, onNavigate }) => {
  if (candidates.length === 0) return null;

  return (
    <div className="mx-4 mb-8 bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 animate-in slide-in-from-top-4 duration-700">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center">
            <Table className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest">Candidates Pool</h3>
            <p className="text-[10px] text-slate-300 font-bold">Cross-Ticker Comparison Analysis</p>
          </div>
        </div>
        <div className="bg-slate-700/50 px-3 py-1 rounded-full text-[10px] font-black text-blue-300 border border-slate-600/50">
          {candidates.length} ASSETS
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-none">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50/50 border-b border-neutral-100">
              <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-tighter">Symbol</th>
              <th className="px-2 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-tighter">Expiry / DTE</th>
              <th className="px-2 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-tighter">Strike</th>
              <th className="px-2 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-tighter">Type</th>
              <th className="px-2 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-tighter text-right">Opt Price</th>
              <th className="px-2 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-tighter text-center">Delta</th>
              <th className="px-2 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-tighter text-right">Underlying</th>
              <th className="px-2 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-tighter text-right">Ann. Yield</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {candidates.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-blue-50/40 hover:shadow-sm transition-all duration-200 group cursor-pointer"
                onClick={() => onNavigate(item.url)}
              >
                <td className="px-6 py-4">
                  <div className="font-black text-blue-600 text-sm tracking-tight">{item.symbol}</div>
                </td>
                <td className="px-2 py-4">
                  <div className="text-[11px] font-bold text-neutral-600 leading-tight">
                    {item.expirationDate}
                    <div className="text-blue-500 font-black text-[9px] mt-0.5">{OptionChainService.calculateDTE(item.expirationDate)}D</div>
                  </div>
                </td>
                <td className="px-2 py-4">
                  <div className="text-[13px] font-black text-neutral-900">${item.strike}</div>
                </td>
                <td className="px-2 py-4">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${item.type === 'call' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                    {item.type}
                  </span>
                </td>
                <td className="px-2 py-4 text-right">
                  <div className="text-[13px] font-black text-neutral-900">${item.optionPrice.toFixed(2)}</div>
                </td>
                <td className="px-2 py-4 text-center">
                  <div className="inline-flex items-center gap-1 bg-neutral-50 px-2 py-0.5 rounded-md border border-neutral-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    <span className="text-[11px] font-black text-indigo-700">
                      {(() => {
                        const delta = item.delta;
                        // Progressive precision for better visibility of OTM deltas
                        if (Math.abs(delta) < 0.001) return delta.toFixed(4);
                        if (Math.abs(delta) < 0.1) return delta.toFixed(3);
                        return delta.toFixed(2);
                      })()}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-4 text-right">
                  <div className="text-[11px] font-bold text-neutral-500">${item.underlyingPrice.toFixed(2)}</div>
                </td>
                <td className="px-2 py-4 text-right">
                  <div className="text-[12px] font-black text-emerald-600 italic">{item.annualizedYield.toFixed(1)}%</div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.id);
                    }}
                    className="p-2 text-neutral-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ContextMismatchBanner: React.FC<{
  currentContext: { symbol?: string; date?: string };
  dataContext: { symbol?: string; date?: string };
  onSync: () => void;
}> = ({ currentContext, dataContext, onSync }) => {
  if (!currentContext.symbol || !dataContext.symbol) return null;

  const symbolMismatch = currentContext.symbol !== dataContext.symbol;

  // Check date mismatch: currentContext.date is timestamp, dataContext.date is formatted date
  let dateMismatch = false;
  let mismatchMessage = '';

  if (currentContext.date && dataContext.date) {
    // Convert timestamp to date string for comparison
    const currentDate = new Date(parseInt(currentContext.date) * 1000);
    const dataDate = new Date(dataContext.date);

    // Compare dates (ignore time)
    currentDate.setHours(0, 0, 0, 0);
    dataDate.setHours(0, 0, 0, 0);

    dateMismatch = currentDate.getTime() !== dataDate.getTime();
  }

  if (symbolMismatch && dateMismatch) {
    mismatchMessage = `Showing ${dataContext.symbol} (${dataContext.date}), but you are on ${currentContext.symbol} with different expiration`;
  } else if (symbolMismatch) {
    mismatchMessage = `Showing ${dataContext.symbol}, but you are on ${currentContext.symbol}`;
  } else if (dateMismatch && dataContext.date && currentContext.date) {
    const dataDateFormatted = new Date(dataContext.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const currentDateFormatted = new Date(parseInt(currentContext.date) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    mismatchMessage = `Showing data for ${dataDateFormatted}, but you are viewing ${currentDateFormatted}`;
  }

  if (!symbolMismatch && !dateMismatch) return null;

  return (
    <div className="mx-4 mb-4 bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top-4 duration-500 shadow-sm relative z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
          <AlertCircle className="w-4 h-4 text-orange-600" />
        </div>
        <div>
          <div className="text-[11px] font-black text-orange-800 uppercase tracking-tight">
            {dateMismatch && !symbolMismatch ? 'Expiration Date Mismatch' : 'Context Mismatch'}
          </div>
          <div className="text-[10px] text-orange-600 font-bold">{mismatchMessage}</div>
        </div>
      </div>
      <button
        onClick={onSync}
        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[10px] font-black shadow-lg shadow-orange-200 transition-all active:scale-95"
      >
        SYNC NOW
      </button>
    </div>
  );
};

const CustomBar = (props: any) => {
  const { x, y, width, height, activeColor } = props;
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={Math.max(0, height)}
      fill={activeColor}
      rx={width > 4 ? 4 : 2}
      ry={width > 4 ? 4 : 2}
    />
  );
};

const CollectedOptionChainDisplay: React.FC<{
  data: OptionChainData;
  onAnalyze: (prompt: string) => void;
  onScan: () => void;
  onHome: () => void;
  isLoading: boolean;
  onSave?: () => void;
  isSaved?: boolean;
  valuation?: number;
  onValuationChange?: (val: number) => void;
  onPinCandidate?: (candidate: Omit<CandidateItem, 'id' | 'timestamp' | 'url'>) => string; // Returns candidate ID
  onUndoPin?: (id: string) => void;
}> = ({ data, onAnalyze, onScan, onHome, isLoading, onSave, isSaved, valuation, onValuationChange, onPinCandidate, onUndoPin }) => {
  const stats = React.useMemo(() => OptionChainService.calculateStats(data), [data]);
  const chartData = React.useMemo(() => OptionChainService.prepareChartData(data), [data]);
  const [hoveredChart, setHoveredChart] = useState<string | null>(null);
  const [activeStrike, setActiveStrike] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [lastPinnedId, setLastPinnedId] = useState<string | null>(null);
  const [pinnedStrikes, setPinnedStrikes] = useState<number[]>([]);
  const toastTimeoutRef = React.useRef<number | null>(null);

  const itmStrikes = chartData.filter(d => d.inTheMoney).map(d => d.strike);
  const itmStart = itmStrikes.length > 0 ? Math.min(...itmStrikes) : null;
  const itmEnd = itmStrikes.length > 0 ? Math.max(...itmStrikes) : null;
  const ITM_COLOR = "rgb(20, 71, 102)";

  // Load pinned strikes for current context and listen for updates
  useEffect(() => {
    const loadPinnedStrikes = () => {
      if (data) {
        const pinned = CandidatesService.getPinnedStrikesForContext(
          data.symbol,
          data.expirationDate
        );
        setPinnedStrikes(pinned);
        console.log('📌 Loaded pinned strikes:', pinned, 'for', data.symbol, data.expirationDate);
      }
    };

    // Initial load
    loadPinnedStrikes();

    // Listen for candidates updates
    window.addEventListener('candidatesUpdated', loadPinnedStrikes);

    return () => {
      window.removeEventListener('candidatesUpdated', loadPinnedStrikes);
    };
  }, [data.symbol, data.expirationDate]);

  // Custom Tooltip with pinned status
  const CustomTooltipWithPinned = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const strike = payload[0].payload.strike;
      const isPinned = pinnedStrikes.includes(strike);
      return <TooltipContent data={payload[0].payload} label={label} isPinned={isPinned} />;
    }
    return null;
  };

  const handleMouseMove = (state: any) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      const strike = state.activePayload[0].payload.strike;
      if (strike !== activeStrike) setActiveStrike(strike);
    }
  };

  const handleMouseLeave = () => {
    setActiveStrike(null);
    setHoveredChart(null);
  };

  const showPinToast = (strike: number, type: string, candidateId: string) => {
    // Clear any existing timeout
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToastMessage(`${type.toUpperCase()} $${strike} added to pool`);
    setLastPinnedId(candidateId);
    setShowToast(true);

    // Auto-hide after 3 seconds
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false);
      setLastPinnedId(null);
    }, 3000);
  };

  const handleUndo = () => {
    if (lastPinnedId && onUndoPin) {
      onUndoPin(lastPinnedId);
      setShowToast(false);
      setLastPinnedId(null);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    }
  };

  // Handler for Bar charts (onClick receives: data, index, event)
  const handleBarClick = (barData: any, index: number, _event: React.MouseEvent) => {
    console.log('🖱️ Bar Click - barData:', barData);
    console.log('🖱️ Bar Click - index:', index);
    console.log('📊 onPinCandidate exists?', !!onPinCandidate);

    // Extract the actual data point from the bar data
    const clickedData = barData?.payload;

    if (!clickedData || !onPinCandidate) {
      console.warn('⚠️ Missing clickedData or onPinCandidate callback', {
        barData,
        clickedData,
        hasCallback: !!onPinCandidate
      });
      return;
    }

    console.log('✅ Processing click on strike:', clickedData.strike);
    console.log('📊 Strike data:', {
      strike: clickedData.strike,
      hasCall: clickedData.hasCall,
      hasPut: clickedData.hasPut,
      callDelta: clickedData.callDelta,
      putDelta: clickedData.putDelta,
      price: clickedData.price,
      yield: clickedData.yield
    });

    // Determine which option type to use
    // If both exist, prefer the one with higher absolute delta (more liquid/active)
    let optionType: 'call' | 'put';
    let delta: number;

    if (clickedData.hasCall && clickedData.hasPut) {
      // Both exist - choose based on which is closer to ATM (higher absolute delta)
      const absCallDelta = Math.abs(clickedData.callDelta);
      const absPutDelta = Math.abs(clickedData.putDelta);

      if (absCallDelta >= absPutDelta) {
        optionType = 'call';
        delta = clickedData.callDelta;
      } else {
        optionType = 'put';
        delta = clickedData.putDelta;
      }

      console.log(`⚖️ Both Call and Put exist. Choosing ${optionType.toUpperCase()} (delta: ${delta.toFixed(3)})`);
    } else if (clickedData.hasCall) {
      optionType = 'call';
      delta = clickedData.callDelta;
      console.log(`📞 Only Call exists (delta: ${delta.toFixed(3)})`);
    } else if (clickedData.hasPut) {
      optionType = 'put';
      delta = clickedData.putDelta;
      console.log(`📉 Only Put exists (delta: ${delta.toFixed(3)})`);
    } else {
      console.error('❌ No Call or Put data available!');
      return;
    }

    // Immediately pin to pool
    const candidateId = onPinCandidate({
      symbol: data.symbol,
      expirationDate: data.expirationDate,
      strike: clickedData.strike,
      type: optionType,
      delta: delta,
      optionPrice: clickedData.price,
      underlyingPrice: data.price,
      annualizedYield: clickedData.yield
    });

    console.log('📌 Candidate added with ID:', candidateId);

    // Show toast with undo option
    showPinToast(clickedData.strike, optionType.toUpperCase() as 'CALL' | 'PUT', candidateId);
  };

  // Handler for Line/Area charts (onClick receives: props, event)
  const handleLineClick = (props: any, _event: React.MouseEvent) => {
    console.log('🖱️ Line/Area Click - props:', props);
    console.log('📊 onPinCandidate exists?', !!onPinCandidate);

    // Extract the actual data point from props
    const clickedData = props?.payload;

    if (!clickedData || !onPinCandidate) {
      console.warn('⚠️ Missing clickedData or onPinCandidate callback', {
        props,
        clickedData,
        hasCallback: !!onPinCandidate
      });
      return;
    }

    console.log('✅ Processing click on strike:', clickedData.strike);
    console.log('📊 Strike data:', {
      strike: clickedData.strike,
      hasCall: clickedData.hasCall,
      hasPut: clickedData.hasPut,
      callDelta: clickedData.callDelta,
      putDelta: clickedData.putDelta,
      price: clickedData.price,
      yield: clickedData.yield
    });

    // Determine which option type to use
    // If both exist, prefer the one with higher absolute delta (more liquid/active)
    let optionType: 'call' | 'put';
    let delta: number;

    if (clickedData.hasCall && clickedData.hasPut) {
      // Both exist - choose based on which is closer to ATM (higher absolute delta)
      const absCallDelta = Math.abs(clickedData.callDelta);
      const absPutDelta = Math.abs(clickedData.putDelta);

      if (absCallDelta >= absPutDelta) {
        optionType = 'call';
        delta = clickedData.callDelta;
      } else {
        optionType = 'put';
        delta = clickedData.putDelta;
      }

      console.log(`⚖️ Both Call and Put exist. Choosing ${optionType.toUpperCase()} (delta: ${delta.toFixed(3)})`);
    } else if (clickedData.hasCall) {
      optionType = 'call';
      delta = clickedData.callDelta;
      console.log(`📞 Only Call exists (delta: ${delta.toFixed(3)})`);
    } else if (clickedData.hasPut) {
      optionType = 'put';
      delta = clickedData.putDelta;
      console.log(`📉 Only Put exists (delta: ${delta.toFixed(3)})`);
    } else {
      console.error('❌ No Call or Put data available!');
      return;
    }

    // Immediately pin to pool
    const candidateId = onPinCandidate({
      symbol: data.symbol,
      expirationDate: data.expirationDate,
      strike: clickedData.strike,
      type: optionType,
      delta: delta,
      optionPrice: clickedData.price,
      underlyingPrice: data.price,
      annualizedYield: clickedData.yield
    });

    console.log('📌 Candidate added with ID:', candidateId);

    // Show toast with undo option
    showPinToast(clickedData.strike, optionType.toUpperCase() as 'CALL' | 'PUT', candidateId);
  };

  const chartMargin = { top: 10, right: 30, left: 0, bottom: 0 };
  const yAxisWidth = 40;
  const xAxisDomain = ['dataMin', 'dataMax'] as const;

  return (
    <div className="mb-6 bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="px-4 py-3 bg-neutral-50/50 border-b border-neutral-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={onHome} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-400 hover:text-neutral-900">
            <TrendingUp className="w-4 h-4" />
          </button>
          <span className="font-bold text-neutral-800 tracking-tight text-sm uppercase">{data.symbol} Chain Details</span>
        </div>
        <div className="flex items-center gap-2">
          {isSaved && (
            <span className="text-[10px] px-3 py-1 bg-blue-50 text-blue-600 rounded-lg font-black uppercase border border-blue-100 flex items-center gap-1.5">
              SAVED
            </span>
          )}
          <button onClick={onScan} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 rounded-xl text-[10px] font-black text-neutral-500 hover:border-neutral-900 transition-all shadow-sm">
            <RefreshCw className="w-3 h-3" />
            RE-SCAN
          </button>
        </div>
      </div>

      <div className="p-4 relative">
        <div className="grid grid-cols-3 gap-2 mb-8">
          <div className="bg-blue-50/40 p-3 rounded-2xl border border-blue-100/50">
            <div className="text-[10px] text-blue-600 font-bold uppercase mb-0.5">Symbol</div>
            <div className="font-black text-neutral-800 text-sm">{data.symbol}</div>
          </div>
          <div className="bg-emerald-50/40 p-3 rounded-2xl border border-emerald-100/50">
            <div className="text-[10px] text-emerald-600 font-bold uppercase mb-0.5">Price / Valuation</div>
            <div className="flex items-center justify-between gap-1 overflow-hidden">
              <span className="font-black text-neutral-800 text-sm">${data.price.toFixed(2)}</span>
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-neutral-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Set Val"
                  value={valuation || ''}
                  onChange={(e) => onValuationChange?.(parseFloat(e.target.value))}
                  className="w-16 bg-transparent border-none text-[12px] p-0 focus:ring-0 placeholder:text-neutral-300 font-black text-emerald-700"
                />
              </div>
            </div>
            {valuation && (
              <div className={`mt-0.5 text-[9px] font-black ${data.price > valuation ? 'text-red-500' : 'text-emerald-500'}`}>
                {data.price > valuation ? 'OVERVALUED' : 'UNDERVALUED'} {Math.abs(((data.price - valuation) / valuation * 100)).toFixed(1)}%
              </div>
            )}
          </div>
          <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 text-right">
            <div className="text-[10px] text-neutral-500 font-bold uppercase mb-0.5">Expiry / DTE</div>
            <div className="font-bold text-neutral-800 text-[11px] leading-tight">
              {data.expirationDate} <br />
              <span className="text-blue-500 font-black">{stats.dte}D</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative h-[160px]">
            <div className="absolute top-2 left-10 z-10 text-[10px] font-black text-neutral-400 uppercase tracking-widest bg-white/80 px-2 py-0.5 rounded backdrop-blur-sm border border-neutral-100/50 shadow-sm">Open Interest</div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                syncId="option-chain"
                margin={chartMargin}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onMouseEnter={() => setHoveredChart('oi')}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="strike" hide type="number" domain={xAxisDomain} />
                <YAxis yAxisId="main" fontSize={11} fontWeight="bold" width={50} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis yAxisId="dummy" orientation="right" tick={false} axisLine={false} width={36} />
                {hoveredChart === 'oi' && <Tooltip content={<CustomTooltipWithPinned />} wrapperStyle={{ opacity: 1, zIndex: 1000 }} offset={20} cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }} />}
                {itmStart !== null && itmEnd !== null && <ReferenceArea yAxisId="main" x1={itmStart} x2={itmEnd} fill={ITM_COLOR} fillOpacity={0.25} />}
                {valuation && (
                  <ReferenceLine
                    yAxisId="main"
                    x={valuation}
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    label={{ value: 'VALUATION', position: 'top', fill: '#ef4444', fontSize: 8, fontWeight: 'black' }}
                  />
                )}
                {pinnedStrikes.map(strike => (
                  <ReferenceLine
                    key={`pinned-oi-${strike}`}
                    yAxisId="main"
                    x={strike}
                    stroke="transparent"
                    strokeWidth={0}
                    label={{
                      value: '📌',
                      position: 'insideTop',
                      fill: '#f97316',
                      fontSize: 16,
                      fontWeight: 'black',
                      offset: 10,
                      dx: 6
                    }}
                  />
                ))}
                <Bar
                  yAxisId="main"
                  dataKey="oi"
                  isAnimationActive={false}
                  shape={(props: any) => <CustomBar {...props} activeColor="#2563eb" />}
                  onClick={handleBarClick}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="relative h-[160px]">
            <div className="absolute top-2 left-10 z-10 text-[10px] font-black text-neutral-400 uppercase tracking-widest bg-white/80 px-2 py-0.5 rounded backdrop-blur-sm border border-neutral-100/50 shadow-sm">Volume</div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                syncId="option-chain"
                margin={chartMargin}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onMouseEnter={() => setHoveredChart('volume')}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="strike" hide type="number" domain={xAxisDomain} />
                <YAxis yAxisId="main" fontSize={11} fontWeight="bold" width={50} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis yAxisId="dummy" orientation="right" tick={false} axisLine={false} width={36} />
                {hoveredChart === 'volume' && <Tooltip content={<CustomTooltipWithPinned />} wrapperStyle={{ opacity: 1, zIndex: 1000 }} offset={20} cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }} />}
                {itmStart !== null && itmEnd !== null && <ReferenceArea yAxisId="main" x1={itmStart} x2={itmEnd} fill={ITM_COLOR} fillOpacity={0.25} />}
                {valuation && <ReferenceLine yAxisId="main" x={valuation} stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" />}
                <Bar
                  yAxisId="main"
                  dataKey="volume"
                  isAnimationActive={false}
                  shape={(props: any) => <CustomBar {...props} activeColor="#10b981" />}
                  onClick={handleBarClick}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="relative h-[160px]">
            <div className="absolute top-2 left-10 z-10 text-[10px] font-black text-neutral-400 uppercase tracking-widest bg-white/80 px-2 py-0.5 rounded backdrop-blur-sm border border-neutral-100/50 shadow-sm">Implied Volatility</div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                syncId="option-chain"
                margin={chartMargin}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onMouseEnter={() => setHoveredChart('iv')}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="strike" hide type="number" domain={xAxisDomain} />
                <YAxis yAxisId="main" fontSize={11} fontWeight="bold" width={50} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis yAxisId="dummy" orientation="right" tick={false} axisLine={false} width={36} />
                {hoveredChart === 'iv' && <Tooltip content={<CustomTooltipWithPinned />} wrapperStyle={{ opacity: 1, zIndex: 1000 }} offset={20} cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }} />}
                {itmStart !== null && itmEnd !== null && <ReferenceArea yAxisId="main" x1={itmStart} x2={itmEnd} fill={ITM_COLOR} fillOpacity={0.25} />}
                {valuation && <ReferenceLine yAxisId="main" x={valuation} stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" />}
                <Line
                  yAxisId="main"
                  type="monotone"
                  dataKey="iv"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                  onClick={handleLineClick}
                  style={{ cursor: 'pointer' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="relative h-[200px]">
            <div className="absolute top-2 left-10 z-10 text-[10px] font-black text-neutral-400 uppercase tracking-widest bg-white/80 px-2 py-0.5 rounded backdrop-blur-sm border border-neutral-100/50 shadow-sm">Price / % Change</div>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                syncId="option-chain"
                margin={{ ...chartMargin, bottom: 20 }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onMouseEnter={() => setHoveredChart('price')}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="strike" fontSize={9} fontWeight="black" tickLine={false} axisLine={false} type="number" domain={xAxisDomain} dy={5} />
                <YAxis yAxisId="percent" fontSize={11} fontWeight="bold" width={50} axisLine={false} tickLine={false} tickFormatter={(val) => val.toFixed(0)} tick={{ fill: '#ef4444' }} domain={[(dataMin: number) => Math.min(0, dataMin * 1.1), (dataMax: number) => Math.max(0, dataMax * 1.1)]} />
                <YAxis yAxisId="price" orientation="right" fontSize={11} fontWeight="bold" width={36} axisLine={false} tickLine={false} tick={{ fill: '#6366f1' }} />
                {itmStart !== null && itmEnd !== null && <ReferenceArea yAxisId="price" x1={itmStart} x2={itmEnd} fill={ITM_COLOR} fillOpacity={0.25} />}
                {valuation && <ReferenceLine yAxisId="price" x={valuation} stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" label={{ value: 'VALUATION', position: 'top', fill: '#ef4444', fontSize: 8, fontWeight: 'black' }} />}
                {hoveredChart === 'price' && <Tooltip content={<CustomTooltipWithPinned />} wrapperStyle={{ opacity: 1, zIndex: 1000 }} offset={20} cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }} />}
                <Area yAxisId="price" type="monotone" dataKey="price" stroke="#6366f1" strokeWidth={2} fill="#6366f1" fillOpacity={0.1} isAnimationActive={false} onClick={handleLineClick} style={{ cursor: 'pointer' }} />
                <Bar
                  yAxisId="percent"
                  dataKey="percentChange"
                  barSize={12}
                  isAnimationActive={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.percentChange >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Toast Notification with Undo */}
        {showToast && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[10000] animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 font-black text-sm">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <span>{toastMessage}</span>
              </div>
              <button
                onClick={handleUndo}
                className="ml-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-[11px] font-black uppercase transition-all flex items-center gap-1.5"
              >
                <X className="w-3 h-3" />
                Undo
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => onAnalyze("Perform a deep technical analysis of this option chain. Look for unusual levels or high OI walls.")}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-3xl text-sm font-black transition-all duration-300 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 flex items-center justify-center gap-3 hover:-translate-y-0.5 hover:scale-[1.01] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100"
          >
            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin text-white" /> : <TrendingUp className="w-5 h-5" />}
            <span>GENERATE QUANTITATIVE REPORT</span>
          </button>

          <button
            onClick={onSave}
            disabled={isSaved}
            className={`px-6 py-4 rounded-3xl font-black text-sm uppercase transition-all duration-300 shadow-xl flex items-center gap-2 border-b-4 ${isSaved
              ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white border-emerald-800 shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95'
              }`}
          >
            {isSaved ? <Pin className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
            {isSaved ? 'SAVED' : 'SAVE'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AnalysisResultDisplay: React.FC<{
  result: AiGeneratedOptionAnalysis;
  provider: string;
  onSave?: () => void;
  isSaved?: boolean;
}> = ({ result, provider, onSave, isSaved }) => {
  const sentimentColor =
    result.sentiment === 'bullish' ? 'text-green-600 bg-green-50 border-green-100' :
      result.sentiment === 'bearish' ? 'text-red-600 bg-red-50 border-red-100' : 'text-blue-600 bg-blue-50 border-blue-100';

  return (
    <div className="mb-8 bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="px-5 py-4 bg-neutral-50 border-b border-neutral-100 flex justify-between items-center">
        <span className="font-bold text-neutral-800 flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          {getModelDisplayName(provider)} Insight
        </span>
        <div className="flex items-center gap-3">
          {onSave && !isSaved && (
            <button
              onClick={onSave}
              className="text-[10px] px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg font-black uppercase transition-all duration-200 flex items-center gap-1.5 shadow-lg shadow-emerald-200/50 hover:shadow-emerald-300/50 hover:-translate-y-0.5 active:scale-95"
            >
              <Activity className="w-3.5 h-3.5" />
              SAVE TO WATCHLIST
            </button>
          )}
          {isSaved && (
            <span className="text-[10px] px-3 py-1 bg-blue-50 text-blue-600 rounded-lg font-black uppercase border border-blue-100 flex items-center gap-1.5">
              SAVED
            </span>
          )}
          <span className={`text-[10px] px-3 py-1 rounded-lg font-black uppercase border tracking-widest ${sentimentColor}`}>
            {result.sentiment}
          </span>
        </div>
      </div>
      <div className="p-6 space-y-8">
        <div>
          <div className="text-[10px] font-black text-neutral-400 uppercase mb-3 tracking-[0.2em]">Market Outlook</div>
          <p className="text-[13px] text-neutral-700 leading-relaxed font-medium bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100/50">{result.summary}</p>
        </div>

        <div>
          <div className="text-[10px] font-black text-neutral-400 uppercase mb-3 tracking-[0.2em]">Observations</div>
          <div className="space-y-2">
            {result.keyObservations.map((obs, i) => (
              <div key={i} className="flex gap-4 text-[13px] text-neutral-600 items-start">
                <div className="mt-2 w-1 h-1 rounded-full bg-blue-400 flex-shrink-0"></div>
                <span>{obs}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/50 text-center">
            <div className="text-[9px] text-emerald-600 font-black uppercase mb-1">Support</div>
            <div className="font-black text-neutral-800 text-lg">${result.supportResistance.support}</div>
          </div>
          <div className="bg-rose-50/40 p-4 rounded-2xl border border-rose-100/50 text-center">
            <div className="text-[9px] text-rose-600 font-black uppercase mb-1">Resistance</div>
            <div className="font-black text-neutral-800 text-lg">${result.supportResistance.resistance}</div>
          </div>
        </div>

        <div className="pt-6 border-t border-dotted border-neutral-200">
          <div className="text-[10px] font-black text-neutral-400 uppercase mb-4 tracking-[0.2em]">Strategy</div>
          <div className="space-y-3">
            {result.tradingSuggestions.map((s, i) => (
              <div key={i} className="bg-neutral-900 text-white p-4 rounded-2xl text-[13px] font-bold flex gap-4 shadow-lg border border-neutral-800">
                <span className="text-blue-400">0{i + 1}</span>
                <span className="leading-relaxed">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ChatInterface: React.FC<{ onSettingsClick?: () => void }> = ({ onSettingsClick }) => {
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [browserContext, setBrowserContext] = useState<{ symbol?: string; date?: string; url?: string }>({});
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [pendingAutoScanUrl, setPendingAutoScanUrl] = useState<string | null>(null);
  const messages = useMessages();
  const dispatch = useMessagesDispatch();
  const aiConfig = useAIConfig();
  const { provider } = aiConfig;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const latestScannedData = [...messages].reverse().find(m => m.type === 'collected')?.collectedData;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const updateContext = async () => {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        try {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tabs[0]?.url) {
            const context = OptionChainService.parseUrl(tabs[0].url);
            setBrowserContext({ ...context, url: tabs[0].url });

            // Auto-scan logic
            if (pendingAutoScanUrl) {
              console.log('🔍 Auto-scan check:', {
                pendingUrl: pendingAutoScanUrl,
                currentUrl: tabs[0].url,
                matches: tabs[0].url.includes(pendingAutoScanUrl)
              });

              if (tabs[0].url.includes(pendingAutoScanUrl)) {
                console.log('✅ URLs match! Triggering auto-scan...');
                setPendingAutoScanUrl(null);
                // Small delay to ensure table is rendered
                setTimeout(() => {
                  console.log('📡 Calling handleScan()');
                  handleScan();
                }, 1500);
              }
            }
          }
        } catch (e) {
          console.error('Failed to poll context:', e);
        }
      }
    };

    const loadCandidates = () => {
      setCandidates(CandidatesService.getCandidates());
    };

    updateContext();
    loadCandidates();
    window.addEventListener('candidatesUpdated', loadCandidates);
    const interval = setInterval(updateContext, 2000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('candidatesUpdated', loadCandidates);
    };
  }, [pendingAutoScanUrl]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    console.log(`[ChatInterface] AI Config updated. Provider: ${aiConfig.provider}, Key length: ${aiConfig.keys?.[aiConfig.provider]?.length || aiConfig.apiKey?.length || 0}`);
  }, [aiConfig]);

  useEffect(() => {
    const handleRestore = (e: any) => {
      handleApplyAnalysis(e.detail);
    };
    window.addEventListener('restoreWatchlist', handleRestore);
    return () => window.removeEventListener('restoreWatchlist', handleRestore);
  }, []);

  const handleApplyAnalysis = async (item: HistoryItem) => {
    setShowWatchlist(false);
    if (!dispatch) return;

    // 1. Navigate Browser Tab if URL exists
    if (item.url && typeof chrome !== 'undefined' && chrome.tabs) {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]?.id) {
          await chrome.tabs.update(tabs[0].id, { url: item.url });
        }
      } catch (e) {
        console.error('Failed to navigate tab:', e);
      }
    }

    // 2. Clear and Restore Messages
    dispatch({ type: 'clear' });

    // Restore 'collected' message (The Charts)
    if (item.collectedData) {
      dispatch({
        type: 'add',
        data: {
          id: `restored-collected-${Date.now()}`,
          type: 'collected',
          sender: 'assistant',
          messageSource: 'option_chain',
          timestamp: new Date(item.timestamp),
          collectedData: item.collectedData,
          showApplyButton: true // Mark as saved
        }
      });
    }

    // Restore 'result' message (The AI Analysis) if it exists
    if (item.analysis) {
      dispatch({
        type: 'add',
        data: {
          id: `restored-result-${Date.now()}`,
          type: 'result',
          sender: 'assistant',
          messageSource: 'option_chain',
          timestamp: new Date(item.timestamp),
          analysisResult: item.analysis,
          collectedData: item.collectedData,
          showApplyButton: true
        }
      });
    }
  };

  const handleClear = () => {
    if (dispatch) {
      dispatch({ type: 'clear' });
      dispatch({
        type: 'add',
        data: {
          id: `system-${Date.now()}`,
          type: 'introduction',
          sender: 'assistant',
          messageSource: 'option_chain',
          timestamp: new Date(Date.now()),
          content: '',
        }
      });
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        const response = await chrome.tabs.sendMessage(tabs[0].id, { action: 'SCAN_OPTION_CHAIN' });
        if (!response || !response.success) throw new Error(response?.error || 'Scan failed');
      }
    } catch (error) {
      console.error('Scan failed:', error);
      if (dispatch) {
        dispatch({
          type: 'add',
          data: {
            id: `error-${Date.now()}`,
            type: 'error',
            sender: 'system',
            timestamp: new Date(),
            content: 'Unable to scan option chain data. The page may still be loading, or the option table is not visible.',
          }
        });
      }
    } finally {
      setTimeout(() => setIsScanning(false), 800);
    }
  };

  const handleAnalyzeChain = async (data: OptionChainData, prompt: string) => {
    if (!dispatch) return;
    setIsAiLoading(true);

    const aiMsgId = `ai-${Date.now()}`;
    dispatch({
      type: 'add',
      data: {
        id: aiMsgId,
        type: 'ai',
        sender: 'assistant',
        timestamp: new Date(),
        content: 'Analyzing Option Chain dynamics...'
      }
    });

    try {
      const aiService = new AIService(aiConfig);
      const apiMessages: APIMessage[] = [{ role: 'user', content: [{ type: 'text', text: prompt + '\n\n' + OptionChainService.formatForAI(data) }] }];
      const response = await aiService.chatCompletion(apiMessages, 'option_chain');

      try {
        const result: AiGeneratedOptionAnalysis = JSON.parse(response.content);
        dispatch({
          type: 'update',
          id: aiMsgId,
          data: {
            type: 'result',
            analysisResult: result,
            content: '',
            collectedData: data // Store for manual save
          }
        });
      } catch (e) {
        dispatch({
          type: 'update',
          id: aiMsgId,
          data: { type: 'introduction', content: response.content }
        });
      }
    } catch (error) {
      console.error('AI Analysis failed:', error);
      dispatch({
        type: 'update',
        id: aiMsgId,
        data: {
          type: 'introduction', // Remove pulse loading
          content: 'I encountered an error while analyzing the option chain. Please check your API key.'
        }
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleUpdateValuationForMessage = (msgId: string, valuation: number) => {
    if (!dispatch) return;
    const newVal = isNaN(valuation) ? undefined : valuation;
    const msg = messages.find(m => m.id === msgId);
    if (msg && msg.collectedData) {
      dispatch({
        type: 'update',
        id: msgId,
        data: {
          collectedData: { ...msg.collectedData, valuation: newVal }
        }
      });
      // Sync with Watchlist if it exists
      if (newVal !== undefined) {
        WatchlistService.updateValuation(msg.collectedData.symbol, msg.collectedData.expirationDate, newVal);
      }
    }
  };

  const handleSaveToWatchlist = async (msg: any) => {
    if (!msg.collectedData) return;

    let currentUrl: string | undefined = undefined;
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        currentUrl = tabs[0]?.url;
      } catch (e) {
        console.error('Failed to get current URL:', e);
      }
    }

    WatchlistService.saveWatchlistItem({
      id: Date.now().toString(),
      timestamp: Date.now(),
      symbol: msg.collectedData.symbol,
      expirationDate: msg.collectedData.expirationDate,
      price: msg.collectedData.price,
      valuation: msg.collectedData.valuation || msg.valuation,
      analysis: msg.analysisResult,
      collectedData: msg.collectedData, // Save the full chain
      url: currentUrl // Save the browser link
    });

    if (dispatch) {
      dispatch({
        type: 'update',
        id: msg.id,
        data: { showApplyButton: true } // Use showApplyButton as a proxy for "isSaved" state
      });
    }
  };

  const handlePinCandidate = (candidate: Omit<CandidateItem, 'id' | 'timestamp' | 'url'>): string => {
    const id = `candidate-${Date.now()}`;
    CandidatesService.saveCandidate({
      ...candidate,
      id,
      timestamp: Date.now(),
      url: browserContext.url || ''
    });
    return id;
  };

  const handleUndoPin = (id: string) => {
    CandidatesService.removeCandidate(id);
  };

  const handleRemoveCandidate = (id: string) => {
    CandidatesService.removeCandidate(id);
  };

  const handleNavigateToUrl = async (url: string) => {
    if (!url || typeof chrome === 'undefined' || !chrome.tabs) return;
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        console.log('🚀 Navigating to candidate URL:', url);
        setPendingAutoScanUrl(url);
        console.log('📌 Set pendingAutoScanUrl:', url);
        await chrome.tabs.update(tabs[0].id, { url });
        console.log('✅ Tab updated successfully');
      }
    } catch (e) {
      console.error('Failed to navigate:', e);
      setPendingAutoScanUrl(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <header className="flex items-center justify-between p-4 border-b border-neutral-100 flex-shrink-0">
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity"
          onClick={handleClear}
          title="Option Finder - Click to return home"
        >
          <img src={logoIcon} alt="Logo" className="w-7 h-7" />
          <span className="text-lg font-black text-neutral-900 tracking-tight">Option Finder</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowWatchlist(true)}
            className="p-2 rounded-2xl bg-neutral-50 text-neutral-400 hover:bg-neutral-100 hover:text-blue-600 transition-all active:scale-95 group"
            title="Open Watchlist - View saved analyses"
          >
            <ListFilter className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          </button>
          <button
            onClick={onSettingsClick}
            className="p-2 rounded-2xl bg-neutral-50 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition-all active:scale-95"
            title="Settings - Configure AI provider & API keys"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={handleClear}
            className="p-2 rounded-2xl bg-neutral-50 text-neutral-400 hover:bg-neutral-100 hover:text-rose-600 transition-all active:scale-95"
            title="Clear & Reset - Return to home screen"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-none relative">
        {latestScannedData && (
          <ContextMismatchBanner
            currentContext={browserContext}
            dataContext={{ symbol: latestScannedData.symbol, date: latestScannedData.expirationDate }}
            onSync={handleScan}
          />
        )}
        {messages.length === 0 || (messages.length === 1 && messages[0].type === 'introduction' && !messages[0].content) ? (
          <div className="flex flex-col items-center justify-center min-h-full py-10 text-center animate-in fade-in duration-700">
            <div className="relative mb-8">
              <img src={logoIcon} alt="Logo" className="w-16 h-16 relative z-10" />
              <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-40 animate-pulse"></div>
            </div>
            <h2 className="text-2xl font-black text-neutral-900 mb-2 tracking-tighter">Option Finder</h2>
            <p className="text-neutral-400 mb-10 max-w-[280px] text-[11px] leading-relaxed font-bold uppercase tracking-wider">
              Find high-probability setups in 3 simple steps
            </p>

            <div className="grid grid-cols-1 gap-3 mb-12 w-full max-w-[320px] text-left">
              <div className="flex gap-4 p-4 rounded-2xl bg-neutral-50/30 border border-neutral-100/30 items-center hover:bg-neutral-50/50 hover:border-neutral-200/40 transition-all duration-200">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm">1</div>
                <div>
                  <div className="text-[11px] font-black text-neutral-900 uppercase">Navigate</div>
                  <div className="text-[10px] text-neutral-500 font-bold">Open Yahoo Finance Options page</div>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-2xl bg-neutral-50/30 border border-neutral-100/30 items-center hover:bg-neutral-50/50 hover:border-neutral-200/40 transition-all duration-200">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-sm">2</div>
                <div>
                  <div className="text-[11px] font-black text-neutral-900 uppercase">Scan & Map</div>
                  <div className="text-[10px] text-neutral-500 font-bold">Hit Scan to visualize OI & Vol walls</div>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-2xl bg-neutral-50/30 border border-neutral-100/30 items-center hover:bg-neutral-50/50 hover:border-neutral-200/40 transition-all duration-200">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-black text-sm">3</div>
                <div>
                  <div className="text-[11px] font-black text-neutral-900 uppercase">Pin & Compare</div>
                  <div className="text-[10px] text-neutral-500 font-bold">Add top strikes to your comparison pool</div>
                </div>
              </div>
            </div>
            <button onClick={handleScan} disabled={isScanning} className="group relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-10 py-4 rounded-[2rem] text-sm font-black transition-all duration-300 shadow-2xl shadow-blue-500/20 hover:shadow-[0_8px_30px_rgba(37,99,235,0.35)] hover:-translate-y-1 hover:scale-[1.02] active:scale-95 border-b-4 border-blue-800 mb-16 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100">
              {isScanning ? <RefreshCw className="w-5 h-5 animate-spin text-white" /> : <span>START SCANNING</span>}
            </button>

            <div className="w-full">
              <CandidatesDashboard
                candidates={candidates}
                onRemove={handleRemoveCandidate}
                onNavigate={handleNavigateToUrl}
              />
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {msg.type === 'introduction' && msg.content && (
                <div className="p-8 rounded-[2rem] border border-neutral-100 border-dashed bg-neutral-50/50 text-center mb-6">
                  <div className="text-[13px] leading-relaxed font-bold text-neutral-500">{msg.content}</div>
                </div>
              )}
              {msg.type === 'collected' && msg.collectedData && (
                <CollectedOptionChainDisplay
                  data={msg.collectedData}
                  valuation={msg.collectedData.valuation}
                  onValuationChange={(val) => handleUpdateValuationForMessage(msg.id, val)}
                  onAnalyze={(prompt) => handleAnalyzeChain(msg.collectedData!, prompt)}
                  isLoading={isAiLoading}
                  onScan={handleScan}
                  onHome={handleClear}
                  onSave={() => handleSaveToWatchlist(msg)}
                  isSaved={msg.showApplyButton}
                  onPinCandidate={handlePinCandidate}
                  onUndoPin={handleUndoPin}
                />
              )}
              {msg.type === 'result' && msg.analysisResult && (
                <AnalysisResultDisplay
                  result={msg.analysisResult}
                  provider={provider}
                  onSave={() => handleSaveToWatchlist(msg)}
                  isSaved={msg.showApplyButton}
                />
              )}
              {msg.type === 'ai' && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                  </div>
                  <div className="flex-1 bg-white border border-neutral-100 rounded-3xl p-5 shadow-sm space-y-3 animate-pulse">
                    <div className="h-3 bg-neutral-50 rounded-full w-3/4"></div>
                    <div className="h-3 bg-neutral-50 rounded-full w-1/2"></div>
                  </div>
                </div>
              )}
              {msg.type === 'error' && msg.content && (
                <div className="p-6 rounded-2xl border-2 border-red-200 bg-red-50 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-red-800 mb-1">Scan Failed</div>
                      <div className="text-xs text-red-600 mb-4 leading-relaxed">{msg.content}</div>
                      <button
                        onClick={handleScan}
                        disabled={isScanning}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-xl text-xs font-black uppercase transition-all shadow-lg shadow-red-200 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                        {isScanning ? 'Retrying...' : 'Retry Scan'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {msg.type === 'user' && (
                <div className="flex justify-end px-2">
                  <div className="bg-blue-600 text-white px-6 py-4 rounded-3xl rounded-tr-none text-[13px] font-extrabold shadow-xl border border-blue-500 max-w-[85%] leading-relaxed">{msg.content}</div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {showWatchlist && (
        <WatchlistPanel onClose={() => setShowWatchlist(false)} onRestore={handleApplyAnalysis} />
      )}
    </div>
  );
};
