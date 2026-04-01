import { buildApp } from "./app.js";
import { loadApiConfig } from "./config.js";

const cfg = loadApiConfig();
const app = await buildApp(cfg);

try {
  await app.listen({ port: cfg.port, host: cfg.host });
  app.log.info(`aios-celx API listening on http://${cfg.host}:${cfg.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
