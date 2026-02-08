
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = [
    { nome: 'Arroz 5kg', codigoBarras: '7891234567890', valor: 25.90, estoque: 100 },
    { nome: 'Feijão 1kg', codigoBarras: '7891234567891', valor: 8.50, estoque: 200 },
    { nome: 'Macarrão 500g', codigoBarras: '7891234567892', valor: 4.20, estoque: 150 },
    { nome: 'Óleo de Soja', codigoBarras: '7891234567893', valor: 6.80, estoque: 120 },
    { nome: 'Coca-Cola 2L', codigoBarras: '7891234567894', valor: 9.99, estoque: 60 },
    { nome: 'Sabão em Pó', codigoBarras: '7891234567895', valor: 15.50, estoque: 80 },
    { nome: 'Leite 1L', codigoBarras: '7891234567896', valor: 5.30, estoque: 50 },
  ];

  for (const p of products) {
    const exists = await prisma.produto.findUnique({ where: { codigoBarras: p.codigoBarras } });
    if (!exists) {
        await prisma.produto.create({ data: p });
        console.log(`Produto criado: ${p.nome}`);
    } else {
        console.log(`Produto já existe: ${p.nome}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
