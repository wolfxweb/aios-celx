import { buildApp } from "./app.js";
import { loadApiConfig } from "./config.js";
import { startAutoRunner } from "./services/auto-runner.js";

const cfg = loadApiConfig();
const app = await buildApp(cfg);

try {
  await app.listen({ port: cfg.port, host: cfg.host });
  app.log.info(`aios-celx API listening on http://${cfg.host}:${cfg.port}`);
  const autoRunnerEnabled = (process.env.AIOS_AUTO_RUNNER_ENABLED ?? "true").toLowerCase() !== "false";
  if (autoRunnerEnabled) {
    startAutoRunner(cfg, {
      logger: {
        info: (message) => app.log.info(message),
        warn: (message) => app.log.warn(message),
        error: (message) => app.log.error(message),
      },
    });
    app.log.info("aios-celx auto-runner enabled");
  }
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
