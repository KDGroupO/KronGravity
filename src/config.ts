import dotenv from 'dotenv';
import type { Config } from './types.js';

dotenv.config();

function parseUserIds(idsStr?: string): number[] {
  if (!idsStr) return [];
  return idsStr.split(',')
    .map(id => parseInt(id.trim(), 10))
    .filter(id => !isNaN(id));
}

export const config: Config = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramAllowedUserIds: parseUserIds(process.env.TELEGRAM_ALLOWED_USER_IDS),
  groqApiKey: process.env.GROQ_API_KEY || '',
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  openrouterModel: process.env.OPENROUTER_MODEL || 'openrouter/free',
  dbPath: process.env.DB_PATH || './memory.db',
  firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT,
};

export function validateConfig() {
  const missing: string[] = [];
  if (!config.telegramBotToken || config.telegramBotToken === 'SUTITUYE POR EL TUYO') {
    missing.push('TELEGRAM_BOT_TOKEN');
  }
  if (config.telegramAllowedUserIds.length === 0) {
    missing.push('TELEGRAM_ALLOWED_USER_IDS');
  }
  if (!config.groqApiKey || config.groqApiKey === 'SUTITUYE POR EL TUYO') {
    missing.push('GROQ_API_KEY');
  }

  if (missing.length > 0) {
    throw new Error(`Missing or invalid required environment variables: ${missing.join(', ')}`);
  }
}
