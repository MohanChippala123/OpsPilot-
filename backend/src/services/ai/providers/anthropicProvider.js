export class AnthropicProvider {
  constructor({ apiKey }) {
    this.apiKey = apiKey;
  }

  async analyzeMessage() {
    throw new Error('Anthropic provider is not configured in this MVP. Implement fetch call here using the same analyzeMessage contract.');
  }
}
