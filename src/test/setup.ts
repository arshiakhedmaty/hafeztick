import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * Component tests mount into a real document; without this each test would
 * inherit the last one's DOM and pass or fail for the wrong reason.
 * Harmless in the node-environment tests, which never mount anything.
 */
afterEach(() => {
  if (typeof document !== "undefined") cleanup();
});
