import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const fixturesDir = resolve(__dirname, "fixtures");
const fixtures = readdirSync(fixturesDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name)
  .sort();

/**
 * Returns the expected failure message for a fixture when it is intended to fail.
 */
function readExpectedError(fixturePath: string): string | null {
  const errorFile = join(fixturePath, "expect-error.txt");
  if (!existsSync(errorFile)) {
    return null;
  }

  return readFileSync(errorFile, "utf-8").trim();
}

/**
 * Removes the fixture output directory to ensure each run starts clean.
 */
function resetOutputDir(outDir: string): void {
  rmSync(outDir, { recursive: true, force: true });
}

describe("VDL Plugin: end-to-end tests", () => {
  beforeAll(() => {
    execSync("npm run build", {
      cwd: resolve(__dirname, ".."),
      stdio: "pipe",
    });
  });

  it.each(fixtures)("executes fixture: %s", (fixtureName) => {
    const fixturePath = join(fixturesDir, fixtureName);
    const outDir = join(fixturePath, "gen");
    const postTestPath = join(fixturePath, "main.ts");
    const expectedError = readExpectedError(fixturePath);

    resetOutputDir(outDir);

    if (expectedError) {
      expect(() =>
        execSync("npx vdl generate", { cwd: fixturePath, stdio: "pipe" }),
      ).toThrowError(expectedError);
      expect(existsSync(outDir)).toBe(false);
      return;
    }

    execSync("npx vdl generate", { cwd: fixturePath, stdio: "pipe" });

    const generatedFiles = readdirSync(outDir).sort();
    expect(generatedFiles.length).toBeGreaterThan(0);

    execSync("go build ./gen", { cwd: fixturePath, stdio: "pipe" });

    if (existsSync(postTestPath)) {
      execSync("node main.ts", { cwd: fixturePath, stdio: "inherit" });
    }
  });
});
