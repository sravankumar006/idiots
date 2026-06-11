import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ProviderManager } from '@/lib/ai/core/provider-manager';

export async function GET() {
  try {
    const supabase = await createClient();

    // Query historical stats from ai_logs table
    const { data: logs, error } = await supabase
      .from('ai_logs')
      .select('provider, success, response_time_ms');

    // Default structure for statistics aggregates
    const dbStats: Record<string, { total: number; successes: number; failures: number; totalLatency: number }> = {
      gemini: { total: 0, successes: 0, failures: 0, totalLatency: 0 },
      openai: { total: 0, successes: 0, failures: 0, totalLatency: 0 },
      openrouter: { total: 0, successes: 0, failures: 0, totalLatency: 0 },
    };

    if (logs && !error) {
      logs.forEach((log: any) => {
        const p = (log.provider || 'gemini').toLowerCase();
        if (dbStats[p]) {
          dbStats[p].total += 1;
          if (log.success) {
            dbStats[p].successes += 1;
            dbStats[p].totalLatency += log.response_time_ms || 0;
          } else {
            dbStats[p].failures += 1;
          }
        }
      });
    }

    // Combine in-memory status metrics with database statistics
    const providersStatus = ProviderManager.getAllProviders().map(p => {
      const dbStat = dbStats[p.name] || { total: 0, successes: 0, failures: 0, totalLatency: 0 };
      const avgLatencyMs = dbStat.successes > 0 ? Math.round(dbStat.totalLatency / dbStat.successes) : 0;
      const successRate = dbStat.total > 0 ? Math.round((dbStat.successes / dbStat.total) * 100) : 100;
      
      const managerStat = ProviderManager.getStats(p.name);

      return {
        name: p.name,
        displayName: p.name === 'gemini' ? 'Google Gemini' : p.name === 'openai' ? 'OpenAI GPT' : 'OpenRouter',
        configured: p.isConfigured(),
        health: managerStat.health, // Healthy, Warning, Unavailable
        stats: {
          totalRequests: dbStat.total,
          successRate: successRate,
          avgLatencyMs: avgLatencyMs,
          failures: dbStat.failures,
        }
      };
    });

    return NextResponse.json({ providers: providersStatus });
  } catch (err: any) {
    console.error('Failed to retrieve provider status:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
