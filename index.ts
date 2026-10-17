import { generateText } from "ai";

async function main() {
  const { text } = await generateText({
    // Free-tier friendly. After topping up AI Gateway credits you can use
    // "moonshotai/kimi-k3" (currently restricted on free tier).
    model: "openai/gpt-4o-mini",
    prompt: "Invent a new holiday and describe its traditions.",
  });

  console.log(text);
}

main().catch((error) => {
  console.error("AI Gateway example failed:", error);
  process.exit(1);
});
