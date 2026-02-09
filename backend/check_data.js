import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const count = await prisma.venda.count();
    const lastVenda = await prisma.venda.findFirst({ orderBy: { dataVenda: 'desc' } });
    console.log('Total sales:', count);
    console.log('Last sale:', lastVenda);
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=check_data.js.map