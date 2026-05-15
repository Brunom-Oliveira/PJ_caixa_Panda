
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@panda.com';
  const adminSenha = 'admin'; // Recomendado mudar após o primeiro login
  
  const existing = await prisma.usuario.findUnique({
    where: { email: adminEmail }
  });

  if (existing) {
    console.log('Usuário admin já existe.');
    return;
  }

  const hashedPassword = await bcrypt.hash(adminSenha, 10);

  await prisma.usuario.create({
    data: {
      nome: 'Administrador Panda',
      email: adminEmail,
      senha: hashedPassword,
      role: 'ADMIN'
    }
  });

  console.log('✅ Usuário Administrador criado com sucesso!');
  console.log('Email: ' + adminEmail);
  console.log('Senha: ' + adminSenha);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
