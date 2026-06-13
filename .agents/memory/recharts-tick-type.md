---
name: Recharts tick prop typing
description: How to type recharts axis tick style to avoid TS2769 overload error
---

## Rule
Pass recharts `tick` prop values typed as `any`, not `React.CSSProperties`.

```tsx
// WRONG — causes TS2769 "No overload matches this call"
const TICK_STYLE: React.CSSProperties = { fontSize: 10, fill: "#aaa" };
<XAxis tick={TICK_STYLE} />

// RIGHT
const TICK_STYLE: any = { fontSize: 10, fill: "#aaa" };
<XAxis tick={TICK_STYLE} />
```

**Why:** Recharts `tick` prop is typed as `boolean | SVGProps<SVGTextElement> | ReactElement | ...`. `React.CSSProperties` includes CSS-domain types (e.g. `AlignmentBaseline` as `"-moz-initial"`) that are incompatible with the narrower SVG-domain equivalent. TypeScript's union overload resolution fails on the mismatch. Casting to `any` bypasses this safely since recharts itself handles the style object at runtime.

**How to apply:** Any time you define a reusable recharts axis/label tick style object, skip the `React.CSSProperties` type annotation and use `as any` or no annotation.
