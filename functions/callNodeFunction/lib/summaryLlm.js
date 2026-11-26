import { env } from "./config.js";
import { accessToken } from "./expertEmbeddings.js";

/**
 * The model behind the weekly issue report summary (issue #2234). Configured separately from the
 * Assistant's chat model, so a stronger model can plan the week while the chat stays fast and
 * cheap. Spoken to through the OpenAI-compatible Chat Completions API, like the Assistant
 * (ADR 0005, ADR 0008), with `store: false` and no search tools.
 *
 * SUMMARY_LLM_PROVIDER selects the provider:
 * - "vertex": Gemini on Vertex AI's OpenAI-compatible endpoint (SUMMARY_LLM_BASE_URL), with the
 *   function's service account token.
 * - "openai": any other OpenAI-compatible endpoint, e.g. the IONOS AI Model Hub, with
 *   SUMMARY_LLM_API_KEY.
 * - "fake": a canned summary for local development and tests.
 * - unset: no summary is written.
 */

const DEFAULT_MAX_OUTPUT_TOKENS = 6000;
const TIMEOUT_MS = 140_000;

const number = (read, name) => {
  const value = Number(read(name));
  return read(name) && Number.isFinite(value) ? value : null;
};

/** `read` looks up one setting by name (lib/config.js by default; tests pass their own). */
export const summaryLlmConfig = (read = env) => {
  const provider = (read("SUMMARY_LLM_PROVIDER") || "").trim().toLowerCase();
  if (provider === "fake") return { provider, model: "fake", priceInput: 0, priceOutput: 0, maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS };
  if (provider !== "vertex" && provider !== "openai") return null;
  const baseUrl = (read("SUMMARY_LLM_BASE_URL") || "").trim().replace(/\/+$/, "");
  const model = (read("SUMMARY_LLM_MODEL") || "").trim();
  if (!baseUrl || !model) throw new Error("SUMMARY_LLM_BASE_URL and SUMMARY_LLM_MODEL must be set");
  // Like the Assistant: never Vertex's global endpoint, which may process outside the EU.
  if (/\/\/aiplatform\.googleapis\.com/.test(baseUrl)) throw new Error("SUMMARY_LLM_BASE_URL must not be Vertex AI's global endpoint");
  const apiKey = (read("SUMMARY_LLM_API_KEY") || "").trim() || null;
  if (provider === "openai" && !apiKey) throw new Error("SUMMARY_LLM_API_KEY must be set for the openai provider");
  let extraBody = {};
  if (read("SUMMARY_LLM_EXTRA_BODY")) {
    try {
      extraBody = JSON.parse(read("SUMMARY_LLM_EXTRA_BODY"));
    } catch {
      throw new Error("SUMMARY_LLM_EXTRA_BODY is not JSON");
    }
  }
  return {
    provider,
    baseUrl,
    model,
    apiKey,
    extraBody,
    priceInput: number(read, "SUMMARY_LLM_PRICE_INPUT_EUR_PER_MTOK"),
    priceOutput: number(read, "SUMMARY_LLM_PRICE_OUTPUT_EUR_PER_MTOK"),
    maxOutputTokens: number(read, "SUMMARY_LLM_MAX_OUTPUT_TOKENS") ?? DEFAULT_MAX_OUTPUT_TOKENS,
  };
};

/** Estimated cost in EUR, or null when the prices are not configured. */
export const costEur = (config, usage) =>
  config.priceInput === null || config.priceOutput === null
    ? null
    : (usage.inputTokens * config.priceInput + usage.outputTokens * config.priceOutput) / 1_000_000;

/**
 * One completion without tools. Returns the text and the token usage. Errors carry the status code
 * only, never the request or response content.
 */
export const complete = async (config, messages, { fetchImpl = globalThis.fetch } = {}) => {
  if (config.provider === "fake") {
    const input = messages.map((m) => m.content).join("\n").length;
    return {
      text: "## Overview\n\n(Fake summary for local development.)",
      usage: { inputTokens: Math.ceil(input / 4), outputTokens: 10 },
    };
  }
  const token = config.provider === "vertex" ? config.apiKey || (await accessToken(fetchImpl)) : config.apiKey;
  const response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      ...config.extraBody,
      model: config.model,
      messages,
      max_tokens: config.maxOutputTokens,
      store: false,
      stream: false,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`The summary model answered ${response.status}`);
  const body = await response.json();
  const text = body?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("The summary model returned no text");
  return {
    text: text.trim(),
    usage: { inputTokens: body?.usage?.prompt_tokens ?? 0, outputTokens: body?.usage?.completion_tokens ?? 0 },
  };
};
