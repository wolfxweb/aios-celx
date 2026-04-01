import {
  ClaudeCodeEnginePlaceholder,
  CodexEnginePlaceholder,
  CursorEnginePlaceholder,
  createMockEngine,
  registerEngine,
} from "@aios-celx/engine-adapters";
import { runAgentCore } from "./run-agent-core.js";

registerEngine(createMockEngine(runAgentCore));
registerEngine(new ClaudeCodeEnginePlaceholder());
registerEngine(new CodexEnginePlaceholder());
registerEngine(new CursorEnginePlaceholder());
