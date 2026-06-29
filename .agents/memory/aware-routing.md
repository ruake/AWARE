---
name: AWARE app routing pattern
description: How to avoid nested anchor warnings and navigate correctly in the AWARE wouter app.
---

## Rule
In the AWARE app (wouter v3), `<Link>` renders as `<a>`. Never do `<Link href="..."><a ...>...</a></Link>` — it creates nested `<a>` tags and triggers React hydration warnings.

## How to apply

**For styled links (buttons that navigate):** Use `navigate()` from `useLocation`:
```tsx
const [, navigate] = useLocation();
<button onClick={() => navigate("/path")} className="gcp-button">Go</button>
```

**For inline text links:** Pass style/className directly to `Link`:
```tsx
<Link href="/path" style={{ color: "var(--gcp-blue)", textDecoration: "none" }}>
  Label
</Link>
```

**For `<a>` tags to external URLs:** Use plain `<a href="..." target="_blank">` — not Link.

**Why:** wouter's Link renders as `<a>`. Wrapping it in another `<a>` causes HTML validation errors and React hydration mismatches, producing console warnings on every render.
