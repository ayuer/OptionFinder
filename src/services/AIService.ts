import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import type { ChatMessage, MessageSource, AiGeneratedOptionAnalysis } from './messageTypes';
import type { AIConfig } from '../components/SettingsPanel';
import type { ChatCompletionCreateParamsBase, ChatCompletion } from 'openai/resources/chat/completions.mjs';

// API message format
export interface APIMessage {
  role: 'system' | 'user' | 'assistant';
  content: any[];
}

export interface AIResponse {
  content: string;
  usage?: any;
}

export const OPTION_ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    sentiment: {
      type: 'string',
      enum: ['bullish', 'bearish', 'neutral'],
      description: 'Overall market sentiment based on option data',
    },
    summary: {
      type: 'string',
      description: 'Comprehensive summary of the option chain analysis',
    },
    keyObservations: {
      type: 'array',
      items: { type: 'string' },
      description: 'Key data points like unusual volume, OI walls, etc.',
    },
    tradingSuggestions: {
      type: 'array',
      items: { type: 'string' },
      description: 'Potential trading strategies based on analysis',
    },
    supportResistance: {
      type: 'object',
      properties: {
        support: { type: 'number' },
        resistance: { type: 'number' },
        reason: { type: 'string' },
      },
      required: ['support', 'resistance', 'reason'],
      additionalProperties: false,
    },
  },
  required: ['sentiment', 'summary', 'keyObservations', 'tradingSuggestions', 'supportResistance'],
  additionalProperties: false,
};

const systemPrompt = `You are an expert Options Trader and Quantitative Analyst.
Your goal is to analyze the provided Option Chain data (Strikes, Volume, Open Interest, IV) and provide actionable investment insights.

Analyze the following:
1. **Put/Call Ratio**: Sentiment indicator.
2. **Open Interest Walls**: Identify potential Support and Resistance levels.
3. **Volume Anomalies**: Identify unusual activity.
4. **Implied Volatility**: Assess if options are expensive or cheap.

Output must be in JSON format matching the schema.`;

