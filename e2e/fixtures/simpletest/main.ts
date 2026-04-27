import { ok } from "node:assert";
import { readFileSync } from "node:fs";

const generated = readFileSync("gen/events.gen.go", "utf-8");

ok(generated.includes("package gen"), "missing package declaration");
ok(
  generated.includes("type UserCreatedEvent struct {"),
  "missing event struct",
);
ok(
  generated.includes(
    "func BuildUserCreatedEventSubject(userId string) string {",
  ),
  "missing subject builder",
);
ok(
  generated.includes(
    "// BuildUserCreatedEventSubject builds the routing subject for UserCreatedEvent.",
  ),
  "missing builder comment",
);
ok(
  generated.includes('Subject: "auth.user_created.{userId}",'),
  "missing event catalog subject",
);
