FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY shared/ ./shared/
COPY level3/server.js ./level3/server.js
COPY level3/config/ ./level3/config/
COPY level3/shared-docs/ ./level3/shared-docs/

FROM node:20-alpine
RUN addgroup -S labgroup && adduser -S labuser -G labgroup
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/level3 ./level3

ENV NODE_ENV=production
USER labuser

ARG PORT=3003
ENV PORT=${PORT}

EXPOSE ${PORT}

CMD ["sh", "-c", "node level3/server.js"]
