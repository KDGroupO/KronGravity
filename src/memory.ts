import admin from 'firebase-admin';
import { config } from './config.js';
import type { MessageRecord } from './types.js';

// Initialize Firebase Admin SDK
import { readFileSync } from 'fs';
import { resolve } from 'path';

try {
  if (!admin.apps.length) {
    let credential;
    
    // Si estamos en la nube, leemos la variable de entorno
    if (config.firebaseServiceAccount) {
      const serviceAccount = JSON.parse(config.firebaseServiceAccount);
      credential = admin.credential.cert(serviceAccount);
    } 
    // Si estamos en local, leemos el archivo físico
    else {
      // Intentamos cargar el archivo local asumiendo que está en la raíz
      const localPath = resolve(process.cwd(), 'service-account.json');
      const serviceAccount = JSON.parse(readFileSync(localPath, 'utf8'));
      credential = admin.credential.cert(serviceAccount);
    }

    admin.initializeApp({
      credential
    });
    console.log('[KronGravity] Firebase Admin initialized successfully.');
  }
} catch (error) {
  console.error('[KronGravity] Failed to initialize Firebase:', error);
  console.warn('Ensure FIREBASE_SERVICE_ACCOUNT is set in cloud OR service-account.json exists locally.');
}

const db = admin.firestore();

export const memory = {
  async addMessage(userId: number, role: string, content: string | null, meta: any = null) {
    try {
      const metaStr = meta ? JSON.stringify(meta) : null;
      const message: Omit<MessageRecord, 'id'> = {
        userId,
        role: role as MessageRecord['role'],
        content: content || null,
        meta: metaStr,
        timestamp: admin.firestore.FieldValue.serverTimestamp() as any
      };
      
      await db.collection('messages').add(message);
    } catch (error) {
      console.error('[KronGravity DB Error] Failed to add message:', error);
    }
  },

  async getHistory(userId: number, limit: number = 20): Promise<MessageRecord[]> {
    try {
      const snapshot = await db.collection('messages')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const records: MessageRecord[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        records.push({
          id: doc.id,
          userId: data.userId,
          role: data.role,
          content: data.content,
          meta: data.meta,
          timestamp: data.timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString()
        } as MessageRecord);
      });

      return records.reverse(); // Return in chronological order
    } catch (error) {
      console.error('[KronGravity DB Error] Failed to get history:', error);
      return [];
    }
  },

  async clearHistory(userId: number) {
    try {
      const snapshot = await db.collection('messages')
        .where('userId', '==', userId)
        .get();

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`[KronGravity] Cleared history for user ${userId}`);
    } catch (error) {
      console.error('[KronGravity DB Error] Failed to clear history:', error);
    }
  }
};
