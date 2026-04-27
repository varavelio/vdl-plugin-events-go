import { ok } from "node:assert";
import { readFileSync } from "node:fs";

const generated = readFileSync("gen/events.go", "utf-8");

ok(
  generated.includes('ActorId int64 `json:"actorId"`'),
  "missing named type field",
);
ok(generated.includes('Tags []string `json:"tags"`'), "missing array field");
ok(
  generated.includes('Attributes map[string]bool `json:"attributes"`'),
  "missing map field",
);
ok(
  generated.includes('Status string `json:"status"`'),
  "missing enum-backed field",
);
ok(generated.includes("Details struct {"), "missing inline object field");
