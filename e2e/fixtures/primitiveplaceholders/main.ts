import { ok } from "node:assert";
import { readFileSync } from "node:fs";

const generated = readFileSync("gen/events.go", "utf-8");

ok(generated.includes('"fmt"'), "expected fmt import");
ok(generated.includes('"time"'), "expected time import");
ok(
  generated.includes(
    "func BuildPrimitiveSubjectEventSubject(name string, count int64, amount float64, active bool, occurredAt time.Time) string {",
  ),
  "missing primitive placeholder builder",
);
ok(
  generated.includes("occurredAt.Format(time.RFC3339Nano)"),
  "datetime placeholder should format with RFC3339Nano",
);
