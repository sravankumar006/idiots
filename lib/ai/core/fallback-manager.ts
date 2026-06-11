import { ProviderManager } from './provider-manager';
import { AIRequest } from '@/types/ai';

export class FallbackManagerClass {
  async streamChat(
    request: AIRequest,
    systemPrompt: string,
    messages: any[],
    onFinishCb?: (text: string, provider: string, model: string, durationMs: number) => Promise<void>,
    onFailureCb?: (provider: string, model: string, durationMs: number, errorMsg: string) => Promise<void>
  ): Promise<{ response: Response; providerName: string; modelName: string }> {
    const preference = request.providerPreference || 'auto';
    
    // Determine target execution chain based on user preference
    const chain: string[] = [];
    if (preference === 'gemini') {
      chain.push('gemini', 'openai', 'openrouter');
    } else if (preference === 'openai') {
      chain.push('openai', 'gemini', 'openrouter');
    } else if (preference === 'openrouter') {
      chain.push('openrouter', 'gemini', 'openai');
    } else {
      // auto or default
      chain.push('gemini', 'openai', 'openrouter');
    }

    const errors: { provider: string; error: string }[] = [];

    for (const providerName of chain) {
      const provider = ProviderManager.getProvider(providerName);
      if (!provider) continue;

      // Skip unconfigured providers automatically without failing
      if (!provider.isConfigured()) {
        console.log(`[AI FallbackManager] Skipping unconfigured provider: ${providerName}`);
        continue;
      }

      const startTime = Date.now();
      try {
        console.log(`[AI FallbackManager] Attempting provider: ${providerName}`);
        
        // Execute the streaming call
        const response = await provider.streamChat(
          request,
          systemPrompt,
          messages,
          async (text) => {
            const duration = Date.now() - startTime;
            ProviderManager.recordSuccess(providerName, duration);
            if (onFinishCb) {
              await onFinishCb(text, providerName, provider.defaultModel, duration);
            }
          }
        );

        // Inject standardized headers for client-side routing transparency
        const responseHeaders = new Headers(response.headers);
        responseHeaders.set('X-AI-Provider', providerName);
        responseHeaders.set('X-AI-Model', provider.defaultModel);
        responseHeaders.set('X-AI-Timestamp', new Date().toISOString());

        return {
          response: new Response(response.body, {
            status: response.status,
            headers: responseHeaders,
          }),
          providerName,
          modelName: provider.defaultModel,
        };
      } catch (err: any) {
        const duration = Date.now() - startTime;
        const errMsg = err?.message || String(err);
        console.error(`[AI FallbackManager] Provider ${providerName} failed:`, err);
        ProviderManager.recordFailure(providerName, err);
        
        if (onFailureCb) {
          await onFailureCb(providerName, provider.defaultModel, duration, errMsg);
        }
        errors.push({ provider: providerName, error: errMsg });
      }
    }

    // All registered providers failed: return a graceful markdown fallback response
    console.error('[AI FallbackManager] All providers failed. Generating fallback response.');
    
    const fallbackMessage = `⚠️ **IS AI is temporarily unavailable**\n\nAll AI providers are currently unreachable. Please try again in a few moments.\n\n*Connection Diagnostics: ${errors.map(e => `${e.provider}: ${e.error}`).join(' | ')}*`;
    
    const fallbackStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(fallbackMessage));
        controller.close();
      }
    });

    const responseHeaders = new Headers();
    responseHeaders.set('X-AI-Provider', 'fallback-system');
    responseHeaders.set('X-AI-Model', 'none');
    responseHeaders.set('X-AI-Timestamp', new Date().toISOString());
    responseHeaders.set('Content-Type', 'text/plain; charset=utf-8');

    return {
      response: new Response(fallbackStream, {
        status: 503, // Service Unavailable
        headers: responseHeaders
      }),
      providerName: 'fallback',
      modelName: 'none'
    };
  }
}

export const FallbackManager = new FallbackManagerClass();
