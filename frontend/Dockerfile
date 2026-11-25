FROM node:22.23.4-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN npm i -g pnpm@10.13.1

WORKDIR /app

FROM base AS deps
COPY package*.json pnpm*.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
ARG VITE_BACKEND_URL
ARG VITE_TIMEOUT
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_TIMEOUT=$VITE_TIMEOUT

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
RUN npm install -g serve

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:5173/').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["serve", "-s", "dist", "-l", "5173"]
