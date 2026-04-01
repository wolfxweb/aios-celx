import type { BaseEngine } from "./base-engine.js";

const engines = new Map<string, BaseEngine>();

export function registerEngine(engine: BaseEngine): void {
  engines.set(engine.id, engine);
}

export function getEngine(id: string): BaseEngine | undefined {
  return engines.get(id);
}

export function listRegisteredEngineIds(): string[] {
  return [...engines.keys()].sort();
}
