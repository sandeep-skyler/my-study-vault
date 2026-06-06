# Study Manager

A personal study management web app for a single student — organize subjects, topics, notes, formulas, files, videos, calendar events, quick notes, todos, and bookmarks in one place.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (study-manager at `/`)
- API: Express 5 (api-server at `/api`)
- Auth: Clerk (`@clerk/react@^6.x`, `@clerk/express@^2.x`) — Google Sign-in
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — 11 schema files (subjects, topics, notes, formulas, folders, files, videos, calendar, quicknotes, todos, bookmarks)
- `lib/db/src/schema/index.ts` — re-exports all schemas
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/api.ts` — generated Zod schemas (do not edit)
- `artifacts/study-manager/src/` — React frontend (pages, components, hooks)
- `artifacts/api-server/src/routes/` — Express route handlers (one file per domain)
- `artifacts/api-server/src/middlewares/requireAuth.ts` — Clerk auth middleware

## Architecture decisions

- Single-user app: every table has `userId text not null`; all routes filter by Clerk `userId`
- File upload UX: no Google Drive auto-integration; frontend shows dialog to paste Drive shareable link; stored as JSON `{ driveFileId: "manual", driveShareableLink, ... }`
- Clerk v6 on frontend (`@clerk/react@^6.7.3`) + Clerk v2 on server (`@clerk/express@^2.x`); both require `@clerk/shared@^4.x` — workspace override forces this
- `@clerk/shared` pinned to `^4.15.0` in workspace overrides to resolve version conflict
- DB schema uses `timestamp(..., { withTimezone: true })` for instants, `date(..., { mode: "string" })` for calendar-only values

## Product

- **Dashboard**: stat cards, exam countdown, upcoming events, starred formulas, pending todos, recent quick notes
- **Subjects → Topics → Notes/Formulas/Files/Videos** hierarchy
- **Calendar**: monthly grid with event type badges (exam/reminder/deadline/event)
- **Quick Notes**: color-coded sticky notes
- **Todos**: subject-tagged task list with completion
- **Global Search**: debounced search across notes, formulas, files, videos
- **Bookmarks**: saved items with breadcrumb navigation
- **Auth**: Google Sign-in via Clerk, split-screen landing page

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm run typecheck:libs` before leaf artifact typechecks; stale lib declarations cause false import errors
- `@clerk/shared` must stay at `^4.x` (workspace override) — `@clerk/express@2` needs v4, `@clerk/react@6` needs v4
- Do not add `@clerk/shared` override removal without checking both packages still agree on version

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
