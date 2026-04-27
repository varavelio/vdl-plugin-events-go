import { defineConfig } from "vitest/config";

const twoMinutes = 2 * 60 * 1000; // 2 minutes * 60 seconds * 1000 milliseconds

export default defineConfig({
  test: {
    include: [
      "src/**/*.test.ts",
      "src/**/*.spec.ts",
      "tests/**/*.test.ts",
      "e2e/**/*.test.ts",
    ],
    testTimeout: twoMinutes,
    hookTimeout: twoMinutes,
  },
});
