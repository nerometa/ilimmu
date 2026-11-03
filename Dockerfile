FROM oven/bun:1.4.0 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts
COPY . .
ARG PUBLIC_ORIGIN
# Synthetic build-only values satisfy config parsing; never runtime credentials.
RUN test -n "$PUBLIC_ORIGIN" && \
    ORIGIN="$PUBLIC_ORIGIN" DATABASE_URL=postgres://build@localhost/build \
    BETTER_AUTH_SECRET=build-only-placeholder-not-a-runtime-secret \
    BETTER_AUTH_URL="$PUBLIC_ORIGIN" bun run build

FROM oven/bun:1.4.0 AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile --ignore-scripts
COPY --from=build /app/build ./build
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/src/lib ./src/lib
USER bun
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD bun -e 'const r=await fetch("http://127.0.0.1:3000/api/health");process.exit(r.ok?0:1)'
CMD ["bun", "./build"]
