import { validateConfig } from './config.js';
import { bot } from './bot.js';
import http from 'http';

async function main() {
  try {
    console.log('Validating configuration...');
    validateConfig();

    // Start a dummy HTTP server so Render Web Service (Free Tier) doesn't crash
    const port = process.env.PORT || 3000;
    const server = http.createServer((req, res) => {
      res.writeHead(200);
      res.end('KronGravity AI Agent is running!');
    });
    server.listen(port, () => {
      console.log(`[KronGravity] Dummy HTTP server listening on port ${port}`);
    });
    
    console.log('Starting KronGravity bot...');
    bot.start({
      onStart(botInfo) {
        console.log(`[KronGravity] Bot initialized successfully as @${botInfo.username}`);
        console.log(`[KronGravity] Listening for allowed user IDs...`);
      },
    });
    
    // Handle graceful shutdown
    const stopRunner = () => {
      console.log('\nStopping KronGravity...');
      bot.stop();
      process.exit(0);
    };

    process.once('SIGINT', stopRunner);
    process.once('SIGTERM', stopRunner);
  } catch (error) {
    console.error('[KronGravity] Failed to start:', error);
    process.exit(1);
  }
}

main();
