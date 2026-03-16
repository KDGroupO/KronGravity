import { Bot, Context, NextFunction } from 'grammy';
import { config } from './config.js';
import { processAgentMessage } from './agent.js';
import { memory } from './memory.js';

export const bot = new Bot(config.telegramBotToken);

// Whitelist Middleware
bot.use(async (ctx: Context, next: NextFunction) => {
  const userId = ctx.from?.id;
  if (!userId || !config.telegramAllowedUserIds.includes(userId)) {
    console.warn(`Unauthorized access attempt from user ID: ${userId}`);
    // Security measure: ignore unauthorized users completely
    return;
  }
  await next();
});

bot.command('start', async (ctx) => {
  await memory.clearHistory(ctx.from!.id);
  await ctx.reply('¡Hola! Soy KronGravity, tu agente de IA personal. He reiniciado mi memoria. ¿En qué puedo ayudarte?');
});

bot.command('clear', async (ctx) => {
  await memory.clearHistory(ctx.from!.id);
  await ctx.reply('Memoria borrada. ¡Empezamos de cero!');
});

bot.on('message:text', async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text;

  // Send a typing indicator
  await ctx.replyWithChatAction('typing');

  try {
    const response = await processAgentMessage(userId, text);
    
    // Telegram message length limit is 4096 characters
    if (response.length > 4000) {
      // Chunk response if too long
      for (let i = 0; i < response.length; i += 4000) {
        await ctx.reply(response.substring(i, i + 4000));
      }
    } else {
      await ctx.reply(response);
    }
  } catch (error) {
    console.error('Error processing message:', error);
    await ctx.reply('Hubo un error al procesar tu mensaje. Revisa los logs de la consola.');
  }
});
