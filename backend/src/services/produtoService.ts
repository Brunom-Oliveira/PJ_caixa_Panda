import { prisma } from '../database/prisma.js';

interface ProdutoInput {
  nome: string;
  codigos: string[]; // Agora suporta array de códigos
  valor: number;
  estoque: number;
}

export const produtoService = {
  listar: async (termo?: string) => {
    const where: any = {};

    if (termo) {
      where.OR = [
        { nome: { contains: termo } }, // Removed mode: 'insensitive' for compatibility, check if needed
        { codigos: { some: { codigo: { contains: termo } } } }
      ];
    }

    return prisma.produto.findMany({ 
      where,
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
        nome: dados.nome ?? undefined,
        valor: dados.valor ?? undefined,
        estoque: dados.estoque ?? undefined,
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
