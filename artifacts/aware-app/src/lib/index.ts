// ── Ultimate fan-out barrel for @/lib ───────────────────────────────
// Re-exports every public symbol from all lib modules so consumers
// can import from a single entry point: `import { … } from "@/lib"` or `import { … } from "@/lib/data"`.

export * from "./data";
