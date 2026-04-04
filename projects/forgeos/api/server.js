import http from "node:http";
import { createResource, listResources } from "../src/domain/resource.js";

const port = Number.parseInt(process.env.PORT ?? "4175", 10);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  response.end(JSON.stringify(payload));
}

const server = http.createServer(async (request, response) => {
  if (!request.url || !request.method) {
    sendJson(response, 400, { error: "invalid_request" });
    return;
  }

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.url === "/health" && request.method === "GET") {
    sendJson(response, 200, { ok: true, service: "forgeos-api" });
    return;
  }

  if (request.url === "/resources" && request.method === "GET") {
    sendJson(response, 200, { items: listResources() });
    return;
  }

  if (request.url === "/resources" && request.method === "POST") {
    let body = "";
    request.on("data", (chunk) => {
      body += String(chunk);
    });
    request.on("end", () => {
      const payload = body ? JSON.parse(body) : {};
      sendJson(response, 201, { item: createResource(payload) });
    });
    return;
  }

  sendJson(response, 404, { error: "not_found" });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Forgeos API listening on http://127.0.0.1:${port}`);
});
