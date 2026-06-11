import { BaseAIProvider } from '../providers/types';
import { GeminiProvider } from '../providers/gemini';
import { OpenAIProvider } from '../providers/openai';
import { OpenRouterProvider } from '../providers/openrouter';

export type HealthStatus = 'Healthy' | 'Warning' | 'Unavailable';

interface ProviderStats {
  successes: number;
  failures: number;
  consecutiveFailures: number;
  lastFailureTime?: number;
  lastFailureError?: string;
  latencies: number[]; // track recent latencies for averages
}

class ProviderManagerClass {
  private providers = new Map<string, BaseAIProvider>();
  private stats = new Map<string, ProviderStats>();

  constructor() {
    this.registerProvider(new GeminiProvider());
    this.registerProvider(new OpenAIProvider());
    this.registerProvider(new OpenRouterProvider());
  }

  registerProvider(provider: BaseAIProvider) {
    this.providers.set(provider.name, provider);
    this.stats.set(provider.name, {
      successes: 0,
      failures: 0,
      consecutiveFailures: 0,
      latencies: [],
    });
  }

  getProvider(name: string): BaseAIProvider | undefined {
    return this.providers.get(name);
  }

  getAllProviders(): BaseAIProvider[] {
    return Array.from(this.providers.values());
  }

  getHealthStatus(name: string): HealthStatus {
    const provider = this.getProvider(name);
    if (!provider || !provider.isConfigured()) {
      return 'Unavailable';
    }

    const stat = this.stats.get(name);
    if (!stat) return 'Healthy';

    if (stat.consecutiveFailures >= 3) {
      return 'Unavailable';
    }
    if (stat.consecutiveFailures > 0 || stat.failures > 0) {
      // If there was a failure in the last 15 minutes, mark as Warning
      const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
      if (stat.lastFailureTime && stat.lastFailureTime > fifteenMinutesAgo) {
        return 'Warning';
      }
    }
    return 'Healthy';
  }

  recordSuccess(name: string, latencyMs: number) {
    const stat = this.stats.get(name);
    if (stat) {
      stat.successes += 1;
      stat.consecutiveFailures = 0;
      stat.latencies.push(latencyMs);
      if (stat.latencies.length > 10) stat.latencies.shift(); // keep last 10
    }
  }

  recordFailure(name: string, error: any) {
    const stat = this.stats.get(name);
    if (stat) {
      stat.failures += 1;
      stat.consecutiveFailures += 1;
      stat.lastFailureTime = Date.now();
      stat.lastFailureError = String(error?.message || error);
    }
  }

  getStats(name: string) {
    const stat = this.stats.get(name);
    const provider = this.getProvider(name);
    const isConfigured = provider ? provider.isConfigured() : false;
    
    const avgLatency = stat && stat.latencies.length > 0
      ? stat.latencies.reduce((a, b) => a + b, 0) / stat.latencies.length
      : 0;

    return {
      name,
      isConfigured,
      health: this.getHealthStatus(name),
      successes: stat?.successes || 0,
      failures: stat?.failures || 0,
      consecutiveFailures: stat?.consecutiveFailures || 0,
      avgLatencyMs: Math.round(avgLatency),
      lastFailureError: stat?.lastFailureError,
    };
  }
}

export const ProviderManager = new ProviderManagerClass();
