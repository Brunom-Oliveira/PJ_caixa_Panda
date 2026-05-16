
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.usuario.update({
    where: { email: 'admin@admin.com' },
    data: { senha: hashedPassword }
  });
  console.log('✅ Senha do Admin atualizada para: admin123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
