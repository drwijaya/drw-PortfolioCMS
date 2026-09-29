# ── deps ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ── build ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* is inlined during the build. Supply the public origins here
# so generated metadata and client-side requests use the deployment URLs.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_ANALYTICS_API_URL=
ENV NEXT_PUBLIC_ANALYTICS_API_URL=$NEXT_PUBLIC_ANALYTICS_API_URL

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run check

# ── run ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001 && mkdir -p /data/media /data/backups && chown -R nextjs:nodejs /data

# output: 'standalone' emits a minimal server plus only the deps it uses.
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["wget", "--spider", "-q", "http://127.0.0.1:3000/api/health"]
CMD ["node", "server.js"]
