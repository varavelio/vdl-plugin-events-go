import { ok } from "node:assert";
import { existsSync, readFileSync } from "node:fs";

ok(existsSync("gen/events.go"), "expected default events.go output file");

const generated = readFileSync("gen/events.go", "utf-8");

ok(generated.includes("package gen"), "missing package declaration");
ok(
  !generated.includes("type UserCreatedEvent struct {"),
  "event payload structs must not be generated",
);
ok(
  generated.includes(
    "func BuildUserCreatedEventSubject(userId string) string {",
  ),
  "missing subject builder",
);
ok(
  generated.includes(
    "// BuildUserCreatedEventSubject builds the routing subject for this event.",
  ),
  "missing builder comment",
);
ok(generated.includes("// Name:"), "missing event name label");
ok(generated.includes("// Subject:"), "missing event subject label");
ok(
  generated.includes("//\tauth.user_created.{userId}"),
  "missing event subject block",
);
ok(
  generated.includes('Subject: "auth.user_created.{userId}",'),
  "missing event catalog subject",
);
ok(
  !generated.includes("type IgnoredType struct {"),
  "unannotated types must be ignored",
);
