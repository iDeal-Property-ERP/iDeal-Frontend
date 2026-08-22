# iDeal Frontend — Implementation Kickoff

Frontend repo: `/home/mehroj/WebstormProjects/iDeal-Frontend`
Backend repo: `/home/mehroj/PycharmProjects/iDeal-Backend`

## Tech Stack

- **Next.js 16** (App Router, React 19, Turbopack)
- **TypeScript** strict (`noUncheckedIndexedAccess`, `noUnusedLocals`, etc.)
- **oxlint** + **oxfmt** (no ESLint/Prettier)
- **Tailwind CSS v4** (with `@tailwindcss/postcss`)
- **react-hook-form** v7 + **Zod** v4 for form validation
- **next-intl** v4 for i18n (locale prefix: `as-needed`)
- **Vitest** (unit + browser) + **Playwright** (e2e) + **Storybook** (components)
- React Compiler enabled in production

## Architecture Overview

```
src/
├── app/[locale]/          # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, register, forgot password)
│   ├── (dashboard)/       # Role-based dashboards
│   │   ├── management/    # Management panel
│   │   ├── owner/         # Property owner panel
│   │   └── tenant/        # Tenant panel
│   ├── (marketplace)/     # Public marketplace (browse, search, listing detail)
│   └── (legal)/           # Privacy, Terms, etc.
├── components/            # Shared UI components
├── libs/                  # Core libraries (env, logger, i18n, api client)
├── types/                 # TypeScript types matching backend Pydantic schemas
└── utils/                 # Utility functions
```

## API Integration

### Base URL

```
http://localhost:8000/api/v1/
```

### Auth

All endpoints (except public ones) use JWT Bearer token:

```
Authorization: Bearer <access_token>
```

- Obtain tokens: `POST /api/v1/auth/login/` (email + password)
- Refresh: `POST /api/v1/auth/refresh/` (refresh token)
- Verify: `POST /api/v1/auth/verify/` (any token)

**Token lifecycle**: access token is short-lived, refresh token is long-lived. Implement automatic refresh in the API client middleware.

### Response Envelope

Every response follows this format:

```json
// Success
{"success": true, "message": "OK", "data": <payload>}

// Failure
{"success": false, "message": "...", "error": "..."}
```

### API Client

Build a typed API client in `src/libs/api.ts`:

```typescript
// Pattern:
// - Base fetch wrapper that adds JWT header, handles refresh, parses envelope
// - Typed functions per endpoint group
// - Zod schemas for request/response validation (mirror backend Pydantic schemas)

import type * as z from 'zod';

async function apiFetch<T>(
  path: string,
  options?: RequestInit & { query?: Record<string, string | number | undefined> }
): Promise<T> {
  // 1. Build URL with query params
  // 2. Add Authorization header from stored token
  // 3. Fetch
  // 4. On 401: try refresh, retry once
  // 5. Parse envelope: check `success`, extract `data`
  // 6. Return typed `data`
}
```

### Endpoint Inventory

See below for the complete endpoint map grouped by feature area.

## Implementation Order

### Phase 1 — Foundation (shared infrastructure)

1. **API client** (`src/libs/api.ts`) — fetch wrapper with JWT auth, token refresh, envelope parsing, error handling
2. **Auth types** (`src/types/`) — TypeScript types for all backend Pydantic schemas (start with auth: `LoginPayload`, `TokenResponse`)
3. **Auth store** — JWT token storage (cookie or in-memory), user state, role
4. **Route protection** — middleware/layout that redirects unauthenticated users

### Phase 2 — Core UI

1. **Layout shell** — sidebar navigation, header with user menu, responsive
2. **Auth pages** — `/login`, `/register` (if self-registration), `/forgot-password`
3. **Dashboard home pages** — one per role (management/owner/tenant), basic stats cards
4. **Public marketplace** — `/listings` (browse), `/listings/[id]` (detail), map view

### Phase 3 — Domain Pages (role-based)

**Management** (highest priority — manages everything):
| Page | Endpoint | Description |
|------|----------|-------------|
| Dashboard | `GET /api/v1/management/dashboard/` | KPI cards (users, properties, revenue, etc.) |
| Users list | `GET /api/v1/management/users/` | Table with role/status filters |
| User edit | `PATCH /api/v1/management/users/:id/` | Activate/deactivate, change role |
| Properties list | `GET /api/v1/management/properties/` | Filterable table |
| Leases list | `GET /api/v1/management/leases/` | Active lease management |
| Agreements list | `GET /api/v1/management/owner-agreements/` | Owner contract management |
| Payments list | `GET /api/v1/management/payments/` | Payment tracking |
| Payouts list | `GET /api/v1/management/payouts/` | Payout tracking |
| Service requests | `GET /api/v1/management/service-requests/` | Maintenance overview |

