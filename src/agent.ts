import { memory } from './memory.js';
import { generateCompletion } from './llm.js';
import { executeTool } from './tools.js';

const MAX_ITERATIONS = 5;
const SYSTEM_PROMPT = `You are KronGravity, a personal AI agent running locally and communicating exclusively via Telegram. 
Respond accurately and use tools when required. Always verify facts before answering if a tool is available. Be concise and keep your answers direct.`;

export async function processAgentMessage(userId: number, text: string): Promise<string> {
  // 1. Add user message
  await memory.addMessage(userId, 'user', text);

  let iterations = 0;
  let finalResponse = '';

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    
    // 2. Load context
    const history = await memory.getHistory(userId, 15);
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map(msg => {
        const meta = msg.meta ? JSON.parse(msg.meta) : {};
        if (msg.role === 'assistant' && meta.tool_calls) {
          return { role: 'assistant', content: msg.content, tool_calls: meta.tool_calls };
        }
        if (msg.role === 'tool') {
          return { role: 'tool', content: msg.content || '', tool_call_id: meta.tool_call_id };
        }
        return { role: msg.role as 'user' | 'assistant', content: msg.content || '' };
      })
    ];

    // 3. Call LLM
    const message = await generateCompletion(messages);

    // 4. Handle tool calls
    if (message.tool_calls && message.tool_calls.length > 0) {
      // Save assistant's tool intent
      await memory.addMessage(userId, 'assistant', message.content, { tool_calls: message.tool_calls });
      
      for (const toolCall of message.tool_calls) {
        console.log(`Agent executing tool: ${toolCall.function.name}`);
        const result = await executeTool(toolCall.function.name, toolCall.function.arguments);
        
        // Save tool response
        await memory.addMessage(userId, 'tool', result, { tool_call_id: toolCall.id });
      }
      // Loop continues...
    } else {
      // Final response
      finalResponse = message.content || 'I have no response.';
      await memory.addMessage(userId, 'assistant', finalResponse);
      break;
    }
  }

  if (iterations >= MAX_ITERATIONS) {
    const err = 'Agent reached maximum loop iterations limit.';
    await memory.addMessage(userId, 'assistant', err);
    return finalResponse ? `${finalResponse}\n\n[System WARNING: ${err}]` : err;
  }

  return finalResponse;
}
