import {
  ClaudeCodeEngine,
  CodexCliEngine,
  CursorEnginePlaceholder,
  createMockEngine,
  registerEngine,
} from "@aios-celx/engine-adapters";
import { runAgentCore } from "./run-agent-core.js";

registerEngine(createMockEngine(runAgentCore));
registerEngine(new ClaudeCodeEngine());
registerEngine(new CodexCliEngine());
registerEngine(new CursorEnginePlaceholder());
