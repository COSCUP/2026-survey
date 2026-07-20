import type { BarDatum } from "./dashboard-data";

const openModelAiHints = [
  "open-source", "open source", "open-weight", "open weight", "open model", "開源模型", "開放權重", "開放模型",
  "locally hosted", "self-hosted", "本機或自行架設", "llama", "qwen", "deepseek", "mistral", "gemma", "olmo", "falcon", "bloom", "yi ", "glm",
  "taide", "twinkleai", "twinkle ai",
];

export function openModelAi(items: BarDatum[]) {
  return items.filter((item) => {
    const searchable = `${item.label} ${item.detail || ""}`.toLowerCase();
    return openModelAiHints.some((hint) => searchable.includes(hint));
  });
}
