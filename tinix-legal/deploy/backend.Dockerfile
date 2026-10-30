FROM node:24-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20 AS build
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app/tinix-legal
COPY tinix-legal/ ./
# Legacy DuckDB install scripts are unnecessary for the isolated MVP runtime.
RUN npm ci --ignore-scripts && npm -w @tinix-legal/backend run build:mvp
FROM node:24-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20 AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app/tinix-legal
COPY tinix-legal/deploy/runtime/package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/tinix-legal/node_modules/.prisma/ node_modules/.prisma/
COPY --from=build /app/tinix-legal/packages/backend/dist-mvp/ packages/backend/dist-mvp/
COPY --from=build /app/tinix-legal/packages/backend/package.json packages/backend/package.json
COPY --from=build /app/tinix-legal/packages/shared/dist/ node_modules/@tinix-legal/shared/dist/
COPY --from=build /app/tinix-legal/packages/shared/package.json node_modules/@tinix-legal/shared/package.json
COPY --from=build /app/tinix-legal/packages/compliance-core/dist/ node_modules/@limi/compliance-core/dist/
COPY --from=build /app/tinix-legal/packages/compliance-core/package.json node_modules/@limi/compliance-core/package.json
USER node
ENV NODE_ENV=production API_HOST=0.0.0.0
CMD ["node", "packages/backend/dist-mvp/mvp-api.js"]
