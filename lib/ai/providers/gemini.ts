import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { BaseAIProvider } from './types';
import { AIRequest } from '@/types/ai';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export const googleProvider = createGoogleGenerativeAI({
  apiKey: apiKey || '',
});

export const geminiModel = googleProvider('gemini-2.5-flash');

export class GeminiProvider implements BaseAIProvider {
  name = 'gemini';
  defaultModel = 'gemini-2.5-flash';

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
      throw new Error('GEMINI_API_KEY_MISSING');
    }

    const result = streamText({
      model: geminiModel,
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
