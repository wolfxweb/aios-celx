import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(root, "..");
const srcAgents = join(pkgRoot, "src", "agents");
const distAgents = join(pkgRoot, "dist", "agents");

function walk(dir, relBase = "") {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const rel = relBase ? `${relBase}/${name}` : name;
    if (statSync(p).isDirectory()) {
      walk(p, rel);
    } else if (name.endsWith(".md")) {
      const dest = join(distAgents, rel);
      mkdirSync(dirname(dest), { recursive: true });
      cpSync(p, dest);
    }
  }
}

walk(srcAgents);
console.log("copy-agent-md: synced prompt-template.md files to dist/agents/");
