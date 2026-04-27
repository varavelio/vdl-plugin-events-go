import { ok } from "node:assert";
import { readFileSync } from "node:fs";

const generated = readFileSync("gen/events.go", "utf-8");

ok(
  generated.includes("func BuildSystemReadyEventSubject() string {"),
  "expected zero-argument builder for static subjects",
);
ok(
  generated.includes('return "system.ready"'),
  "expected static subject literal",
);
ok(!generated.includes('"fmt"'), "static subject should not import fmt");
ok(
  !generated.includes('"time"'),
  "payload without datetime should not import time",
);
