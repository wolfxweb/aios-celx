import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readYaml } from "@aios-celx/artifact-manager";
import type { WorkflowDefinition } from "@aios-celx/shared";
import { WorkflowDefinitionSchema } from "@aios-celx/shared";

export async function loadWorkflow(filePath: string): Promise<WorkflowDefinition> {
  const raw = await readYaml<unknown>(filePath);
  return WorkflowDefinitionSchema.parse(raw);
}

export function defaultSoftwareDeliveryWorkflowPath(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "workflows", "default-software-delivery.yaml");
}

export async function loadDefaultSoftwareDeliveryWorkflow(): Promise<WorkflowDefinition> {
  return loadWorkflow(defaultSoftwareDeliveryWorkflowPath());
}
