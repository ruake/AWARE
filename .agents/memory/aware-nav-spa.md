---
name: AWARE navTo SPA navigation fix
description: navTo() uses History API + popstate dispatch for SPA navigation — no full page reload.
---

# AWARE navTo() — SPA Navigation

## The Rule
`navTo(path)` in `lib/nav.ts` must use the History API + a synthetic popstate event, NOT `window.location.href`. wouter v3 listens for popstate events to update its router state.

```typescript
export function navTo(path: string) {
  const resolved = path.startsWith("/") ? path : `/${path}`;
  window.history.pushState(null, "", resolved);
  window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
}
```

**Why:** `window.location.href = path` causes a full browser page reload, destroying all React state, context, cached data, and in-progress operations. This defeats the purpose of a SPA.

**How to apply:**
- `navTo()` is only needed for places that can't use wouter's `useLocation` hook (e.g., class components like `ErrorBoundary`, or utility callbacks passed outside React).
- For all React components, prefer `const [, navigate] = useLocation()` from wouter.
- `navTo()` is re-exported from `lib/data.ts` for convenience — both import paths work.
