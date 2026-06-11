import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { BaseAIProvider } from './types';
import { AIRequest } from '@/types/ai';

const apiKey = process.env.OPENAI_API_KEY;

export const openaiClient = createOpenAI({
  apiKey: apiKey || '',
});

export const openaiModel = openaiClient('gpt-4o-mini');

export class OpenAIProvider implements BaseAIProvider {
  name = 'openai';
  defaultModel = 'gpt-4o-mini';

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
      throw new Error('OPENAI_API_KEY_MISSING');
    }

    const result = streamText({
      model: openaiModel,
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
