export interface AIMessage {
  id: string;
  groupId: string;
  senderId: string;
  message: string;
  type: 'ai';
  category?: string;
  replyTo?: string | null;
  createdAt: string;
}

export interface AIResponse {
  messageId: string;
  text: string;
  mode: 'text' | 'pdf-generate' | 'image-analyze' | 'pdf-analyze';
}

export interface AIRequest {
  prompt: string;
  groupId: string;
  aiMessageId: string;
  category?: string;
  contextMessages: any[];
  attachedFile?: {
    type: 'image' | 'pdf';
    url: string;
    name: string;
  } | null;
  studyModeActive?: boolean;
  providerPreference?: 'auto' | 'gemini' | 'openai' | 'openrouter';
}

export interface AIError {
  error: string;
  message: string;
  status: number;
}
