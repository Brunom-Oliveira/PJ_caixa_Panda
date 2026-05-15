
# 🐼 Panda Market - Enterprise POS & WMS

Sistema de Ponto de Venda e Gestão de Estoque de alta performance.

## 🚀 Como fazer o Deploy (Grátis)

### 1. Banco de Dados
- Crie um banco PostgreSQL no [Supabase](https://supabase.com/) ou [Neon](https://neon.tech/).
- Copie a URL de conexão.

### 2. Backend (Render/Koyeb)
- O projeto já possui um `Dockerfile` e `render.yaml`.
- Conecte seu repositório GitHub ao [Render](https://render.com/).
- Configure as Variáveis de Ambiente:
  - `DATABASE_URL`: URL do seu banco PostgreSQL.
  - `JWT_SECRET`: Uma senha forte para os tokens.
  - `PORT`: 3000.

### 3. Frontend (Vercel/Netlify)
- Conecte seu repositório.
- Configure a Variável de Ambiente:
  - `VITE_API_URL`: A URL do seu backend gerada pelo Render.

## 🛠️ Tecnologias
- **Frontend**: React, Vite, TanStack Virtual (Performance).
- **Backend**: Node.js, Express, Prisma, Decimal.js (Precisão Financeira).
- **Segurança**: JWT, Bcrypt, Helmet.
- **Banco**: PostgreSQL (Produção), SQLite (Desenvolvimento).

---
© 2026 Panda Market Team