**Property management** (shared across roles):
| Page | Endpoint | Description |
|------|----------|-------------|
| Properties CRUD | `GET/POST /api/v1/properties/` | List + create |
| Property detail | `GET /api/v1/properties/:id/` | View |
| Property edit | `PATCH /api/v1/properties/:id/` | Update |
| Property delete | `DELETE /api/v1/properties/:id/` | Soft-delete |

**Owner panel**:
| Page | Endpoint | Description |
|------|----------|-------------|
| My properties | `GET /api/v1/owner/properties/` | Owner's property list |
| Earnings | `GET /api/v1/owner/earnings/` | Income summary |
| Why iDeal | `GET /api/v1/owner/why/` | Static info page |

**Tenant panel**:
| Page | Endpoint | Description |
|------|----------|-------------|
| Home | `GET /api/v1/tenant/home/` | Active lease + next payment |
| Payments | `GET /api/v1/tenant/payments/` | Payment history |
| Service requests | `GET/POST /api/v1/tenant/service-requests/` | Create/view maintenance requests |

**Finance**:
| Page | Endpoint | Description |
|------|----------|-------------|
| Payments CRUD | `GET/POST /api/v1/finance/payments/` | Record/list payments |
| Edit payment | `PATCH /api/v1/finance/payments/:id/` | Update payment details |
| Mark paid | `POST /api/v1/finance/payments/:id/mark-paid/` | One-click payment status |
| Payouts | `GET /api/v1/finance/payouts/` | View payout schedule |
| Exchange rates | `GET/POST /api/v1/finance/exchange-rates/` | Currency management |
| Dashboard | `GET /api/v1/finance/dashboard/` | Financial KPIs |
| P&L | `GET /api/v1/finance/pnl/` | Profit & loss with date filters |

**Contracts**:
| Page | Endpoint | Description |
|------|----------|-------------|
| Agreements CRUD | `GET/POST /api/v1/contracts/owner-agreements/` | Owner agreements |
| Leases CRUD | `GET/POST /api/v1/contracts/leases/` | Tenancy leases |
| Lease detail | `GET /api/v1/contracts/leases/:id/` | Single lease view |
| Renew lease | `POST /api/v1/contracts/leases/:id/renew/` | Renew with new terms |

**Maintenance**:
| Page | Endpoint | Description |
|------|----------|-------------|
| Requests list | `GET/POST /api/v1/maintenance/requests/` | Service request list + create |
| Request detail | `GET /api/v1/maintenance/requests/:id/` | View |
| Update request | `PATCH /api/v1/maintenance/requests/:id/` | Edit title/description/priority |
| Assign staff | `POST /api/v1/maintenance/requests/:id/assign/` | Assign → in_progress |
| Resolve | `POST /api/v1/maintenance/requests/:id/resolve/` | Add cost + notes → resolved |

**Agents**:
| Page | Endpoint | Description |
|------|----------|-------------|
| Agents list | `GET /api/v1/agents/` | Agent directory + is_active filter |
| Agent detail | `GET /api/v1/agents/:id/` | Agent profile + stats |
| Agent deals | `GET/POST /api/v1/agents/:id/deals/` | Deals per agent, create new deal |

### Phase 4 — Polish

1. **i18n** — All user-visible strings via `next-intl` (namespace per page)
2. **Form validation** — Zod schemas in sync with backend Pydantic models
3. **Error handling** — Toast notifications for API errors, form-level validation errors
4. **Loading states** — Skeletons for lists, spinners for buttons
5. **Empty states** — Helpful placeholders when no data
6. **Responsive** — Mobile-first where applicable (management panel may stay desktop)

## Schema Reference (Bruno)

The Git-tracked Bruno collection at `Backend/docs/api/bruno` in the Backend
repository (local path: `/home/mehroj/PycharmProjects/iDeal-Backend/docs/api/bruno`) contains executable
requests and saved response examples for the backend API. Use it as a
frontend-oriented fixture and handoff reference, while treating the backend
URL resolver, view annotations, Pydantic schemas, tests, and response handling
as the authoritative contract.

- Check the request's path/query fields, body, auth mode, and `docs` notes.
- Use success, empty, validation, permission, not-found, conflict, and provider
  examples where applicable when writing client types and error handling.
- Switch `Local`, `Dev`, or `Prod` environments instead of editing request URLs.
  Never commit tokens, credentials, webhook secrets, or local fixture paths.
- After backend contract changes, run the collection's static validator and
  update affected frontend Zod schemas, API clients, and tests. Runtime Bruno
  checks are separate from static checks and require the relevant service and
  fixtures.

## Key Design Decisions

- **No `useEffect` for data fetching** — use Server Components where possible, or React Query/TanStack for client-side
- **No `useMemo`/`useCallback`** — React Compiler handles memoization
- **Co-located tests** — `*.test.ts` next to the implementation file
- **Type-safe API calls** — Zod schemas validate both request and response at runtime
- **Role-based routing** — `/management/*`, `/owner/*`, `/tenant/*` each wrapped in role-check layouts
- **Public routes** — Marketplace is fully public; auth pages are public

