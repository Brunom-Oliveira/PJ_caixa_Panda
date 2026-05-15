
import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../errors/AppError.js';
import { estoqueService } from './estoqueService.js';

export const vendaService = {
  async cadastrar(itens: { produtoId: number; quantidade: number }[], clienteId?: number) {
    if (!itens || itens.length === 0) throw new AppError('Carrinho vazio.', 400);

    // Iniciar Transação Atômica - Impede Race Conditions
    const venda = await prisma.$transaction(async (tx) => {
      let totalVenda = new Decimal(0);
      const itemsToCreate: { produtoId: number; quantidade: number; subtotal: number }[] = [];

      for (const item of itens) {
        // Leitura protegida DENTRO da transação
        const produto = await tx.produto.findUnique({ where: { id: item.produtoId } });
        
        if (!produto) {
          throw new AppError(`Produto não encontrado: ID ${item.produtoId}`, 404);
        }
        if (produto.estoque < item.quantidade) {
          throw new AppError(`Estoque insuficiente para o produto ${produto.nome}. Disponível: ${produto.estoque}`, 400);
        }

        // Cálculos Financeiros Seguros com Decimal.js
        const subtotal = new Decimal(produto.valor).times(item.quantidade);
        totalVenda = totalVenda.plus(subtotal);

        itemsToCreate.push({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          subtotal: subtotal.toNumber()
        });

        // Decremento Atômico
        await tx.produto.update({
          where: { id: item.produtoId },
          data: { estoque: { decrement: item.quantidade } }
        });

        // Registro de Movimentação no WMS vinculado à Transação
        await tx.movimentacaoEstoque.create({
          data: {
            produtoId: item.produtoId,
            tipo: 'SAIDA', // Ou 'SAIDA_VENDA'
            quantidade: item.quantidade,
            motivo: 'Venda via PDV',
            data: new Date()
          }
        });
      }

      // Finalizar Venda
      const novaVenda = await tx.venda.create({
        data: {
          total: totalVenda.toNumber(),
          clienteId: clienteId || undefined,
          itens: {
            create: itemsToCreate
          }
        },
        include: {
          cliente: true,
          itens: {
            include: {
              produto: true
            }
          }
        }
      });

      return novaVenda;
    });

    return venda;
  },

  async listar(dataInicio?: string, dataFim?: string, produtoId?: number) {
    const where: any = {};
    
    // Filtro por data (Tratando fuso horário para abranger o dia inteiro)
    if (dataInicio || dataFim) {
      where.dataVenda = {};
      if (dataInicio) {
        const inicio = new Date(dataInicio);
        if (dataInicio.length === 10) inicio.setUTCHours(0, 0, 0, 0);
        where.dataVenda.gte = inicio;
      }
      if (dataFim) {
        const fim = new Date(dataFim);
        if (dataFim.length === 10) fim.setUTCHours(23, 59, 59, 999);
        where.dataVenda.lte = fim;
      }
    }

    // Filtro por produto específico
    if (produtoId) {
      where.itens = {
        some: {
          produtoId: produtoId
        }
      };
    }

    return await prisma.venda.findMany({
      where,
      include: {
        cliente: true,
        itens: {
          include: {
            produto: {
              include: {
                codigos: true
              }
            }
          }
        }
      },
      orderBy: {
        dataVenda: 'desc'
      }
    });
  },

  async buscarPorId(id: number) {
    const venda = await prisma.venda.findUnique({
      where: { id },
      include: {
        cliente: true,
        itens: {
          include: {
            produto: true
          }
        }
      }
    });
    return venda;
  }
};
