import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AIService } from '@/lib/ai/ai-service';
import { MemoryService } from '@/lib/ai/memory-service';
import { AIRequest } from '@/types/ai';
import { createNotification } from '@/lib/notifications/createNotification';

export async function POST(req: Request) {
  try {
    const payload: AIRequest = await req.json();
    const { prompt, groupId, aiMessageId, category, contextMessages, attachedFile, studyModeActive } = payload;

    // Guard against missing API Keys (at least one must be configured)
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (!geminiKey && !openaiKey && !openrouterKey) {
      const warningText = `⚠️ **AI Companion Keys Missing**\n\nNo AI providers are configured. To activate Rocky, please add at least one of the following to your \`.env.local\` file and restart the server:\n\n\`\`\`bash\nGEMINI_API_KEY=your_actual_api_key_here\nOPENAI_API_KEY=your_actual_api_key_here\nOPENROUTER_API_KEY=your_actual_api_key_here\n\`\`\``;
      return NextResponse.json({ error: 'AI Keys Missing', message: warningText }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // ─── Query mood logs and visible AI memories for user context ────────────
    let emotionalSupportInstructions = '';
    let longTermMemoriesInstructions = '';
    let conversationSummariesContext = '';

    if (user) {
      try {
        const memoryResult = await MemoryService.getRelevantMemories(user.id, groupId);
        longTermMemoriesInstructions = memoryResult.aiMemories + memoryResult.summaries;
        // Load recent mood logs
        const { data: moodLogs } = await supabase
          .from('mood_logs')
          .select('mood_value, mood_rating, mood_label, status_text')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (moodLogs && moodLogs.length > 0) {
          const sum = moodLogs.reduce((acc, log) => {
            const val = log.mood_value !== undefined ? log.mood_value : (log.mood_rating * 10);
            return acc + val;
          }, 0);
          const avg = sum / moodLogs.length;
          if (avg <= 40) {
            emotionalSupportInstructions = `\n\n[USER MOOD INSIGHT: The user has been feeling low recently (average mood index: ${avg.toFixed(1)}/100, status: "${moodLogs[0].status_text || 'quiet'}", mood label: "${moodLogs[0].mood_label || 'low'}"). Adjust your tone to be extremely supportive, warm, soft, and companion-like. Encourage them politely, suggest taking a break, suggest talking/hanging out with friends in the lounge chat, or offer quiet study support. AVOID therapy behavior, clinical advice, diagnostics, or mental health scoring language.]`;
          }
        }

      } catch (err) {
        console.warn("Failed to fetch mood logs or ai memories:", err);
      }
    }

    // Determine the original message being replied to (if this AI message is generated in response to an uploaded file or directly)
    // Actually, reply_to isn't passed in payload easily. The client sends contextMessages. We can just insert it to the group.

    // Handle stream generation via AI Service
    const { response, mode, providerName, modelName } = await AIService.handleChatRequest(
      payload,
      emotionalSupportInstructions,
      longTermMemoriesInstructions,
      // onFinish Callback -> Runs when the AI has finished generating successfully
      async (text, provider, model, durationMs) => {
        try {
          if (user) {
            // 1. Insert execution log to `ai_logs`
            await supabase.from('ai_logs').insert({
              user_id: user.id,
              room_id: groupId || null,
              prompt: prompt,
              response: text,
              provider: provider,
              model: model,
              response_time_ms: durationMs,
              success: true,
              category: category
            });

            // 2. Perform AI memory extraction
            await MemoryService.extractAndStoreMemory(user.id, prompt, category);

            // 2.5 Trigger background summarization if conversation is long
            if (contextMessages && contextMessages.length > 8) {
              MemoryService.triggerBackgroundSummarization(user.id, groupId || `personal_${user.id}`, contextMessages);
            }
          }

          // 3. SECURE DB INSERTION: Persist AI response permanently into `messages` table
          const ROCKY_ID = '00000000-0000-0000-0000-000000000000';
          
          const { error: aiInsertError } = await supabase.from('messages').insert({
            id: aiMessageId, // The ID the client expects for optimistic UI resolution
            group_id: groupId,
            sender_id: ROCKY_ID,
            message: text,
            type: 'ai',
            category: category,
            reply_to: null
          });

          if (aiInsertError) {
            console.error('Server-side AI message insertion failed:', aiInsertError);
          } else if (user) {
            // Trigger AI response/notes/PDF notification
            const cleanPrompt = (prompt || '').toLowerCase()
            const isPdfSummary = cleanPrompt.includes('pdf') || cleanPrompt.includes('summary') || cleanPrompt.includes('summarize')
            const isNotesGen = cleanPrompt.includes('note') || cleanPrompt.includes('study guide') || cleanPrompt.includes('notes')

            let title = 'rocky companion response ⚡'
            let bodyText = text.length > 100 ? text.substring(0, 97) + '...' : text
            let notificationType = 'completed response'

            if (isPdfSummary) {
              title = 'ai study summary ready 📄'
              bodyText = 'rocky has generated a PDF study summary for you.'
              notificationType = 'pdf summary'
            } else if (isNotesGen) {
              title = 'ai study notes generated 📝'
              bodyText = 'rocky has created structured study notes for you.'
              notificationType = 'generated notes'
            }

            await createNotification({
              userId: user.id,
              title,
              body: bodyText,
              category: 'ai',
              type: notificationType,
              relatedId: aiMessageId
            }).catch(err => {
              console.error('Failed to trigger AI notification:', err)
            })
          }

        } catch (dbErr) {
          console.error('Database connection error in AI logging/memory/message insert:', dbErr);
        }
      },
      // onFailure Callback -> Runs for any provider failures during routing
      async (provider, model, durationMs, errorMsg) => {
        try {
          if (user) {
            await supabase.from('ai_logs').insert({
              user_id: user.id,
              room_id: groupId || null,
              prompt: prompt,
              response: null,
              provider: provider,
              model: model,
              response_time_ms: durationMs,
              success: false,
              error_message: errorMsg,
              category: category
            });
          }
        } catch (dbErr) {
          console.error('Database logging error for failed provider:', dbErr);
        }
      }
    );

    // Add metadata headers so the client knows provider info and rendering modes
    const headers = new Headers(response.headers);
    headers.set('X-AI-Mode', mode);

    return new Response(response.body, {
      status: response.status,
      headers,
    });

  } catch (error: any) {
    console.error('Error in /api/ai/chat:', error);

    const errString = String(error?.message || error || '').toLowerCase();
    
    if (errString.includes('gemini_api_key_missing')) {
      const warningText = `⚠️ **Gemini API Key Missing**\n\nTo activate Rocky, please add \`GEMINI_API_KEY\` to your \`.env.local\` file and restart the server.`;
      return NextResponse.json({ error: 'Gemini API Key Missing', message: warningText }, { status: 400 });
    }

    if (errString.includes('quota') || errString.includes('resource_exhausted') || errString.includes('429') || errString.includes('rate limit')) {
      const quotaWarning = `⚠️ **Gemini API Quota Exhausted**\n\nRocky is currently out of tokens or has exceeded the free-tier rate limits:\n- **Minute-based limits (15 RPM / 1M TPM):** Resets automatically at the start of the next minute.\n- **Daily limits (1500 RPD):** Resets daily at midnight UTC.\n\nPlease wait a moment and try again.`;
      return NextResponse.json({ error: 'Quota Limit Exceeded', message: quotaWarning }, { status: 429 });
    }

    const defaultWarning = `⚠️ **Rocky Connection Issue**\n\nRocky failed to respond due to an unexpected connection error: \`${error?.message || 'Unknown error'}\`.`;
    return NextResponse.json({ error: 'Failed to process AI request', message: defaultWarning }, { status: 500 });
  }
}
