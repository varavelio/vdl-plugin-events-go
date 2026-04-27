import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// This e2e suite is only a example.
// Keep this fixture-per-folder shape when you add real e2e tests.

// Each fixture folder is one example project inside `fixtures/`.
const fixturesDir = resolve(__dirname, "fixtures");
const fixtures = readdirSync(fixturesDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

describe("VDL Plugin: end-to-end tests", () => {
  it.each(fixtures)("compiles fixture: %s", (fixtureName) => {
    const fixturePath = join(fixturesDir, fixtureName);
    const outDir = join(fixturePath, "gen");
    const postTestPath = join(fixturePath, "main.ts");

    // Run VDL here, like a user would run it.
    execSync("npx vdl generate", { cwd: fixturePath, stdio: "pipe" });

    // Read generated files in a stable order.
    const generatedFiles = readdirSync(outDir).sort();
    expect(generatedFiles.length).toBeGreaterThan(0);

    // Snapshot checks are optional, but this is a good pattern to keep.
    for (const file of generatedFiles) {
      const content = readFileSync(join(outDir, file), "utf-8");
      expect(content).toMatchSnapshot(file);
    }

    // Put small extra checks in `main.ts` when a fixture needs them.
    // If you need to check something in other languages, you can
    // tweak the dev container and add the command to run the test
    // here.
    if (existsSync(postTestPath)) {
      execSync("node main.ts", { cwd: fixturePath, stdio: "inherit" });
    }
  });
});
