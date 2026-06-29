import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "lib/api-zod",
  "lib/db",
  "artifacts/api-server",
  "artifacts/aware",
]);
