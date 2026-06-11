import { AIRequest, AIResponse } from '@/types/ai';
import { FallbackManager } from './core/fallback-manager';

// ─── Intent detection helpers ────────────────────────────────────────────────

function promptReferencesImage(prompt: string): boolean {
  const p = prompt.toLowerCase();
  return (
    p.includes('image') || p.includes('picture') || p.includes('photo') ||
    p.includes('what is in') || p.includes('what\'s in') || p.includes('describe') ||
    p.includes('analyze') || p.includes('look at') || p.includes('see') ||
    p.includes('show') || p.includes('this') || p.includes('color') ||
    p.includes('what does') || p.includes('identify') || p.includes('read this')
  );
}

function promptReferencesPDF(prompt: string): boolean {
  const p = prompt.toLowerCase();
  return (
    p.includes('pdf') || p.includes('document') || p.includes('doc') ||
    p.includes('summarize') || p.includes('summary') || p.includes('read') ||
    p.includes('extract') || p.includes('what does') || p.includes('this file') ||
    p.includes('the file') || p.includes('the doc') || p.includes('content') ||
    p.includes('text in') || p.includes('what is in the') || p.includes('analyze the')
  );
}

function promptRequestsPDFGeneration(prompt: string): boolean {
  const p = prompt.toLowerCase();
  const createWords = ['create', 'generate', 'write', 'make', 'draft', 'produce', 'prepare', 'build', 'compose'];
  const docWords = ['pdf', 'document', 'report', 'cv', 'resume', 'letter', 'essay', 'article', 'proposal', 'contract', 'invoice', 'plan', 'outline', 'template', 'note', 'summary', 'guide', 'handbook', 'manual'];
  const hasCreate = createWords.some(w => p.includes(w));
  const hasDoc = docWords.some(w => p.includes(w));
  return hasCreate && hasDoc;
}

// ─── PDF text extraction ──────────────────────────────────────────────────────

async function extractPDFText(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    const text = textResult.text?.trim();
    await parser.destroy();

    if (!text) return '[PDF appears to be empty or image-based with no extractable text]';
    return text.length > 8000 ? text.slice(0, 8000) + '\n\n...[truncated for length]' : text;
  } catch (err) {
    console.error('PDF extraction error:', err);
    return '[Could not extract text from PDF — it may be encrypted or image-based]';
  }
}

// ─── System prompt configuration ──────────────────────────────────────────────

const BASE_SYSTEM_PROMPT = `You are a helpful, intelligent, and slightly playful AI companion integrated into a group chat. 
You act as the unofficial "6th friend" of the group. Your name is Rocky.
Your tone should be casual, conversational, and emotionally aware. 
Avoid being overly corporate or sterile. Use emojis naturally but don't overdo it. 
When asked technical questions, format code and markdown beautifully.
Keep your responses concise as they are part of a fast-paced chat environment.
`;

const PDF_GENERATE_SUFFIX = `
The user has explicitly asked you to CREATE or GENERATE a document. 
Respond with richly formatted, well-structured markdown that is suitable for export as a PDF.
Use proper headings (# ## ###), bullet points, bold text, tables, and other markdown formatting.
Start your response with the document content directly — no preamble like "Here is the document:".
`;

const STUDY_MODE_SUFFIX = `
The user is currently studying in a collaborative Study Mode session.
Adjust your behavior as follows:
- Act as a quiet, supportive, and focused study companion.
- Keep your tone supportive, calm, and encouraging.
- Avoid casual emoji/banter spam or distracting conversation.
- Keep explanations clear, structured, and concise (use revision bullet points, step-by-step code annotations, and clear definitions where appropriate).
`;

// ─── Core AI Service ─────────────────────────────────────────────────────────

export class AIService {
  
  static async handleChatRequest(
    request: AIRequest,
    emotionalContext: string,
    memoryContext: string,
    onFinishCb?: (text: string, provider: string, model: string, durationMs: number) => Promise<void>,
    onFailureCb?: (provider: string, model: string, durationMs: number, errorMsg: string) => Promise<void>
  ): Promise<{ response: Response; mode: AIResponse['mode']; providerName: string; modelName: string }> {
    const { prompt, contextMessages, attachedFile, studyModeActive } = request;

    // Detect intent
    const isPDFGen = promptRequestsPDFGeneration(prompt);
    const isImgRef = !isPDFGen && attachedFile?.type === 'image' && promptReferencesImage(prompt);
    const isPDFRef = !isPDFGen && attachedFile?.type === 'pdf' && promptReferencesPDF(prompt);

    let mode: AIResponse['mode'] = 'text';
    if (isPDFGen) mode = 'pdf-generate';
    else if (isImgRef) mode = 'image-analyze';
    else if (isPDFRef) mode = 'pdf-analyze';

    // Build system prompt
    let systemPrompt = BASE_SYSTEM_PROMPT + emotionalContext + memoryContext;
    if (isPDFGen) systemPrompt += PDF_GENERATE_SUFFIX;
    if (studyModeActive) systemPrompt += STUDY_MODE_SUFFIX;

    if (isPDFRef && attachedFile?.url) {
      const extractedText = await extractPDFText(attachedFile.url);
      systemPrompt += `\n\n[Document context — the user is asking about this PDF file "${attachedFile.name || 'document.pdf'}"]\n${extractedText}\n[End of document context]`;
    }

    // Build core messages
    const messages: any[] = contextMessages
      .filter((msg: any) => msg.message && msg.type !== 'ai')
      .map((msg: any) => ({
        role: 'user',
        content: msg.message,
      }));

    // Build the final user message payload
    if (isImgRef && attachedFile?.url) {
      try {
        const imageRes = await fetch(attachedFile.url);
        if (!imageRes.ok) throw new Error(`Image download failed: ${imageRes.status}`);
        const arrayBuffer = await imageRes.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);
        
        messages.push({
          role: 'user',
          content: [
            { type: 'image', image: imageBuffer },
            { type: 'text', text: prompt },
          ],
        });
      } catch (err) {
        console.error('Image download error, falling back to URL:', err);
        messages.push({
          role: 'user',
          content: [
            { type: 'image', image: new URL(attachedFile.url) },
            { type: 'text', text: prompt },
          ],
        });
      }
    } else {
      messages.push({
        role: 'user',
        content: prompt,
      });
    }

    // Call Provider Manager via Fallback Manager
    const { response, providerName, modelName } = await FallbackManager.streamChat(
      request,
      systemPrompt,
      messages,
      onFinishCb,
      onFailureCb
    );

    return { response, mode, providerName, modelName };
  }
}
