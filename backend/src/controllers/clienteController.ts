import type { Request, Response } from 'express';
import { clienteService } from '../services/clienteService.js';

export const listarClientes = async (req: Request, res: Response) => {
  try {
    const clientes = await clienteService.listar();
    res.json(clientes);
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
};

export const cadastrarCliente = async (req: Request, res: Response) => {
  try {
    const novo = await clienteService.cadastrar(req.body);
    res.status(201).json(novo);
  } catch (err: any) {
    res.status(400).json({ erro: err.message });
  }
};

export const atualizarCliente = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const atualizado = await clienteService.atualizar(Number(id), req.body);
    res.json(atualizado);
  } catch (err: any) {
    res.status(400).json({ erro: err.message });
  }
};

export const excluirCliente = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await clienteService.excluir(Number(id));
    res.json({ mensagem: 'Cliente excluído com sucesso' });
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
};
