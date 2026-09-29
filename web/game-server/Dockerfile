FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY game-server ./game-server
COPY lib/off-the-clock/pantry ./lib/off-the-clock/pantry
RUN node game-server/build.mjs

FROM node:22-alpine
WORKDIR /app
RUN addgroup -g 1001 -S pantry && adduser -S pantry -u 1001 -G pantry && mkdir /data && chown pantry:pantry /data
COPY --from=build /app/node_modules/@dimforge ./node_modules/@dimforge
COPY --from=build /app/game-server ./game-server
USER pantry
ENV PORT=8081
EXPOSE 8081
HEALTHCHECK --interval=20s --timeout=4s --start-period=10s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:8081/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
CMD ["node", "game-server/server.mjs"]
