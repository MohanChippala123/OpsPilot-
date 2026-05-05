import { MockProvider } from './providers/mockProvider.js';
import { OpenAiProvider } from './providers/openAiProvider.js';
import { AnthropicProvider } from './providers/anthropicProvider.js';
import { env } from '../../config/env.js';

export function createAiProvider() {
  const provider = env.AI_PROVIDER;
  if (provider === 'openai') return new OpenAiProvider({ apiKey: env.OPENAI_API_KEY });
  if (provider === 'anthropic') return new AnthropicProvider({ apiKey: env.ANTHROPIC_API_KEY });
  return new MockProvider();
}

export const aiProvider = createAiProvider();
