import { buildPortfolioExecutiveSummary, loadPortfolioDocument } from "@aios-celx/portfolio";

export async function getPortfolioDocument(monorepoRoot: string) {
  return loadPortfolioDocument(monorepoRoot);
}

export async function getPortfolioSummary(monorepoRoot: string, projectsRoot: string) {
  return buildPortfolioExecutiveSummary(monorepoRoot, projectsRoot);
}
