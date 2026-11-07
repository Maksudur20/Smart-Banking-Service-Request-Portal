const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const isOpenRouterConfigured = Boolean(
  process.env.OPENROUTER_API_KEY &&
  process.env.OPENROUTER_API_KEY !== 'mock_openrouter_key'
);

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

if (!isOpenRouterConfigured) {
  console.warn('[OpenRouter] Running with mock/unconfigured API key. AI reviews will use safe fallback simulation mode.');
}

module.exports = {
  isOpenRouterConfigured,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTER_API_URL,
  DEFAULT_MODEL,
};

