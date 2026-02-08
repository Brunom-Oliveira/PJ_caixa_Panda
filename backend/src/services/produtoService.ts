import { prisma } from '../database/prisma.js';

interface ProdutoInput {
  nome: string;
  codigos: string[]; // Agora suporta array de códigos
  valor: number;
  estoque: number;
}

export const produtoService = {
  listar: async () => {
    return prisma.produto.findMany({ 
      include: { codigos: true },
      orderBy: { nome: 'asc' } 
    });
  },

  cadastrar: async (dados: ProdutoInput) => {
    return prisma.produto.create({
      data: {
        nome: dados.nome,
        valor: dados.valor,
        estoque: dados.estoque,
        codigos: {
          create: dados.codigos.map(c => ({ codigo: c }))
        }
      },
      include: { codigos: true }
    });
  },

  atualizar: async (id: number, dados: Partial<ProdutoInput>) => {
    return prisma.produto.update({
      where: { id },
      data: {
        nome: dados.nome,
        valor: dados.valor,
        estoque: dados.estoque,
        codigos: dados.codigos ? {
          deleteMany: {}, // Remove códigos antigos
          create: dados.codigos.map(c => ({ codigo: c }))
        } : undefined
      },
      include: { codigos: true }
    });
  },

  excluir: async (id: number) => {
    return prisma.produto.delete({ where: { id } });
  },

  buscarPorCodigo: async (codigo: string) => {
    const cb = await prisma.codigoBarras.findUnique({
      where: { codigo },
      include: { produto: { include: { codigos: true } } }
    });
    return cb?.produto || null;
  }
};
