import type { Request, Response, NextFunction } from 'express';
import { clienteService } from '../services/clienteService.js';

export const listarClientes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    const clientes = await clienteService.listar(q as string);
    res.json(clientes);
  } catch (err) {
    next(err);
  }
};

export const cadastrarCliente = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const novo = await clienteService.cadastrar(req.body);
    res.status(201).json(novo);
  } catch (err) {
    next(err);
  }
};

export const atualizarCliente = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const atualizado = await clienteService.atualizar(Number(id), req.body);
    res.json(atualizado);
  } catch (err) {
    next(err);
  }
};

export const excluirCliente = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await clienteService.excluir(Number(id));
    res.json({ mensagem: 'Cliente excluído com sucesso' });
  } catch (err) {
    next(err);
  }
};
