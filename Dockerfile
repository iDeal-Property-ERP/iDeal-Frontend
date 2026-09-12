# ---- Stage 1: Dependencies ----
FROM node:24-alpine AS deps

WORKDIR /app

# Use `npm install` (not `npm ci`): the committed lockfile omits a wasm-only
# optional dependency (@emnapi/runtime), which `npm ci` rejects. `npm install`
# is lockfile-guided but reconciles that gap at build time.
COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund

# ---- Stage 2: Builder ----
FROM node:24-alpine AS builder

ARG BACKEND_ORIGIN
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_YANDEX_MAPS_API_KEY
ARG NEXT_PUBLIC_LOGGING_LEVEL

ENV NODE_ENV=production \
    IDEAL_PRODUCTION_BUILD=true \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_SENTRY_DISABLED=true \
    BACKEND_ORIGIN=${BACKEND_ORIGIN} \
    NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} \
    NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_YANDEX_MAPS_API_KEY=${NEXT_PUBLIC_YANDEX_MAPS_API_KEY} \
    NEXT_PUBLIC_LOGGING_LEVEL=${NEXT_PUBLIC_LOGGING_LEVEL}

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN node scripts/validate-production-env.mjs && npm run build

# ---- Stage 3: Runner ----
FROM node:24-alpine AS runner

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

WORKDIR /app

RUN addgroup -S nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
