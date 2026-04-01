import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readYaml } from "@aios-celx/artifact-manager";
import type { ProjectConfig, WorkflowDefinition } from "@aios-celx/shared";
import { DEFAULT_WORKFLOW_ID, WorkflowDefinitionSchema } from "@aios-celx/shared";

const WORKFLOW_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

export function assertSafeBundledWorkflowId(workflowId: string): void {
  if (!WORKFLOW_ID_PATTERN.test(workflowId)) {
    throw new Error(`Invalid workflow id: ${workflowId}`);
  }
}

export function bundledWorkflowsDir(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "workflows");
}

export function bundledWorkflowPath(workflowId: string): string {
  assertSafeBundledWorkflowId(workflowId);
  return join(bundledWorkflowsDir(), `${workflowId}.yaml`);
}

export async function loadWorkflow(filePath: string): Promise<WorkflowDefinition> {
  const raw = await readYaml<unknown>(filePath);
  return WorkflowDefinitionSchema.parse(raw);
}

export function defaultSoftwareDeliveryWorkflowPath(): string {
  return bundledWorkflowPath(DEFAULT_WORKFLOW_ID);
}

/** Load a workflow YAML shipped in this package (`workflows/<id>.yaml`). */
export async function loadBundledWorkflow(workflowId: string): Promise<WorkflowDefinition> {
  return loadWorkflow(bundledWorkflowPath(workflowId));
}

/** Resolves bundled workflow from project config (`workflow` optional in type; defaults like `normalizeProjectConfig`). */
export async function loadWorkflowForConfig(config: ProjectConfig): Promise<WorkflowDefinition> {
  const id = config.workflow ?? DEFAULT_WORKFLOW_ID;
  return loadBundledWorkflow(id);
}

export async function loadDefaultSoftwareDeliveryWorkflow(): Promise<WorkflowDefinition> {
  return loadBundledWorkflow(DEFAULT_WORKFLOW_ID);
}
