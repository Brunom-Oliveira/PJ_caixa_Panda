# Use a Node.js LTS base image
FROM node:20-slim AS builder

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client and build TypeScript
# Use a dummy URL for build-time generation to avoid validation errors
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate
RUN npm run build

# --- Production Image ---
FROM node:20-slim AS runner

RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Create logs directory
RUN mkdir -p logs

# Render uses the PORT environment variable, defaulting to 3000
ENV PORT=3000
EXPOSE 3000

# Startup script with verbose logging to debug hangs
CMD ["sh", "-c", "echo '🚀 Iniciando sincronização do banco com Prisma...' && npx prisma db push --accept-data-loss && echo '✅ Banco sincronizado com sucesso!' && echo '🌐 Iniciando servidor Node.js na porta $PORT...' && node dist/index.js"]
