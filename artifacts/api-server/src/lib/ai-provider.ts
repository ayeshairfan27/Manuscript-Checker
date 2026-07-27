/**
 * Modular AI provider abstraction.
 *
 * Controlled entirely through environment variables — no code changes needed
 * to swap providers.
 *
 * Environment variables:
 *   AI_PROVIDER   "openai-compatible" (default) | "anthropic"
 *   AI_API_KEY    API key for the chosen provider
 *   AI_BASE_URL   Base URL for OpenAI-compatible endpoints, e.g.:
 *                   Groq (free tier):   https://api.groq.com/openai/v1
 *                   OpenRouter (free):  https://openrouter.ai/api/v1
 *                   Ollama (local):     http://localhost:11434/v1
 *                   OpenAI:             https://api.openai.com/v1 (or omit)
 *   AI_MODEL      Model name, e.g.:
 *                   Groq free:   llama-3.3-70b-versatile
 *                   OpenRouter:  meta-llama/llama-3.1-8b-instruct:free
 *                   Ollama:      llama3.2
 *                   Anthropic:   claude-sonnet-4-6
 *
 * Free provider quick-start (Groq):
 *   1. Sign up at https://console.groq.com (free, no credit card)
 *   2. Create an API key
 *   3. Set:  AI_API_KEY=<your key>
 *            AI_BASE_URL=https://api.groq.com/openai/v1
 *            AI_MODEL=llama-3.3-70b-versatile
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { logger } from "./logger";

export type AIProviderType = "openai-compatible" | "anthropic";

interface ProviderConfig {
  type: AIProviderType;
  apiKey: string;
  baseUrl?: string;
  model: string;
}

const DEFAULT_MODELS: Record<AIProviderType, string> = {
  "openai-compatible": "llama-3.3-70b-versatile",
  anthropic: "claude-sonnet-4-6",
};

function loadConfig(): ProviderConfig {
  const type = (process.env["AI_PROVIDER"] ?? "openai-compatible") as AIProviderType;
  if (type !== "openai-compatible" && type !== "anthropic") {
    throw new Error(
      `AI_PROVIDER must be "openai-compatible" or "anthropic", got: "${type}"`,
    );
  }

  const apiKey = process.env["AI_API_KEY"] ?? "";
  const baseUrl = process.env["AI_BASE_URL"];
  const model = process.env["AI_MODEL"] ?? DEFAULT_MODELS[type];

  if (!apiKey) {
    throw new Error(
      `AI_API_KEY is not set. ` +
        `For a free provider set AI_PROVIDER=openai-compatible, ` +
        `AI_BASE_URL=https://api.groq.com/openai/v1, ` +
        `AI_MODEL=llama-3.3-70b-versatile, ` +
        `and AI_API_KEY=<your Groq key from console.groq.com>.`,
    );
  }

  return { type, apiKey, baseUrl, model };
}

async function runWithOpenAICompatible(
  config: ProviderConfig,
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  const client = new OpenAI({
    apiKey: config.apiKey,
    ...(config.baseUrl ? { baseURL: config.baseUrl } : {}),
  });

  logger.info({ model: config.model, provider: "openai-compatible" }, "Running AI completion");

  const response = await client.chat.completions.create({
    model: config.model,
    max_tokens: 4096,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error("OpenAI-compatible provider returned an empty response");
  }
  return text;
}

async function runWithAnthropic(
  config: ProviderConfig,
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  const client = new Anthropic({ apiKey: config.apiKey });

  logger.info({ model: config.model, provider: "anthropic" }, "Running AI completion");

  const message = await client.messages.create({
    model: config.model,
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const block = message.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Anthropic returned an unexpected response format");
  }
  return block.text;
}

/**
 * Run a single-turn completion with the configured AI provider.
 * Throws if the provider is misconfigured or the call fails.
 */
export async function runCompletion(
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  const config = loadConfig();

  if (config.type === "anthropic") {
    return runWithAnthropic(config, systemPrompt, userMessage);
  }
  return runWithOpenAICompatible(config, systemPrompt, userMessage);
}

/**
 * Returns a human-readable description of the active provider for health/debug.
 */
export function getProviderInfo(): { provider: AIProviderType; model: string; baseUrl?: string } {
  try {
    const config = loadConfig();
    return { provider: config.type, model: config.model, baseUrl: config.baseUrl };
  } catch {
    return { provider: "openai-compatible", model: "(not configured)" };
  }
}
