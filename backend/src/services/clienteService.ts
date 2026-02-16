import { prisma } from '../database/prisma.js';

interface ClienteInput {
  nome: string;
  whatsapp?: string;
  email?: string;
}

export const clienteService = {
  listar: async (termo?: string) => {
    const where: any = {};
    
    if (termo) {
      where.OR = [
        { nome: { contains: termo } },
        { whatsapp: { contains: termo } },
        { email: { contains: termo } }
      ];
    }

    return prisma.cliente.findMany({ 
      where,
      orderBy: { nome: 'asc' } 
    });
  },

  buscarPorId: async (id: number) => {
    return prisma.cliente.findUnique({ where: { id } });
  },

  cadastrar: async (dados: ClienteInput) => {
    return prisma.cliente.create({ data: dados });
  },

  atualizar: async (id: number, dados: ClienteInput) => {
    return prisma.cliente.update({
      where: { id },
      data: dados
    });
  },

  excluir: async (id: number) => {
    return prisma.cliente.delete({ where: { id } });
  }
};
