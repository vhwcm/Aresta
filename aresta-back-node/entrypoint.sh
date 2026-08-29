#!/bin/sh
set -e

echo "[Aresta Backend] Sincronizando schema do banco com Prisma..."
npx prisma db push --skip-generate

echo "[Aresta Backend] Iniciando servidor Express na porta $PORT..."
exec node dist/server.js
