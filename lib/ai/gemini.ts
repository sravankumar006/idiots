import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Retrieve the API key from environment variables
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

// Create and export the Google AI provider
export const googleProvider = createGoogleGenerativeAI({
  apiKey: apiKey,
});

// Export the default model we use throughout the app (gemini-1.5-flash)
export const geminiModel = googleProvider('gemini-1.5-flash');
