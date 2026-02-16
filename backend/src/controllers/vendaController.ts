import type { Request, Response, NextFunction } from 'express';
import { vendaService } from '../services/vendaService.js';
import { AppError } from '../errors/AppError.js';

export const listarVendas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dataInicio, dataFim, produtoId } = req.query;
    const vendas = await vendaService.listar(
      dataInicio as string, 
      dataFim as string, 
      produtoId ? Number(produtoId) : undefined
    );
    res.json(vendas);
  } catch (err) {
    next(err);
  }
};

export const cadastrarVenda = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itens, clienteId } = req.body;
    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      throw new AppError('Itens da venda não fornecidos.');
    }
    
    // Convert to proper types if needed
    const itensFormatados = itens.map((item: any) => ({
      produtoId: Number(item.produtoId),
      quantidade: Number(item.quantidade)
    }));

    const novaVenda = await vendaService.cadastrar(itensFormatados, clienteId ? Number(clienteId) : undefined);
    res.status(201).json(novaVenda);
  } catch (err) {
    next(err);
  }
};

export const buscarVendaPorId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) throw new AppError('ID da venda não fornecido');
    
    const venda = await vendaService.buscarPorId(Number(id));
    if (!venda) throw new AppError('Venda não encontrada', 404);
    
    res.json(venda);
  } catch (err) {
    next(err);
  }
};
