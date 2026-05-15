
import { prisma } from '../database/prisma.js';
import { Decimal } from 'decimal.js';
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
    return prisma.movimentacaoEstoque.findMany({
      where: { produtoId },
      orderBy: { data: 'desc' },
      take: 50
    });
  },

  async listarGeral() {
    return prisma.movimentacaoEstoque.findMany({
      orderBy: { data: 'desc' },
      take: 50,
      include: { produto: true }
    });
  },

  async getSugestaoCompra() {
    // Retorna produtos com estoque baixo
    // Como o estoqueMinimo é dinâmico, precisamos filtrar no banco ou na aplicação.
    // O prisma não permite comparar duas colunas diretamente no 'where' de forma simples em todas as versões.
    // Vamos buscar os produtos e filtrar, assumindo que a base não é gigantesca para um mini mercado.
    // Se crescer, usar raw query é melhor.
    const produtos = await prisma.produto.findMany({
        where: {
            // Otimização: buscar apenas se estoque for baixo (ex: menor que 100 como corte seguro)
            // Mas para garantir, trazemos tudo e filtramos.
        }
    });

    return produtos.filter(p => p.estoque <= (p.estoqueMinimo || 5)).map(p => ({
        ...p,
        sugestaoReposicao: (p.estoqueMinimo || 5) * 2 - p.estoque // Sugere comprar para dobrar o mínimo
    }));
  },

  async getDashboardStats() {
    const produtos = await prisma.produto.findMany();
    
    const totalItens = produtos.length;
    const itensBaixoEstoque = produtos.filter(p => p.estoque <= (p.estoqueMinimo || 5)).length;
    
    // Cálculos Financeiros com Precisão (Decimal.js)
    let valorTotalCusto = new Decimal(0);
    let valorTotalVenda = new Decimal(0);
    
    produtos.forEach(p => {
        if (p.estoque > 0) {
            const custoItem = new Decimal(p.precoCusto || 0).times(p.estoque);
            const vendaItem = new Decimal(p.valor).times(p.estoque);
            valorTotalCusto = valorTotalCusto.plus(custoItem);
            valorTotalVenda = valorTotalVenda.plus(vendaItem);
        }
    });

    const lucroProjetado = valorTotalVenda.minus(valorTotalCusto);
    const margemMedia = valorTotalVenda.greaterThan(0) 
        ? lucroProjetado.dividedBy(valorTotalVenda).times(100).toNumber() 
        : 0;

    return {
        totalItens,
        itensBaixoEstoque,
        valorTotalCusto: valorTotalCusto.toNumber(),
        valorTotalVenda: valorTotalVenda.toNumber(),
        lucroProjetado: lucroProjetado.toNumber(),
        margemMedia
    };
  },

  // Helper to set absolute stock (correction) atomically
  async corrigirEstoque(produtoId: number, novoEstoque: number, motivo: string) {
      await prisma.$transaction(async (tx) => {
          const produto = await tx.produto.findUnique({ where: { id: produtoId } });
          if (!produto) throw new AppError('Produto não encontrado', 404);

          const diferenca = novoEstoque - produto.estoque;
          if (diferenca === 0) return;

          if (diferenca > 0) {
              await this.registrarMovimentacao(produtoId, 'AJUSTE_ENTRADA', diferenca, motivo, tx);
          } else {
              // Adjusting down
              await this.registrarMovimentacao(produtoId, 'AJUSTE_SAIDA', Math.abs(diferenca), `Correção de Estoque: ${motivo}`, tx);
          }
      });
  }
};
