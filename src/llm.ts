import Groq from 'groq-sdk';
import OpenAI from 'openai';
import { config } from './config.js';
import { availableTools } from './tools.js';

const groq = new Groq({ apiKey: config.groqApiKey });

let openrouter: OpenAI | null = null;
if (config.openrouterApiKey && config.openrouterApiKey !== 'SUTITUYE POR EL TUYO') {
  openrouter = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: config.openrouterApiKey,
    defaultHeaders: {
      'HTTP-Referer': 'https://krongravity.local', 
      'X-Title': 'KronGravity',
    }
  });
}

export async function generateCompletion(messages: any[]) {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      tools: availableTools as any,
      tool_choice: 'auto',
    });
    return response.choices[0].message;
  } catch (error: any) {
    if ((error?.status === 429 || error?.status >= 500) && openrouter) {
      console.log('Groq limits reached or error, falling back to OpenRouter');
      const response = await openrouter.chat.completions.create({
        model: config.openrouterModel,
        messages,
        tools: availableTools as any,
        tool_choice: 'auto',
      });
      return response.choices[0].message;
    }
    throw error;
  }
}
