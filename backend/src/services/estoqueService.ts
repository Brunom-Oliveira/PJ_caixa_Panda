
import { prisma } from '../database/prisma.js';
import { AppError } from '../errors/AppError.js';

export const estoqueService = {
  async registrarMovimentacao(
    produtoId: number,
    tipo: 'ENTRADA' | 'SAIDA' | 'PERDA' | 'AJUSTE_ENTRADA' | 'AJUSTE_SAIDA',
    quantidade: number,
    motivo?: string,
    tx: any = prisma // Allow passing a transaction client, typed as any to avoid complex Prisma transaction types
  ) {
    if (quantidade <= 0) {
      throw new AppError('Quantidade deve ser positiva.', 400);
    }

    const produto = await tx.produto.findUnique({ where: { id: produtoId } });
    if (!produto) {
      throw new AppError('Produto não encontrado.', 404);
    }

    const isSaida = ['SAIDA', 'PERDA', 'AJUSTE_SAIDA'].includes(tipo);
    const operation = isSaida ? 'decrement' : 'increment';

    // Check availability for outgoing movements
    if (isSaida) {
      if (produto.estoque < quantidade) {
        throw new AppError(`Estoque insuficiente. Disponível: ${produto.estoque}`, 400);
      }
    }

    // Update Product Stock
    await tx.produto.update({
        where: { id: produtoId },
        data: {
            estoque: {
                [operation]: quantidade
            }
        }
    });

    // Record Movement
    // Store localized type or clean type in DB?
    // We can store the exact type string.
    await tx.movimentacaoEstoque.create({
        data: {
            produtoId,
            tipo,
            quantidade,
            motivo,
            data: new Date()
        }
    });
    return { success: true };
  },

  async getHistorico(produtoId: number) {
      return await prisma.movimentacaoEstoque.findMany({
          where: { produtoId },
          orderBy: { data: 'desc' },
          include: { produto: true }
      });
  },

  async listarGeral() {
      return await prisma.movimentacaoEstoque.findMany({
          orderBy: { data: 'desc' },
          take: 100, // Limit to last 100 for display
          include: { produto: true }
      });
  },

  // Helper to set absolute stock (correction)
  async corrigirEstoque(produtoId: number, novoEstoque: number, motivo: string) {
      const produto = await prisma.produto.findUnique({ where: { id: produtoId } });
      if (!produto) throw new AppError('Produto não encontrado', 404);

      const diferenca = novoEstoque - produto.estoque;
      if (diferenca === 0) return;

      if (diferenca > 0) {
          await this.registrarMovimentacao(produtoId, 'AJUSTE_ENTRADA', diferenca, motivo);
      } else {
          // Adjusting down
          await this.registrarMovimentacao(produtoId, 'AJUSTE_SAIDA', Math.abs(diferenca), `Correção de Estoque: ${motivo}`);
      }
  }
};
