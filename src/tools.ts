export const availableTools = [
  {
    type: 'function',
    function: {
      name: 'get_current_time',
      description: 'Get the current local time',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
      strict: false
    },
  },
];

export async function executeTool(name: string, argsStr: string): Promise<string> {
  if (name === 'get_current_time') {
    return new Date().toISOString();
  }
  return `Error: Tool ${name} not found`;
}
