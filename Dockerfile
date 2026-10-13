FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/core/package.json packages/core/
COPY packages/db/package.json packages/db/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules node_modules
COPY . .
RUN pnpm run build

FROM base AS runner
ENV NODE_ENV=production
ENV DATABASE_PATH=/data/pagekit.db

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

RUN mkdir -p /data

EXPOSE 3000
CMD ["node", "apps/web/server.js"]