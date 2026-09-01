import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Domain and store tests need no DOM and run faster without one; the few
    // component tests opt into a document with a `@vitest-environment` pragma.
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
  },
  // The app's tsconfig leaves JSX for Next to transform, so tell the
  // transformer to use the automatic runtime itself.
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
