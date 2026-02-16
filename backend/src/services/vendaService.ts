
import { PrismaClient } from '@prisma/client';
import { prisma } from '../database/prisma.js';
import { AppError } from '../errors/AppError.js';
import { estoqueService } from './estoqueService.js';

export const vendaService = {
  async cadastrar(itens: { produtoId: number; quantidade: number }[], clienteId?: number) {
     // 1. Fetch products to get prices and check stock
    const produtoIds = itens.map(item => item.produtoId);
    
    // Check if products exist and have stock
    for (const item of itens) {
      const produto = await prisma.produto.findUnique({ where: { id: item.produtoId } });
      if (!produto) {
        throw new AppError(`Produto não encontrado: ID ${item.produtoId}`, 404);
      }
      if (produto.estoque < item.quantidade) {
        throw new AppError(`Estoque insuficiente para o produto ${produto.nome}`, 400);
      }
    }

    let totalVenda = 0;
    const itemsToCreate: { produtoId: number; quantidade: number; subtotal: number }[] = [];

    // Calculate total and prepare items
    for (const item of itens) {
      const produto = await prisma.produto.findUnique({ where: { id: item.produtoId } });
      if (!produto) continue;

      const subtotal = produto.valor * item.quantidade;
      totalVenda += subtotal;

      itemsToCreate.push({
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        subtotal: subtotal
      });
    }

    // Transaction to create sale and update stock
    const venda = await prisma.$transaction(async (tx) => {
      // Create Sale
      const novaVenda = await tx.venda.create({
        data: {
          total: totalVenda,
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

      // Update Stock via EstoqueService
      for (const item of itemsToCreate) {
        await estoqueService.registrarMovimentacao(
          item.produtoId,
          'SAIDA',
          item.quantidade,
          `Venda #${novaVenda.id}`,
          tx
        );
      }

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
