# syntax=docker/dockerfile:1

# ── Builder stage ──────────────────────────────────────────────
FROM node:24-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Install dependencies (cache layer)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.json ./
COPY apps/backend/package.json apps/backend/
COPY packages/agent-protocol/package.json packages/agent-protocol/
COPY packages/browser-runtime-protocol/package.json packages/browser-runtime-protocol/
COPY packages/config/package.json packages/config/
COPY scripts/install-git-hooks.mjs scripts/ensure-ai-tooling.mjs scripts/
RUN CTHUTOOL_DISABLE_GIT_HOOKS=1 pnpm install --frozen-lockfile

# Copy source and build workspace dependencies first, then backend
COPY packages/agent-protocol/ packages/agent-protocol/
COPY packages/browser-runtime-protocol/ packages/browser-runtime-protocol/
COPY packages/config/ packages/config/
COPY apps/backend/ apps/backend/
COPY scripts/build-workspace-dependencies.mjs scripts/
RUN pnpm --filter @cthutool/agent-protocol build
RUN pnpm --filter @cthutool/browser-runtime-protocol build
RUN pnpm --filter @cthutool/config build
RUN pnpm --filter @cthutool/backend build

# ── Production stage ───────────────────────────────────────────
FROM node:24-alpine
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Copy only what's needed at runtime
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Workspace packages (built output + package.json for module resolution)
COPY --from=builder /app/packages/agent-protocol/dist ./packages/agent-protocol/dist
COPY --from=builder /app/packages/agent-protocol/package.json ./packages/agent-protocol/
COPY --from=builder /app/packages/browser-runtime-protocol/dist ./packages/browser-runtime-protocol/dist
COPY --from=builder /app/packages/browser-runtime-protocol/package.json ./packages/browser-runtime-protocol/
COPY --from=builder /app/packages/config/dist ./packages/config/dist
COPY --from=builder /app/packages/config/package.json ./packages/config/

# Backend built output (outDir: ./dist/apps/backend)
COPY --from=builder /app/apps/backend/dist/apps/backend ./dist
COPY --from=builder /app/apps/backend/package.json ./

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]
