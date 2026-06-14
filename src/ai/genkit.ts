import { genkit, type GenerateRequest } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Initialize Genkit AI with Google AI backend
 * Configured with Gemini 2.5 Flash for optimal speed and accuracy
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});

/**
 * Configuration for AI model defaults
 */
export const AI_CONFIG = {
  model: 'googleai/gemini-2.5-flash',
  temperature: 0.7,
  maxOutputTokens: 2048,
  topP: 0.9,
  topK: 40,
} as const;

/**
 * Error handler for AI operations
 * Provides user-friendly error messages
 */
export class AIError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AIError';
  }
}

/**
 * Safely execute an AI request with error handling
 * @param request - Genkit generate request
 * @returns Generated content or error message
 */
export async function safeAIGenerate(request: GenerateRequest) {
  try {
    const response = await ai.generate(request);
    return {
      success: true,
      data: response,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AI error';
    console.error('AI Generation Error:', message);
    return {
      success: false,
      error: new AIError(message, 'AI_GENERATION_FAILED'),
    };
  }
}
