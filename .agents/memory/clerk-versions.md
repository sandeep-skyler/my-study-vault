---
name: Clerk version compatibility
description: @clerk/react v6 and @clerk/express v2 both require @clerk/shared@4; must pin via workspace override
---

## Rule
Use `@clerk/react@^6.x` (not v5) on the frontend and `@clerk/express@^2.x` on the server. Both require `@clerk/shared@^4.x`.

**Why:** @clerk/react@5 needs @clerk/shared@3, but @clerk/express@2 needs @clerk/shared@4. Using react@5 causes esbuild errors about missing exports (loadClerkUiScript, SessionContext, etc.). Upgrading to react@6 resolves the conflict since both packages then agree on @clerk/shared@4.

**How to apply:** Add to `pnpm-workspace.yaml` overrides:
```yaml
"@clerk/shared": "^4.15.0"
```
Never remove this override without verifying both @clerk/react and @clerk/express still agree on the same major version of @clerk/shared.
