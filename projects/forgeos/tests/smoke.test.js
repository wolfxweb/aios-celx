import assert from "node:assert/strict";
import { createResource, listResources } from "../src/domain/resource.js";

const resources = listResources();
assert.ok(Array.isArray(resources), "listResources should return an array");
assert.ok(resources.length >= 1, "listResources should expose seed resources");

const created = createResource({ id: "prompt-system", name: "Prompt System", status: "active" });
assert.equal(created.id, "prompt-system");
assert.equal(created.name, "Prompt System");
assert.equal(created.status, "active");

console.log("forgeos smoke tests passed");
