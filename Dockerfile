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

ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_SENTRY_DISABLED=true

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

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
