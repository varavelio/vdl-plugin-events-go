import { ok } from "node:assert";
import { existsSync, readFileSync } from "node:fs";

ok(existsSync("gen/billing-events.go"), "expected custom Go output file");
ok(!existsSync("gen/events.go"), "default output should not be emitted");

const generated = readFileSync("gen/billing-events.go", "utf-8");

ok(
  generated.includes("BuildSubject: buildInvoicePaidEventSubject,"),
  "missing catalog build subject reference",
);
ok(
  generated.includes(
    "func buildInvoicePaidEventSubject(invoiceId int64) string {",
  ),
  "missing invoice subject builder",
);
ok(
  generated.includes('return "billing.invoice_paid." + fmt.Sprint(invoiceId)'),
  "missing custom outFile subject body",
);
