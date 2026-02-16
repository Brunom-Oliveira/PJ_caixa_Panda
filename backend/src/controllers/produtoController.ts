import type { Request, Response, NextFunction } from 'express';
import { produtoService } from '../services/produtoService.js';
import { AppError } from '../errors/AppError.js';

export const listarProdutos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    const produtos = await produtoService.listar(q as string);
    res.json(produtos);
  } catch (err) {
    next(err);
  }
};

export const cadastrarProduto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const novo = await produtoService.cadastrar(req.body);
    res.status(201).json(novo);
  } catch (err) {
    next(err);
  }
};

export const atualizarProduto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const atualizado = await produtoService.atualizar(Number(id), req.body);
    res.json(atualizado);
  } catch (err) {
    next(err);
  }
};

export const excluirProduto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await produtoService.excluir(Number(id));
    res.json({ message: 'Produto removido com sucesso' });
  } catch (err) {
    next(err);
  }
};

export const buscarPorCodigo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { codigo } = req.params;
    if (!codigo) throw new AppError('Código não fornecido');
    
    const produto = await produtoService.buscarPorCodigo(codigo);
    if (!produto) throw new AppError('Produto não encontrado', 404);
    
    res.json(produto);
  } catch (err) {
    next(err);
  }
};
