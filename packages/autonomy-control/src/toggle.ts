import { loadProjectConfig, saveProjectConfig } from "@aios-celx/project-manager";
import { mergeAutonomyPolicy } from "@aios-celx/shared";

export async function setAutonomyEnabled(
  projectsRoot: string,
  projectId: string,
  enabled: boolean,
): Promise<void> {
  const cfg = await loadProjectConfig(projectsRoot, projectId);
  const autonomy = mergeAutonomyPolicy(cfg.autonomy);
  await saveProjectConfig(projectsRoot, projectId, {
    ...cfg,
    autonomy: { ...autonomy, enabled },
  });
}
