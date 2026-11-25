# Build and run the backend on the same supported Node.js release.
FROM node:22.23.4-alpine AS base

WORKDIR /app

FROM base AS builder
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY backend/ ./backend/
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:5000/healthz').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["npm", "start"]
