@AGENTS.md

# Finance App — Project Rules

## Stack
- Next.js 16 (App Router, TypeScript) — **no Pages Router**
- Tailwind CSS v4 — CSS-based config (`@import "tailwindcss"` in globals.css), NO tailwind.config.js
- Supabase (Auth + PostgreSQL + RLS) via `@supabase/ssr`
- React 19 — use `use client` directive only when needed (forms, hooks, interactivity)

## Architecture
- **MVVM**: every feature has a `useXxxViewModel` hook in `viewModels/`. All logic lives there, components are pure UI.
- **Return interface**: every ViewModel exports a typed `interface XxxViewModelReturn` for its return value.
- **Constants**: all magic strings/values go in `constants/` — one file per feature (e.g. `expenses.constants.ts`).
- **Types**: shared types in `types/` — one file per domain (e.g. `expense.types.ts`).
- **General components**: reusable primitives in `components/ui/` (Button, Input, Card, etc.).
- **File size limit**: ~150 lines max. Split by responsibility if longer.

## Naming Conventions
- Variables / functions: `camelCase`
- Components / types / interfaces: `PascalCase`
- Files: `kebab-case` (e.g. `expense-form.tsx`, `use-expenses-view-model.ts`)
- Constants: `SCREAMING_SNAKE_CASE` inside the files
- ViewModel files: `useXxxViewModel.ts`

## Commits
- Conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`
- One commit per completed functionality
- Feature branches named `feat/<feature-name>` → PR → merge to main

## Tailwind v4 Dark Mode
- Dark mode uses variant approach in CSS: `@custom-variant dark (&:where(.dark, .dark *));`
- Toggle dark mode by adding/removing `dark` class on `<html>` element.

## Supabase
- 3 separate clients: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server), `lib/supabase/middleware.ts`
- RLS enforced on all tables — never bypass with service role on client

## Key Learnings
- Next.js 16 uses `@tailwindcss/postcss` plugin (not `tailwindcss` directly in postcss)
- Tailwind v4 has no `tailwind.config.js` — all config done via CSS `@theme` and `@custom-variant`
- `create-next-app` with `--no-src-dir` places `app/`, `components/`, etc. at root level
- Zod v4: `z.number({ invalid_type_error: "..." })` is removed — use `z.number()` with no options; use `z.coerce.number()` only when input comes as string (but breaks react-hook-form types)
- Supabase v2.100+: Database type needs `Relationships: []` in each table + `Views`, `Enums`, `CompositeTypes` fields
- Supabase join type inference: when doing `.select("*, relation(fields)")`, the returned type doesn't match automatically. Use `as unknown as YourType[]` cast
- react-hook-form + zodResolver: type the `SubmitHandler<T>` explicitly when TS can't infer the handler correctly
- Route groups like `(auth)` and `(dashboard)` do NOT add path segments — `app/(auth)/callback/route.ts` responds to `/callback`, not `/auth/callback`
- Never have both `app/page.tsx` and `app/(group)/page.tsx` for the same `/` route — causes infinite redirect loop
- Supabase middleware: check exact paths for login/register redirects separately from the callback route to avoid redirect loops
- Recharts v3 Tooltip `formatter`: value is `ValueType | undefined`, not `number` — use `Number(value ?? 0)` to cast safely
- Recharts requires `"use client"` — all chart components must be client components
- For DB-computed shapes (RPC results), define a dedicated type matching the exact column names returned instead of extending table row types
- Next.js 16 uses Turbopack by default for BOTH `next dev` AND `next build` — Turbopack does NOT support `@tailwindcss/postcss` or webpack plugins like `@ducanh2912/next-pwa`. Always use `--webpack` flag on both commands (already set in package.json). Flag is `--webpack` not `--no-turbopack` (that flag doesn't exist in Next.js 16)