export class AIService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
    if (config.apiKey) {
      this.initializeClient();
    }
  }

  private initializeClient(): void {
    try {
      const { provider } = this.config;
      const currentKey = this.config.keys?.[provider] || this.config.apiKey;

      if (!currentKey) {
        console.warn(`[AIService] No API key found for: ${provider}`);
        return;
      }

      console.log(`[AIService] Initializing client for provider: ${provider}`);

      if (provider === 'claude') {
        this.anthropic = new Anthropic({ apiKey: currentKey, dangerouslyAllowBrowser: true });
      } else {
        let baseURL = undefined;

        if (provider.startsWith('gemini')) {
          // Google's OpenAI-compatible endpoint. Using standard version for max compatibility.
          baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai';
          console.log(`[AIService] !!! ROUTING TO GOOGLE GEMINI ENDPOINT !!!`);
          console.log(`[AIService] Endpoint Base: ${baseURL}`);
          console.log(`[AIService] Note: The browser may show 'openai' in the path, but the destination is googleapis.com`);
        } else if (provider === 'qwen') {
          baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
          console.log(`[AIService] Routing to DashScope: ${baseURL}`);
        } else {
          console.log(`[AIService] Routing to official OpenAI: api.openai.com`);
        }

        this.openai = new OpenAI({
          apiKey: currentKey,
          baseURL,
          dangerouslyAllowBrowser: true,
          // Set maxRetries to 0 for debugging so errors show up immediately
          maxRetries: 0
        });

        const maskedKey = currentKey.length > 8 ? `${currentKey.substring(0, 4)}...${currentKey.substring(currentKey.length - 4)}` : '****';
        console.log(`[AIService] Configured with key: ${maskedKey}`);
      }
    } catch (error) {
      console.error('[AIService] Critical Initialization Error:', error);
    }
  }

  public async chatCompletion(messages: APIMessage[], _msgSource: MessageSource): Promise<AIResponse> {
    if (this.config.provider === 'claude') return this.claudeChatCompletion(messages);
    return this.openaiChatCompletion(messages);
  }

  private async openaiChatCompletion(messages: APIMessage[]): Promise<AIResponse> {
    if (!this.openai) throw new Error('AIService: OpenAI client not ready');

    const { provider } = this.config;

    // Use specific model identifiers that are known to work with the OpenAI-compatible endpoint
    let model = 'gpt-4o';
    if (provider.startsWith('gemini')) {
      model = 'gemini-1.5-flash';
      if (provider === 'gemini-2.5') model = 'gemini-1.5-pro';
      else if (provider === 'gemini-3') model = 'gemini-1.5-pro';
    } else if (provider === 'qwen') {
      model = 'qwen-plus';
    } else if (provider === 'chatgpt') {
      model = 'gpt-4o';
    }

    // Flatten content to string for better compatibility with proxies (Gemini/Qwen)
    const processedMessages = messages.map(m => {
      let content = '';
      if (typeof m.content === 'string') {
        content = m.content;
      } else if (Array.isArray(m.content)) {
        content = m.content.map(item => {
          if (typeof item === 'string') return item;
          return item.text || JSON.stringify(item);
        }).join('\n');
      }
      return { role: m.role, content };
    });

    // Add system prompt if not present
    if (processedMessages[0]?.role !== 'system') {
      processedMessages.unshift({ role: 'system', content: systemPrompt });
    }

    console.log(`[AIService] Executing completion. Model: ${model}, Endpoint: ${this.openai.baseURL}`);
    console.log(`[AIService] Payload Summary: ${processedMessages.length} messages, Tool choice: ${provider.startsWith('gemini') ? 'auto' : 'forced'}`);

    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [{
      type: 'function',
      function: {
        name: 'generate_option_analysis',
        description: 'Generate option chain analysis',
        parameters: OPTION_ANALYSIS_SCHEMA,
      },
    }];

    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: processedMessages as any,
        tools,
        // Gemini and Qwen can be picky about forced tool choice. Use 'auto' or 'required' or omit.
        // Google's OpenAI endpoint often prefers 'auto' or omitting tool_choice entirely if tools are present.
        tool_choice: provider.startsWith('gemini') ? undefined : { type: 'function', function: { name: 'generate_option_analysis' } },
      });

      const choice = response.choices[0];
      const toolCall = choice.message.tool_calls?.[0];

      if (toolCall && 'function' in toolCall) {
        return { content: toolCall.function.arguments };
      }

      // If no tool call but content exists, try to parse it as JSON if it looks like JSON
      let content = choice.message.content || '';
      if (content.trim().startsWith('{')) {
        return { content };
      }

      return { content };
    } catch (error: any) {
      console.error('OpenAI API call failed:', error);
      // Log more details if available
      if (error.response) {
        console.error('API Error Response:', error.response.data);
      }
      throw error;
    }
  }

  private async claudeChatCompletion(messages: APIMessage[]): Promise<AIResponse> {
    if (!this.anthropic) throw new Error('Claude client not initialized');

    const tools: Anthropic.Tool[] = [{
      name: 'generate_option_analysis',
      description: 'Generate option chain analysis',
      input_schema: OPTION_ANALYSIS_SCHEMA as any,
    }];

    try {
      // Filter system message for Claude (it goes to 'system' param)
      const systemMsg = messages.find(m => m.role === 'system')?.content[0]?.text || systemPrompt;
      const userMessages = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1024,
        system: systemMsg,
        messages: userMessages,
        tools,
        tool_choice: { type: 'tool', name: 'generate_option_analysis' },
      });

      const toolUse = response.content.find(c => c.type === 'tool_use');
      if (toolUse && toolUse.type === 'tool_use') {
        return { content: JSON.stringify(toolUse.input) };
      }
      return { content: (response.content[0] as any).text || '' };
    } catch (error) {
      console.error('Claude API call failed:', error);
      throw error;
    }
  }

  public getProvider(): string {
    return this.config.provider;
  }
}
