// Message Types for Option Chain Analyzer
export type MessageType =
  | 'user'
  | 'ai'
  | 'result'
  | 'collected'
  | 'introduction'
  | 'error';
export type MessageSource = 'option_chain';

export interface ChatMessage {
  id: string;
  type: MessageType;
  messageSource?: MessageSource;
  content?: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: Date;
  showApplyButton?: boolean;
  isApplying?: boolean;
  // For collected content type
  collectedData?: OptionChainData;
  // For AI generated analysis
  analysisResult?: AiGeneratedOptionAnalysis;
  // Valuation for restoration
  valuation?: number;
  // For user messages with images (optional)
  userMessage?: UserMessage;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  symbol: string;
  expirationDate: string;
  price: number;
  valuation?: number;
  analysis?: AiGeneratedOptionAnalysis;
  collectedData?: OptionChainData;
  url?: string;
}

export interface CandidateItem {
  id: string;
  symbol: string;
  expirationDate: string;
  strike: number;
  type: 'call' | 'put';
  delta: number;
  optionPrice: number;
  underlyingPrice: number;
  annualizedYield: number;
  url: string;
  timestamp: number;
}

// Extracted Option Chain Data
export interface OptionChainData {
  symbol: string;
  price: number;
  expirationDate: string;
  strikes: OptionContract[];
  valuation?: number;
  timestamp: number;
}

export interface OptionContract {
  strike: number;
  contractName: string;
  lastPrice: number;
  bid: number;
  ask: number;
  change: number;
  percentChange: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  type: 'call' | 'put';
  inTheMoney: boolean;
}

// AI Analysis Result
export interface AiGeneratedOptionAnalysis {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  summary: string;
  keyObservations: string[]; // e.g., "High Call OI at 150", "Put/Call Ratio diverging"
  tradingSuggestions: string[]; // e.g., "Consider selling puts", "Look for breakout above 155"
  supportResistance: {
    support: number;
    resistance: number;
    reason: string;
  };
}

export interface UserMessage {
  content: string;
  images?: string[];
  msgSource?: MessageSource;
}

// Define action types
export type MessageAction =
  | { type: 'add'; data: ChatMessage }
  | { type: 'clearAdd'; data: ChatMessage }
  | { type: 'clear' }
  | { type: 'update'; id: string; data: Partial<ChatMessage> };

export const initialMessages: ChatMessage[] = [
  {
    id: `system-${Date.now()}`,
    type: 'introduction',
    sender: 'assistant',
    messageSource: 'option_chain',
    timestamp: new Date(Date.now()),
    content: '',
  },
];

export function messagesReducer(
  messages: ChatMessage[],
  action: MessageAction
) {
  switch (action.type) {
    case 'add': {
      return [...messages, action.data];
    }
    case 'update': {
      return messages.map((msg) =>
        msg.id === action.id ? { ...msg, ...action.data } : msg
      );
    }
    case 'clearAdd': {
      return [action.data];
    }
    case 'clear': {
      return [];
    }
    default: {
      throw Error('Unknown action: ' + (action as any).type);
    }
  }
}
