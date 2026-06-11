import { createClient } from '@/lib/supabase/server';
import { generateText } from 'ai';
import { geminiModel } from './providers/gemini';

export class MemoryService {
  /**
   * Fetch all relevant memories for the user's context (both AI memories and conversation summaries).
   */
  static async getRelevantMemories(userId: string, roomId?: string): Promise<{ aiMemories: string, summaries: string }> {
    const supabase = await createClient();

    let aiMemoriesContext = '';
    let summariesContext = '';

    try {
      // 1. Fetch user specific AI memories (Study, Project, General)
      const { data: memories } = await supabase
        .from('ai_memories')
        .select('memory_type, title, content')
        .eq('created_by', userId)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (memories && memories.length > 0) {
        const grouped = memories.reduce((acc: Record<string, string[]>, mem) => {
          if (!acc[mem.memory_type]) acc[mem.memory_type] = [];
          acc[mem.memory_type].push(`- [${mem.title}]: ${mem.content}`);
          return acc;
        }, {});

        aiMemoriesContext = '\n\n[AI LONG-TERM MEMORY]\n';
        aiMemoriesContext += 'You have the following persistent context about the user and their workspaces:\n';
        for (const [type, mems] of Object.entries(grouped)) {
          aiMemoriesContext += `\n${type.toUpperCase()} MEMORIES:\n${mems.join('\n')}\n`;
        }
      }

      // 2. Fetch the latest conversation summary
      const conversationId = roomId || `personal_${userId}`;
      const { data: summaries } = await supabase
        .from('memory_summaries')
        .select('summary, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (summaries && summaries.length > 0) {
        summariesContext = `\n\n[RECENT CONVERSATION SUMMARY]\nHere is a condensed summary of what was discussed recently in this room:\n${summaries[0].summary}\n`;
      }
    } catch (err) {
      console.warn("Failed to fetch memories:", err);
    }

    return { aiMemories: aiMemoriesContext, summaries: summariesContext };
  }

  /**
   * Auto-extract a memory from user's prompt (e.g. "Remember that...").
   */
  static async extractAndStoreMemory(userId: string, prompt: string, category: string = 'General'): Promise<void> {
    const supabase = await createClient();
    const lowerPrompt = prompt.toLowerCase();
    
    let extractedFact = '';
    let memoryType = category;

    if (lowerPrompt.includes('remember that')) {
      extractedFact = prompt.replace(/remember that/i, '').trim();
    } else if (lowerPrompt.includes('inside joke:')) {
      extractedFact = prompt.replace(/inside joke:/i, '').trim();
    } else if (lowerPrompt.includes('favorite topic is') || lowerPrompt.includes('favorite language is')) {
      extractedFact = prompt.trim();
    } else if (lowerPrompt.includes('project name is') || lowerPrompt.includes('we are building')) {
      extractedFact = prompt.trim();
      memoryType = 'Project';
    }

    if (extractedFact && extractedFact.length > 5 && extractedFact.length < 500) {
      try {
        await supabase.from('ai_memories').insert({
          created_by: userId,
          memory_type: memoryType,
          title: `Auto-extracted: ${extractedFact.substring(0, 15)}...`,
          content: extractedFact
        });
      } catch (err) {
        console.error('Failed to insert auto-extracted memory:', err);
      }
    }
  }

  /**
   * Asynchronously summarize the conversation if it exceeds a certain length.
   * Doesn't block the main flow.
   */
  static async triggerBackgroundSummarization(userId: string, conversationId: string, messages: any[]): Promise<void> {
    // Only summarize if we have a substantial chunk of history (e.g., more than 8 messages)
    if (!messages || messages.length < 8) return;

    const supabase = await createClient();

    // Check if we recently summarized this conversation (to avoid spamming Gemini)
    try {
      const { data: recentSummaries } = await supabase
        .from('memory_summaries')
        .select('created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (recentSummaries && recentSummaries.length > 0) {
        const lastSummaryTime = new Date(recentSummaries[0].created_at).getTime();
        // Don't summarize again if the last summary was within 5 minutes
        if (Date.now() - lastSummaryTime < 5 * 60 * 1000) return;
      }
    } catch (err) {
      console.warn("Could not check recent summaries:", err);
    }

    // Run AI summarization in the background (fire and forget)
    // We format the raw messages into a single text block
    const historyText = messages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n');
    
    // We execute this async without awaiting it in the critical path
    setTimeout(async () => {
      try {
        const { text: summaryResult } = await generateText({
          model: geminiModel,
          system: "You are an AI assistant that summarizes long chat conversations to be used as context memory. Keep it concise, highlighting key technical details, decisions, ongoing projects, and study topics. Do not output conversational filler. Just the summary.",
          messages: [{ role: 'user', content: `Summarize the following conversation history:\n\n${historyText}` }],
        });

        if (summaryResult && summaryResult.length > 10) {
          // Store the new summary
          const asyncSupabase = await createClient();
          await asyncSupabase.from('memory_summaries').insert({
            conversation_id: conversationId,
            summary: summaryResult
          });
        }
      } catch (err) {
        console.error("Background summarization failed:", err);
      }
    }, 0);
  }
}
