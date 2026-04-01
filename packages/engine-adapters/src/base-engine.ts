import type { EngineRunInput, EngineRunResult } from "@aios-celx/shared";

/** Contract for any LLM / IDE / mock engine implementation. */
export interface BaseEngine {
  readonly id: string;
  run(input: EngineRunInput): Promise<EngineRunResult>;
  isAvailable(): Promise<boolean>;
}
