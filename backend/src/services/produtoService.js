import { prisma } from '../database/prisma.js';
export const produtoService = {
    listar: async () => {
        return prisma.produto.findMany({
            include: { codigos: true },
            orderBy: { nome: 'asc' }
        });
    },
    cadastrar: async (dados) => {
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
    atualizar: async (id, dados) => {
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
    excluir: async (id) => {
        return prisma.produto.delete({ where: { id } });
    },
    buscarPorCodigo: async (codigo) => {
        const cb = await prisma.codigoBarras.findUnique({
            where: { codigo },
            include: { produto: { include: { codigos: true } } }
        });
        return cb?.produto || null;
    }
};
//# sourceMappingURL=produtoService.js.map