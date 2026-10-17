/**
 * Shared LLM / embeddings provider config.
 * Prefer Vercel AI Gateway; fall back to direct OpenAI.
 */

export type AiProviderConfig = {
  apiKey: string;
  baseUrl: string;
  chatModel: string;
  embeddingModel: string;
  viaGateway: boolean;
};

export function getAiProviderConfig(): AiProviderConfig | null {
  const gateway = process.env.AI_GATEWAY_API_KEY?.trim();
  if (gateway) {
    return {
      apiKey: gateway,
      baseUrl: "https://ai-gateway.vercel.sh/v1",
      chatModel:
        process.env.OPENAI_SEARCH_MODEL?.trim() || "openai/gpt-4o-mini",
      embeddingModel:
        process.env.OPENAI_EMBEDDING_MODEL?.trim() ||
        "openai/text-embedding-3-small",
      viaGateway: true,
    };
  }

  const openai = process.env.OPENAI_API_KEY?.trim();
  if (openai) {
    return {
      apiKey: openai,
      baseUrl: "https://api.openai.com/v1",
      chatModel: process.env.OPENAI_SEARCH_MODEL?.trim() || "gpt-4o-mini",
      embeddingModel:
        process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small",
      viaGateway: false,
    };
  }

  return null;
}

export function aiSearchEnabled(): boolean {
  return getAiProviderConfig() !== null;
}
