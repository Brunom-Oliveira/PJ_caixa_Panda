
import type { Request, Response, NextFunction } from 'express';
import { estoqueService } from '../services/estoqueService.js';
import { AppError } from '../errors/AppError.js';

export const registrarMovimentacao = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { produtoId, tipo, quantidade, motivo } = req.body;

    if (!produtoId || !tipo || !quantidade) {
      throw new AppError('Dados incompletos. Informe produtoId, tipo e quantidade.');
    }

    if (!['ENTRADA', 'SAIDA', 'PERDA'].includes(tipo) && !tipo.startsWith('AJUSTE')) {
      throw new AppError('Tipo de movimentação inválido.');
    }

    await estoqueService.registrarMovimentacao(
      Number(produtoId),
      tipo,
      Number(quantidade),
      motivo
    );

    res.status(201).json({ message: 'Movimentação registrada com sucesso.' });
  } catch (err) {
    next(err);
  }
};

export const corrigirEstoque = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { produtoId, novoEstoque, motivo } = req.body;

    if (!produtoId || novoEstoque === undefined) {
      throw new AppError('Dados incompletos. Informe produtoId e novoEstoque.');
    }

    await estoqueService.corrigirEstoque(
      Number(produtoId),
      Number(novoEstoque),
      motivo || 'Ajuste Manual'
    );

    res.status(200).json({ message: 'Estoque corrigido com sucesso.' });
  } catch (err) {
    next(err);
  }
};

export const listarHistorico = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { produtoId } = req.params;
    
    if (!produtoId) {
        // If no ID, maybe return general history?
        const historico = await estoqueService.listarGeral();
        res.json(historico);
    } else {
        const historico = await estoqueService.getHistorico(Number(produtoId));
        res.json(historico);
    }
  } catch (err) {
    next(err);
  }
};
