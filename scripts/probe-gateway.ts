import { generateText } from "ai";

const model = process.argv[2] || "openai/gpt-4o-mini";

async function main() {
  const { text } = await generateText({
    model,
    prompt: "Invent a new holiday and describe its traditions in 2 short sentences.",
  });
  console.log("OK", model, "CHARS", text.length);
  console.log(text);
}

main().catch((error) => {
  const msg = error instanceof Error ? error.message : String(error);
  console.error("FAIL", model, msg.slice(0, 300));
  process.exit(1);
});
