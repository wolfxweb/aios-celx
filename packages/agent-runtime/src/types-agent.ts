import type { AgentExecutionContext } from "./context.js";
import type { AgentResult } from "@aios-celx/shared";

export type AgentHandler = (ctx: AgentExecutionContext) => Promise<AgentResult>;
