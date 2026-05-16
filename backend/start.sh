#!/bin/sh

echo "🔍 Verificando variáveis de ambiente..."
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERRO: A variável DATABASE_URL não está configurada!"
  exit 1
fi

# Removido db push e seed daqui pois já foram feitos manualmente 
# e para evitar que o pooler do Supabase (porta 6543) trave o deploy.

echo "🌐 Iniciando servidor Node.js..."
node dist/index.js

# Cache bust: 2026-05-15T23:11:00
