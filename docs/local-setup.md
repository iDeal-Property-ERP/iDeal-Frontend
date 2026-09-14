# Local frontend setup

Use Node.js >=24 and npm. From the Frontend checkout:

```sh
npm ci --no-audit --no-fund
cp .env.example .env.local
npm run dev:next -- --hostname 127.0.0.1 --port 3000
```

Open `http://127.0.0.1:3000`. Start the existing seeded Backend separately as
ASGI at `http://127.0.0.1:8010`. No frontend database, migrations, or Clerk keys
are needed. `.env.local` is ignored by Git; never put credentials in public vars.

`next.config.ts` disables proxy URL normalization so Next preserves `127.0.0.1`
in next-intl rewrites. Without it, normalization to `localhost` can proxy back
into the same server and cause a self-redirect loop on `/`, `/login`, and
`/listings`. The public homepage should return 200; only protected dashboards
should redirect anonymous visitors to `/login`.

## API and login

- `BACKEND_ORIGIN` is the server-only origin for Next's `/api/v1` rewrite.
- `NEXT_PUBLIC_API_URL` is the absolute public marketplace URL, including
  `/api/v1` without a trailing slash. Backend CORS must allow the frontend origin.
- `NEXT_PUBLIC_CHAT_WS_URL` points directly to the local ASGI chat endpoint.
  Leave it empty or unset in deployments to preserve same-origin `/ws/v1/chat/`
  routing through an upgrade-capable reverse proxy. Only `ws://` and `wss://`
  URLs are accepted. Public values must be set before production builds.
- Use `127.0.0.1` consistently, not a mix with `localhost`: HTTP-only
  `ideal_access` and `ideal_refresh` cookies are shared across ports, not hosts.
  The backend must permit the frontend WebSocket origin and local HTTP cookies.
- Sign in at `/login` with an existing seeded username and password. Users with
  `must_change_password` are redirected to `/set-password`; do not bypass it.
- `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` is optional; maps show a fallback without it.

## Verification

Run these sequentially on memory-constrained machines:

```sh
PLAYWRIGHT_BROWSERS_PATH=0 npm run test -- --maxWorkers=1 --no-file-parallelism
npx next typegen
npm run check:types
npm run lint
CIRCLE_NODE_TOTAL=2 RAYON_NUM_THREADS=1 UV_THREADPOOL_SIZE=1 NODE_OPTIONS=--max-old-space-size=2048 npm run build
```

Vitest runs Node unit tests and headless Chromium UI tests. If Chromium is
missing, install it inside `node_modules` without system changes:

```sh
PLAYWRIGHT_BROWSERS_PATH=0 npx playwright install --only-shell chromium
```

Keep `PLAYWRIGHT_BROWSERS_PATH=0` on test commands to use that local installation.
E2E configuration exists, but this checkout has no E2E tests. In Next 16,
`CIRCLE_NODE_TOTAL=2` limits the default page workers to one; the other build
settings limit native threads and each Node process's heap, not total process
memory.

`build`, `build-local`, and `build:next` all run `next build` without database
setup. The root layout downloads a Google font during compilation, so builds
need network access. An unavailable backend can yield empty public listing
sections rather than a failed build; start the seeded backend before checking
data. Rebuild after the backend is available to populate prerendered homepage
listings, or use dev mode. Build success alone does not verify login, chat, or
seeded content.

Prefer development mode for local property photos: production intentionally
blocks optimization of private/loopback image URLs. Do not relax that production
SSRF protection just to test local media.

The manager dashboard's desktop overflow is resolved: the shared `SidebarInset`
uses `min-w-0` to fit beside the sidebar instead of imposing its content's
intrinsic width. The Properties preview scrolls locally at narrow desktop widths
instead of overlapping fixed columns. Manager, owner, and tenant dashboards
were browser-checked at 1440, 1280, 1024, 900, 768, and 390 px widths.

## Docker

Native development is the simplest local path. The Compose file builds a
production image, exposes port 3008, and requires an external network and `.env`.
Environment files are excluded from the Docker build context. Supply public
configuration and the backend rewrite origin explicitly at build time if using
Docker; runtime `env_file` does not configure browser bundles or built rewrites.
Container loopback is not the host backend. Docker build-time configuration is
not wired up by this local native setup.
