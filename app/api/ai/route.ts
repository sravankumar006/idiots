import { NextResponse } from 'next/server'
import { streamText } from 'ai'
import { geminiModel } from '@/lib/ai/gemini'
import { createClient } from '@/lib/supabase/server'

// System prompt defining the "6th friend" persona
const SYSTEM_PROMPT = `You are a helpful, intelligent, and slightly playful AI companion integrated into a group chat. 
You act as the unofficial "6th friend" of the group. 
Your tone should be casual, conversational, and emotionally aware. 
Avoid being overly corporate or sterile. Use emojis naturally but don't overdo it. 
When asked technical questions, format code and markdown beautifully.
Keep your responses concise as they are part of a fast-paced chat environment.
`

export async function POST(req: Request) {
  try {
    const { prompt, groupId, aiMessageId, contextMessages } = await req.json()

    // Guard against missing API Key
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      const warningText = `⚠️ **Gemini API Key Missing**

To activate your AI Companion, please add \`GEMINI_API_KEY\` to your \`.env.local\` file and restart the Next.js development server:

\`\`\`bash
GEMINI_API_KEY=your_actual_api_key_here
\`\`\``;
      
      return NextResponse.json({ error: 'Gemini API Key Missing', message: warningText }, { status: 400 });
    }

    // Build the AI conversation history
    const coreMessages = contextMessages.map((msg: any) => ({
      role: msg.type === 'ai' ? 'assistant' : 'user',
      content: msg.message,
    }))

    // Add the current prompt
    coreMessages.push({
      role: 'user',
      content: prompt,
    })

    // Prepare stream
    const result = streamText({
      model: geminiModel,
      system: SYSTEM_PROMPT,
      messages: coreMessages,
      onFinish: async ({ text }) => {
        try {
          const supabase = await createClient()
          const { data: { user } } = await supabase.auth.getUser()
          
          if (user) {
            const { error: logError } = await supabase.from('ai_logs').insert({
              user_id: user.id,
              room_id: groupId || null,
              prompt: prompt,
              response: text,
              model: 'gemini-2.5-flash'
            })
            
            if (logError) {
              console.error('Error inserting AI log:', logError)
            }
          }
        } catch (dbErr) {
          console.error('Database connection error in AI logging:', dbErr)
        }
      }
    })

    return result.toTextStreamResponse()

  } catch (error) {
    console.error('Error in /api/ai:', error)
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 })
  }
}
