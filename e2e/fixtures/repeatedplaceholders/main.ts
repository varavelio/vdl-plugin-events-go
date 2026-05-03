import { ok } from "node:assert";
import { readFileSync } from "node:fs";

const generated = readFileSync("gen/events.go", "utf-8");

ok(
  generated.includes("BuildSubject: buildTenantAuditCreatedEventSubject,"),
  "missing catalog build subject reference",
);
ok(
  generated.includes(
    "func buildTenantAuditCreatedEventSubject(tenantId string) string {",
  ),
  "builder should deduplicate repeated placeholders in the signature",
);
ok(
  generated.includes(
    'return "audit." + tenantId + ".users." + tenantId + ".created"',
  ),
  "builder should reuse the same placeholder multiple times",
);
