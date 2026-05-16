#!/bin/sh

echo "🔍 Verificando variáveis de ambiente..."
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERRO: A variável DATABASE_URL não está configurada no Render!"
  exit 1
fi

echo "🚀 Iniciando sincronização do banco com Prisma (db push)..."
npx prisma db push --accept-data-loss

echo "🌱 Rodando sementes (seeds)..."
npx prisma db seed

echo "🌐 Iniciando servidor Node.js..."
node dist/index.js