## Complete Endpoint Reference

### Public (no auth)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/login/` | Login (get tokens) |
| POST | `/api/v1/auth/refresh/` | Refresh access token |
| POST | `/api/v1/auth/verify/` | Verify token validity |
| GET | `/api/v1/misc/health/` | Health check |
| GET | `/api/v1/misc/test/` | Test endpoint |
| GET | `/api/v1/marketplace/listings/` | Browse listings (filters: district, price, rooms, area) |
| GET | `/api/v1/marketplace/listings/map/` | Listings as GeoJSON |
| GET | `/api/v1/marketplace/listings/:id/` | Listing detail |
| POST | `/api/v1/marketplace/listings/:id/book-viewing/` | Book a viewing (name, phone, email, date) |

### Property (JWT)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/properties/` | List all properties (paginated) |
| POST | `/api/v1/properties/` | Create property |
| GET | `/api/v1/properties/:id/` | Get property detail |
| PATCH | `/api/v1/properties/:id/` | Update property |
| DELETE | `/api/v1/properties/:id/` | Delete property (soft) |

### Contract (JWT)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/contracts/owner-agreements/` | List agreements |
| POST | `/api/v1/contracts/owner-agreements/` | Create agreement |
| GET | `/api/v1/contracts/leases/` | List leases |
| POST | `/api/v1/contracts/leases/` | Create lease |
| GET | `/api/v1/contracts/leases/:id/` | Lease detail |
| POST | `/api/v1/contracts/leases/:id/renew/` | Renew lease |

### Finance (JWT)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/finance/payments/` | List payments |
| POST | `/api/v1/finance/payments/` | Create payment |
| PATCH | `/api/v1/finance/payments/:id/` | Update payment |
| POST | `/api/v1/finance/payments/:id/mark-paid/` | Mark as paid |
| GET | `/api/v1/finance/payouts/` | List payout schedules |
| GET | `/api/v1/finance/exchange-rates/` | List exchange rates |
| POST | `/api/v1/finance/exchange-rates/` | Create exchange rate |
| GET | `/api/v1/finance/dashboard/` | Finance dashboard |
| GET | `/api/v1/finance/pnl/` | P&L report (?year, ?month) |

### Maintenance (JWT)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/maintenance/requests/` | List service requests (?status, ?property_id) |
| POST | `/api/v1/maintenance/requests/` | Create service request |
| GET | `/api/v1/maintenance/requests/:id/` | Request detail |
| PATCH | `/api/v1/maintenance/requests/:id/` | Update request fields |
| POST | `/api/v1/maintenance/requests/:id/assign/` | Assign staff → in_progress |
| POST | `/api/v1/maintenance/requests/:id/resolve/` | Add cost + notes → resolved |

### Agent (JWT)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/agents/` | List agents (?is_active) |
| GET | `/api/v1/agents/:id/` | Agent detail + stats |
| GET | `/api/v1/agents/:id/deals/` | Agent's deals |
| POST | `/api/v1/agents/:id/deals/` | Create deal (auto-calculates commission) |

### Owner (JWT + OWNER role)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/owner/properties/` | My properties |
| GET | `/api/v1/owner/earnings/` | Earnings summary |
| GET | `/api/v1/owner/why/` | Why iDeal page |

### Tenant (JWT + TENANT role)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/tenant/home/` | Active lease info + next payment |
| GET | `/api/v1/tenant/payments/` | Payment history |
| POST | `/api/v1/tenant/payments/` | Online payment (placeholder) |
| GET | `/api/v1/tenant/service-requests/` | My service requests |
| POST | `/api/v1/tenant/service-requests/` | Create service request |

### Management (JWT + MANAGEMENT role)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/management/dashboard/` | System KPIs |
| GET | `/api/v1/management/users/` | User list (?role, ?is_active, ?is_verified, ?search) |
| PATCH | `/api/v1/management/users/:id/` | Update user (is_active, is_verified, role) |
| GET | `/api/v1/management/properties/` | Property list (?status, ?district_id, ?tariff, ?search) |
| GET | `/api/v1/management/leases/` | Lease list (?status, ?property_id, ?tenant_id) |
| GET | `/api/v1/management/owner-agreements/` | Agreement list (?status, ?owner_id, ?property_id) |
| GET | `/api/v1/management/payments/` | Payment list (?status, ?method, ?lease_id, ?tenant_id, ?date_from, ?date_to) |
| GET | `/api/v1/management/payouts/` | Payout list (?status, ?owner_id) |
| GET | `/api/v1/management/service-requests/` | Service request list (?status, ?priority, ?property_id, ?tenant_id) |
