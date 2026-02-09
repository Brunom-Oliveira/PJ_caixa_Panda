import { prisma } from '../database/prisma.js';
export const clienteService = {
    listar: async () => {
        return prisma.cliente.findMany({ orderBy: { nome: 'asc' } });
    },
    buscarPorId: async (id) => {
        return prisma.cliente.findUnique({ where: { id } });
    },
    cadastrar: async (dados) => {
        return prisma.cliente.create({ data: dados });
    },
    atualizar: async (id, dados) => {
        return prisma.cliente.update({
            where: { id },
            data: dados
        });
    },
    excluir: async (id) => {
        return prisma.cliente.delete({ where: { id } });
    }
};
//# sourceMappingURL=clienteService.js.map