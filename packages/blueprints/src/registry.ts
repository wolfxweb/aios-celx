import type { BlueprintDefinition } from "@aios-celx/shared";
import { saasWebappBlueprint } from "./saas-webapp.js";

/** Blueprint usado quando `project:create` não passa `--blueprint`. */
export const DEFAULT_BLUEPRINT_ID = saasWebappBlueprint.id;

const byId: Record<string, BlueprintDefinition> = {
  [saasWebappBlueprint.id]: saasWebappBlueprint,
};

export function getBlueprint(id: string): BlueprintDefinition | undefined {
  return byId[id];
}

export function listBlueprintIds(): string[] {
  return Object.keys(byId);
}
