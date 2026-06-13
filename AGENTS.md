# AGENTS

## Commands
- `npm run build-local` — production build (starts temp Postgres, migrates, builds, shuts down)
- `npm run lint` — oxlint via ultracite (`--type-aware --type-check`)
- `npm run lint:fix` — auto-fix lint issues
- `npm run check:types` — `tsc --noEmit --pretty`
- `npm run check:deps` — knip unused deps/files
- `npm run check:i18n` — missing translation detection
- `npm run test` — vitest run (unit + browser)
- `npm run test:e2e` — Playwright tests
- `npm run dev` — Next.js dev server on port 3000
- CI lint order: `npx next typegen && npm run lint`

## Pre-commit
Lefthook runs on every commit:
- `ultracite fix --type-aware --type-check` — auto-fixes and re-stages
- `knip` — must pass; no unused deps/files

## Toolchain
- Linter: **oxlint** via ultracite (no ESLint). Config: `oxlint.config.ts`
- Formatter: **oxfmt** (no Prettier). Config: `oxfmt.config.ts`
- TypeScript: `tsc --noEmit` (no emit; Next.js handles compilation)
- Node.js >= 24 required
- React Compiler: enabled only in production (`process.env.NODE_ENV === 'production'`)

## TypeScript
- `noUncheckedIndexedAccess: true` — array indexing returns `T | undefined`
- `noUnusedLocals` + `noUnusedParameters` both on; `allowUnreachableCode: false`
- `noImplicitOverride: true`
- `useUnknownInCatchVariables: true` — catch variables are `unknown`
- Zod type-only: `import type * as z from 'zod'`
- Path alias: `@/` → `./src/*`

## Architecture
- Next.js 16 App Router with Turbopack
- Middleware: `src/proxy.ts` (next-intl i18n routing, not `middleware.ts`)
- Root layout: `src/app/[locale]/layout.tsx`
- Locale prefix: `as-needed` — default locale (`en`) has no `/en` URL prefix
- Env: all vars validated in `src/libs/Env.ts`; never read `process.env` directly
- Logger: `src/libs/Logger.ts` (LogTape); export `logger` from there

## Styling
- Tailwind v4 with `@tailwindcss/postcss`. PostCSS config in `package.json`
- No unnecessary classes; reuse shared components; responsive

## React
- No `useMemo`/`useCallback` (React Compiler handles it). Avoid `useEffect`
- Single `props` param with inline type; access as `props.foo` (no destructuring)
- Use `React.ReactNode`, not `ReactNode`
- Inline short event handlers; extract only when complex

## Pages
- Default export name ends with `Page`. Props alias (if reused) ends with `PageProps`
- Locale pages: `props: { params: Promise<{ locale: string }> }` → `await props.params` → `setRequestLocale(locale)`
- Dashboard pages (behind auth): define meta once in layout, not in each page

## i18n (next-intl v4)
- **`useTranslations` (plural)**, not v3's `useTranslation`
- Never hard-code user-visible strings. Page namespaces end with `Page`
- Server: `getTranslations`; Client: `useTranslations`
- Context-specific keys (`card_title`, `meta_description`). Use `t.rich(...)` for markup
- Sentence case for translations. Error messages: short, no "try again" variants
- Config: `src/libs/I18n.ts`, routing: `src/libs/I18nRouting.ts`, navigation: `src/libs/I18nNavigation.ts`

## JSDoc
- Enforced by oxlint (`@param`, `@returns`, and their descriptions required)
- Start with `/**` directly above symbol. Short, sentence-case, present-tense intent
- Order: description → `@param` → `@returns` → `@throws` (only if it can throw)

## Tests
- `*.test.ts` for unit tests; `*.integ.ts` for integration tests; `*.e2e.ts` for Playwright
- `*.test.ts` co-located with implementation; `*.integ.ts` and `*.e2e.ts` in `tests/`
- **Vitest split**: `*.test.ts` (non-hooks, non-tsx) runs in **node**; `*.test.tsx` + `src/hooks/**/*.test.ts` runs in **browser** (Playwright Chromium)
- Top `describe` = subject; nested to group scenarios
- `it` titles: short, third-person present, `verb + object + context`. Sentence case, no period
- Omit "should/works/handles/checks/validates". State what, not how
- Avoid mocking unless necessary

## Git Commits
- Conventional Commits: `type: summary` without scope. Short, specific sentence
- Types: `feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert`
- `BREAKING CHANGE:` footer when needed
- `chore: bump` and `Updating` commits are ignored by commitlint (dependabot)
- Use `npm run commit` for interactive commit prompt

### Using Postman MCP tools
The Postman MCP (Model Context Protocol) tools provide programmatic access to the iDeal API collection. Use these to inspect endpoint schemas, request/response shapes, and auth requirements without needing the backend running.
**Fetch the full collection:**
Use the postman_getCollection tool with the collection ID to
retrieve all endpoints, folders, request bodies, and saved responses.
**Inspect a specific endpoint:**
Use postman_getCollectionRequest with the request's ID to get
the full request definition including URL, method, headers, body schema,
and saved example responses.
**For frontend development, use these tools to:**
- Check request body schemas when building forms
- Check response shapes when writing API client code or types
- Verify auth requirements (Bearer token via `{{TOKEN}}` variable)
- Find saved example responses (success/failure) for each endpoint
**Collection ID:** `47796254-67fe0405-7142-4fc5-8a5d-ccccd8807359`

## Backend Source
- Path: `/home/mehroj/PycharmProjects/iDeal-Backend`
- Refer to the backend codebase for API route definitions, request/response schemas, database models, and business logic that the frontend consumes
