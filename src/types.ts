export interface MessageRecord {
  id: string | number;
  userId: number;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | null;
  meta?: string | null;
  timestamp: string;
}

export interface Config {
  telegramBotToken: string;
  telegramAllowedUserIds: number[];
  groqApiKey: string;
  openrouterApiKey?: string;
  openrouterModel: string;
  dbPath: string;
  firebaseServiceAccount?: string;
}
