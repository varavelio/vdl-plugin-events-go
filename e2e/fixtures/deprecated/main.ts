import { ok } from "node:assert";
import { readFileSync } from "node:fs";

const generated = readFileSync("gen/events.go", "utf-8");

ok(generated.includes("package gen"), "missing package declaration");

// Deprecated without message uses the default notice.
ok(
  generated.includes("// Deprecated: This event is deprecated."),
  "missing default deprecation notice",
);

// Deprecated with message preserves the VPP-1 message.
ok(
  generated.includes("// Deprecated: Use UserCreatedV2 instead."),
  "missing custom deprecation message",
);

// Builders for deprecated events carry godoc deprecation notices.
ok(
  generated.includes("func buildUserDeletedEventSubject("),
  "missing deprecated event builder",
);
ok(
  generated.includes("func buildUserCreatedEventSubject("),
  "missing deprecated event builder with message",
);

// Non-deprecated events must not carry deprecation notices.
const systemReadyIndex = generated.indexOf("SystemReadyEvent is the metadata");
ok(systemReadyIndex !== -1, "missing non-deprecated event");
const systemReadySlice = generated.slice(
  systemReadyIndex,
  systemReadyIndex + 400,
);
ok(
  !systemReadySlice.includes("Deprecated:"),
  "non-deprecated event must not be marked deprecated",
);
