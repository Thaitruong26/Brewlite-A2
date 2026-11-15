FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json .npmrc* ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma

ENV DATABASE_URL="postgresql://brewlite:brewlite@db:5432/brewlite"

RUN npm ci --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

COPY src ./src

RUN npm run build

EXPOSE 4001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4001/api/health | grep -q '"status":"ok"' || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed-production.ts && node dist/main.js"]
