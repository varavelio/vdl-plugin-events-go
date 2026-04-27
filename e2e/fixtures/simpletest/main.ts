import { ok } from "node:assert";
import { readFileSync } from "node:fs";

// This file is only a tiny example of extra fixture checks.
// Keep files like this small and focused.

const helloTxtGot = readFileSync("gen/hello.txt", "utf-8");
const helloTxtExpected = "Hello from VDL Plugin";

ok(
  helloTxtGot === helloTxtExpected,
  `hello.txt content mismatch. Expected: "${helloTxtExpected}", got: "${helloTxtGot}"`,
);
