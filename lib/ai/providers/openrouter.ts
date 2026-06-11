import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { BaseAIProvider } from './types';
import { AIRequest } from '@/types/ai';

const apiKey = process.env.OPENROUTER_API_KEY;

export const openrouterClient = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: apiKey || '',
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://idiots.local',
    'X-Title': 'IS Idiots Flame',
  }
});

export const openrouterModel = openrouterClient('google/gemini-2.5-flash');

export class OpenRouterProvider implements BaseAIProvider {
  name = 'openrouter';
  defaultModel = 'google/gemini-2.5-flash';

  isConfigured(): boolean {
    return !!apiKey;
  }

  async streamChat(
    request: AIRequest,
    systemPrompt: string,
    messages: any[],
    onFinishCb?: (text: string) => Promise<void>
  ): Promise<Response> {
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY_MISSING');
    }

    const result = streamText({
      model: openrouterModel,
      system: systemPrompt,
      messages: messages,
      onFinish: async ({ text }) => {
        if (onFinishCb) {
          await onFinishCb(text);
        }
      }
    });

    return result.toTextStreamResponse();
  }
}
