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

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
