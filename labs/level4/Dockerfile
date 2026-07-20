FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY shared/ ./shared/
COPY level4/server.js ./level4/server.js

FROM node:20-alpine
RUN addgroup -S labgroup && adduser -S labuser -G labgroup
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/level4 ./level4

ENV NODE_ENV=production
USER labuser

ARG PORT=3004
ENV PORT=${PORT}

EXPOSE ${PORT}

CMD ["sh", "-c", "node level4/server.js"]
