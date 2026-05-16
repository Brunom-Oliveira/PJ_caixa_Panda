#!/bin/sh

echo "🔍 Verificando variáveis de ambiente..."
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERRO: A variável DATABASE_URL não está configurada no Render!"
  exit 1
fi

echo "🚀 Iniciando sincronização do banco com Prisma (db push)..."
# Tenta rodar o push, mas não trava o container se falhar (para podermos ver o erro no log)
npx prisma db push --accept-data-loss

echo "🌐 Iniciando servidor Node.js..."
node dist/index.js
