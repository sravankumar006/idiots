import { NextResponse } from 'next/server'
import { streamText } from 'ai'
import { geminiModel } from '@/lib/ai/gemini'
import { createClient } from '@/lib/supabase/server'

// ─── Intent detection helpers ────────────────────────────────────────────────

/** Returns true if the prompt appears to reference an image */
function promptReferencesImage(prompt: string): boolean {
  const p = prompt.toLowerCase()
  return (
    p.includes('image') || p.includes('picture') || p.includes('photo') ||
    p.includes('what is in') || p.includes('what\'s in') || p.includes('describe') ||
    p.includes('analyze') || p.includes('look at') || p.includes('see') ||
    p.includes('show') || p.includes('this') || p.includes('color') ||
    p.includes('what does') || p.includes('identify') || p.includes('read this')
  )
}

/** Returns true if the prompt appears to reference a document/PDF */
function promptReferencesPDF(prompt: string): boolean {
  const p = prompt.toLowerCase()
  return (
    p.includes('pdf') || p.includes('document') || p.includes('doc') ||
    p.includes('summarize') || p.includes('summary') || p.includes('read') ||
    p.includes('extract') || p.includes('what does') || p.includes('this file') ||
    p.includes('the file') || p.includes('the doc') || p.includes('content') ||
    p.includes('text in') || p.includes('what is in the') || p.includes('analyze the')
  )
}

/** Returns true if the prompt is requesting PDF creation/generation */
function promptRequestsPDFGeneration(prompt: string): boolean {
  const p = prompt.toLowerCase()
  const createWords = ['create', 'generate', 'write', 'make', 'draft', 'produce', 'prepare', 'build', 'compose']
  const docWords = ['pdf', 'document', 'report', 'cv', 'resume', 'letter', 'essay', 'article', 'proposal', 'contract', 'invoice', 'plan', 'outline', 'template', 'note', 'summary', 'guide', 'handbook', 'manual']
  const hasCreate = createWords.some(w => p.includes(w))
  const hasDoc = docWords.some(w => p.includes(w))
  return hasCreate && hasDoc
}

// ─── PDF text extraction ──────────────────────────────────────────────────────

