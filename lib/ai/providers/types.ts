import { AIRequest } from '@/types/ai';

export interface BaseAIProvider {
  name: string;
  defaultModel: string;
  isConfigured(): boolean;
  /**
   * Generates a streaming chat response.
   * @param request - The parsed incoming AI request from the client.
   * @param systemPrompt - The resolved system prompt including context memory.
   * @param messages - The core conversation messages.
   * @param onFinishCb - An optional callback to run when streaming is complete (useful for DB inserts).
   */
  streamChat(
    request: AIRequest,
    systemPrompt: string,
    messages: any[],
    onFinishCb?: (text: string) => Promise<void>
  ): Promise<Response>;
}
