import  type { Request, Response } from 'express';
import { produtoService } from '../services/produtoService.js';

export const listarProdutos = async (req: Request, res: Response) => {
  try {
    const produtos = await produtoService.listar();
    res.json(produtos);
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
};

export const cadastrarProduto = async (req: Request, res: Response) => {
  try {
    console.log('📦 Tentando cadastrar produto:', req.body);
    const novo = await produtoService.cadastrar(req.body);
    res.status(201).json(novo);
  } catch (err: any) {
    console.error('❌ Erro no cadastro de produto:', err);
    res.status(400).json({ erro: err.message });
  }
};

export const atualizarProduto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const atualizado = await produtoService.atualizar(Number(id), req.body);
    res.json(atualizado);
  } catch (err: any) {
    res.status(400).json({ erro: err.message });
  }
};

export const excluirProduto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await produtoService.excluir(Number(id));
    res.json({ message: 'Produto removido com sucesso' });
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
};

export const buscarPorCodigo = async (req: Request, res: Response) => {
  try {
    const { codigo } = req.params;
    if (!codigo) return res.status(400).json({ erro: 'Código não fornecido' });
    const produto = await produtoService.buscarPorCodigo(codigo);
    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });
    res.json(produto);
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
};
