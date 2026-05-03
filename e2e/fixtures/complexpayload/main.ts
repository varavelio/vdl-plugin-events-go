import { ok } from "node:assert";
import { readFileSync } from "node:fs";

const generated = readFileSync("gen/events.go", "utf-8");

ok(
  generated.includes("BuildSubject: buildComplexPayloadEventSubject,"),
  "missing catalog build subject reference",
);
ok(
  generated.includes(
    "func buildComplexPayloadEventSubject(tenantId string) string {",
  ),
  "missing subject builder",
);
ok(
  generated.includes('return "audit." + tenantId + ".payload.created"'),
  "missing subject builder body",
);
ok(
  !generated.includes("type ComplexPayloadEvent struct {"),
  "event payload structs must not be generated",
);
