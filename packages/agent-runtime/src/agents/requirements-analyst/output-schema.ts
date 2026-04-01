/** Caminhos relativos ao projeto geridos por este agente (mock-engine). */
export const OUTPUT_PATHS = ["docs/discovery.md"] as const;

/** Secções esperadas no Markdown gerado (referência para validação futura / LLM). */
export const REQUIRED_MARKDOWN_SECTIONS = [
  "Mandate",
  "Problem statement",
  "Goals & users",
  "Scope (initial)",
  "Business rules (draft)",
  "Risks",
  "Open questions",
] as const;
