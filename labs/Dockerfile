FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY shared/ ./shared/
COPY level1/server.js ./level1/server.js
COPY level2/server.js ./level2/server.js
COPY level3/server.js ./level3/server.js
COPY level3/config/ ./level3/config/
COPY level3/shared-docs/ ./level3/shared-docs/
COPY level4/server.js ./level4/server.js

FROM node:20-alpine
RUN addgroup -S labgroup && adduser -S labuser -G labgroup
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/level1 ./level1
COPY --from=builder /app/level2 ./level2
COPY --from=builder /app/level3 ./level3
COPY --from=builder /app/level4 ./level4

ENV NODE_ENV=production
USER labuser

ARG LAB=level1
ARG PORT=3001
ENV LAB=${LAB}
ENV PORT=${PORT}

EXPOSE ${PORT}

CMD ["sh", "-c", "node ${LAB}/server.js"]
