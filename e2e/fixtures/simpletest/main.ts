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
  generated.includes("BuildSubject: buildUserCreatedEventSubject,"),
  "missing catalog build subject reference",
);
ok(
  generated.includes(
    "func buildUserCreatedEventSubject(userId string) string {",
  ),
  "missing subject builder",
);
ok(
  generated.includes("// Name is the name of this event."),
  "missing name field comment",
);
ok(
  generated.includes(
    "// SubjectTemplate is the subject template for this event.",
  ),
  "missing subject template field comment",
);
ok(
  generated.includes("// BuildSubject builds the subject for this event."),
  "missing builder field comment",
);
ok(
  generated.includes('SubjectTemplate: "auth.user_created.{userId}",'),
  "missing event catalog subject template",
);
ok(
  !generated.includes("type IgnoredType struct {"),
  "unannotated types must be ignored",
);
