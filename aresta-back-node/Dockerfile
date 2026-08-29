# Multi-stage build para aresta-back-node
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependências de build (OpenSSL para Prisma)
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY tsconfig.json ./
COPY proto ./proto/
COPY src ./src/

RUN npx prisma generate
RUN npm run build

# Runner stage
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl wget dos2unix

ENV NODE_ENV=production
ENV PORT=7070

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/proto ./proto
COPY entrypoint.sh ./entrypoint.sh
COPY storage ./storage

# Normalizar quebras de linha e dar permissão de execução
RUN dos2unix ./entrypoint.sh && chmod +x ./entrypoint.sh

# Criar diretórios para armazenamento caso não existam
RUN mkdir -p storage/pdfs storage/epubs storage/covers

EXPOSE 7070

ENTRYPOINT ["./entrypoint.sh"]