async function extractPDFText(url: string): Promise<string> {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.status}`)
    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Use Mehmet Kozan's modern PDFParse class (pdf-parse 2.x)
    const { PDFParse } = await import('pdf-parse')
    const parser = new PDFParse({ data: buffer })
    const textResult = await parser.getText()
    const text = textResult.text?.trim()
    await parser.destroy()

    if (!text) return '[PDF appears to be empty or image-based with no extractable text]'
    // Limit to ~8000 chars to avoid token overflow
    return text.length > 8000 ? text.slice(0, 8000) + '\n\n...[truncated for length]' : text
  } catch (err) {
    console.error('PDF extraction error:', err)
    return '[Could not extract text from PDF — it may be encrypted or image-based]'
  }
}

// ─── System prompt ────────────────────────────────────────────────────────────

const BASE_SYSTEM_PROMPT = `You are a helpful, intelligent, and slightly playful AI companion integrated into a group chat. 
You act as the unofficial "6th friend" of the group. 
Your tone should be casual, conversational, and emotionally aware. 
Avoid being overly corporate or sterile. Use emojis naturally but don't overdo it. 
When asked technical questions, format code and markdown beautifully.
Keep your responses concise as they are part of a fast-paced chat environment.
`

const PDF_GENERATE_SUFFIX = `
The user has explicitly asked you to CREATE or GENERATE a document. 
Respond with richly formatted, well-structured markdown that is suitable for export as a PDF.
Use proper headings (# ## ###), bullet points, bold text, tables, and other markdown formatting.
Start your response with the document content directly — no preamble like "Here is the document:".
`

const STUDY_MODE_SUFFIX = `
The user is currently studying in a collaborative Study Mode session.
Adjust your behavior as follows:
- Act as a quiet, supportive, and focused study companion.
- Keep your tone supportive, calm, and encouraging.
- Avoid casual emoji/banter spam or distracting conversation.
- Keep explanations clear, structured, and concise (use revision bullet points, step-by-step code annotations, and clear definitions where appropriate).
`

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { prompt, groupId, aiMessageId, contextMessages, attachedFile, studyModeActive } = await req.json()

    // Guard against missing API Key
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      const warningText = `⚠️ **Gemini API Key Missing**\n\nTo activate your AI Companion, please add \`GEMINI_API_KEY\` to your \`.env.local\` file and restart the Next.js development server:\n\n\`\`\`bash\nGEMINI_API_KEY=your_actual_api_key_here\n\`\`\``
      return NextResponse.json({ error: 'Gemini API Key Missing', message: warningText }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // ─── Query mood logs and visible AI memories for user context ────────────
    let emotionalSupportInstructions = ''
    let longTermMemoriesInstructions = ''

    if (user) {
      try {
        // Load recent mood logs
        const { data: moodLogs } = await supabase
          .from('mood_logs')
          .select('mood_rating, status_text')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3)
          
        if (moodLogs && moodLogs.length > 0) {
          const sum = moodLogs.reduce((acc, log) => acc + log.mood_rating, 0)
          const avg = sum / moodLogs.length
          if (avg <= 4) {
            emotionalSupportInstructions = `\n\n[USER MOOD INSIGHT: The user has been feeling low recently (average mood rating: ${avg.toFixed(1)}/10, status: "${moodLogs[0].status_text || 'quiet'}"). Adjust your tone to be soft, companion-like, and comforting. Do not be overly corporate or robotic. Suggest a short break or breathing exercise, and offer warm encouragement gently.]`
          }
        }

        // Load visible AI memories
        const { data: memories } = await supabase
          .from('ai_memories')
          .select('memory_text')
          .eq('user_id', user.id)
          .eq('is_visible', true)
          .limit(12)

        if (memories && memories.length > 0) {
          const factsList = memories.map(m => `- ${m.memory_text}`).join('\n')
          longTermMemoriesInstructions = `\n\n[AI MEMORIES: You have remembered these facts/habits/inside jokes about the user, integrate them naturally if contextually relevant:\n${factsList}\n]`
        }
      } catch (err) {
        console.warn("Failed to fetch mood logs or ai memories:", err)
      }
    }

    // ─── Detect intent ────────────────────────────────────────────────────────
    const isPDFGen   = promptRequestsPDFGeneration(prompt)
    const isImgRef   = !isPDFGen && attachedFile?.type === 'image' && promptReferencesImage(prompt)
    const isPDFRef   = !isPDFGen && attachedFile?.type === 'pdf'   && promptReferencesPDF(prompt)

    // Determine AI mode header to send back
    let aiMode: string = 'text'
    if (isPDFGen)  aiMode = 'pdf-generate'
    else if (isImgRef) aiMode = 'image-analyze'
    else if (isPDFRef) aiMode = 'pdf-analyze'

    // ─── System prompt ─────────────────────────────────────────────────────
    let systemPrompt = BASE_SYSTEM_PROMPT + emotionalSupportInstructions + longTermMemoriesInstructions
    if (isPDFGen) systemPrompt += PDF_GENERATE_SUFFIX
    if (studyModeActive) systemPrompt += STUDY_MODE_SUFFIX

    // ─── PDF text context ───────────────────────────────────────────────────
    let pdfContext = ''
    if (isPDFRef && attachedFile?.url) {
      const extractedText = await extractPDFText(attachedFile.url)
      pdfContext = `\n\n[Document context — the user is asking about this PDF file "${attachedFile.name || 'document.pdf'}"]\n${extractedText}\n[End of document context]`
      systemPrompt += pdfContext
    }

    // ─── Build conversation history ─────────────────────────────────────────
    const coreMessages: any[] = contextMessages
      .filter((msg: any) => msg.message && msg.type !== 'ai')
      .map((msg: any) => ({
        role: 'user' as const,
        content: msg.message,
      }))

    // ─── Build the final user message ───────────────────────────────────────
    if (isImgRef && attachedFile?.url) {
      try {
        const imageRes = await fetch(attachedFile.url)
        if (!imageRes.ok) throw new Error(`Image download failed: ${imageRes.status}`)
        const arrayBuffer = await imageRes.arrayBuffer()
        const imageBuffer = Buffer.from(arrayBuffer)
        coreMessages.push({
          role: 'user',
          content: [
            { type: 'image', image: imageBuffer },
            { type: 'text', text: prompt },
          ],
        })
      } catch (err) {
        console.error('Image download error, falling back to URL:', err)
        coreMessages.push({
          role: 'user',
          content: [
            { type: 'image', image: new URL(attachedFile.url) },
            { type: 'text', text: prompt },
          ],
        })
      }
    } else {
      coreMessages.push({
        role: 'user',
        content: prompt,
      })
    }

    // ─── Stream response ────────────────────────────────────────────────────
    const result = streamText({
      model: geminiModel,
      system: systemPrompt,
      messages: coreMessages,
      onFinish: async ({ text }) => {
        try {
          if (user) {
            // 1. Insert execution log
            await supabase.from('ai_logs').insert({
              user_id: user.id,
              room_id: groupId || null,
              prompt: prompt,
              response: text,
              model: 'gemini-2.5-flash'
            })

            // 2. Perform AI memory extraction
            // Look for patterns like "remember that X" or "inside joke: Y" or key user facts
            const lowerPrompt = prompt.toLowerCase()
            let extractedFact = ''

            if (lowerPrompt.includes('remember that')) {
              extractedFact = prompt.replace(/remember that/i, '').trim()
            } else if (lowerPrompt.includes('inside joke:')) {
              extractedFact = prompt.replace(/inside joke:/i, '').trim()
            } else if (lowerPrompt.includes('favorite topic is') || lowerPrompt.includes('favorite language is')) {
              extractedFact = prompt.trim()
            }

            if (extractedFact && extractedFact.length > 5 && extractedFact.length < 250) {
              await supabase.from('ai_memories').insert({
                user_id: user.id,
                memory_text: extractedFact,
                is_visible: true
              })
            }
          }
        } catch (dbErr) {
          console.error('Database connection error in AI logging/memory:', dbErr)
        }
      }
    })

    // Add X-AI-Mode header so the client knows how to render the response
    const streamResponse = result.toTextStreamResponse()
    const headers = new Headers(streamResponse.headers)
    headers.set('X-AI-Mode', aiMode)

    return new Response(streamResponse.body, {
      status: streamResponse.status,
      headers,
    })

  } catch (error) {
    console.error('Error in /api/ai:', error)
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 })
  }
}
