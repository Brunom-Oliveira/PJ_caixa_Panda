
import  type { Request, Response } from 'express';
import { vendaService } from '../services/vendaService.js';

export const listarVendas = async (req: Request, res: Response) => {
  try {
    const { dataInicio, dataFim } = req.query;
    const vendas = await vendaService.listar(dataInicio as string, dataFim as string);
    res.json(vendas);
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
};

export const cadastrarVenda = async (req: Request, res: Response) => {
  try {
    const { itens } = req.body;
    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ erro: 'Itens da venda não fornecidos.' });
    }
    
    // Convert to proper types if needed
    const itensFormatados = itens.map((item: any) => ({
      produtoId: Number(item.produtoId),
      quantidade: Number(item.quantidade)
    }));

    const novaVenda = await vendaService.cadastrar(itensFormatados);
    res.status(201).json(novaVenda);
  } catch (err: any) {
    res.status(400).json({ erro: err.message });
  }
};

export const buscarVendaPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ erro: 'ID da venda não fornecido' });
    
    const venda = await vendaService.buscarPorId(Number(id));
    if (!venda) return res.status(404).json({ erro: 'Venda não encontrada' });
    
    res.json(venda);
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
};
