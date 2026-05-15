
import axios from 'axios';
import type { Produto, Venda, Configuracao, Cliente } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para adicionar o token JWT em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@PandaMarket:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Funções de API existentes refatoradas para usar axios
export async function fetchConfig(): Promise<Configuracao> {
  const response = await api.get('/config');
  return response.data;
}

export async function updateConfig(config: Partial<Configuracao>): Promise<Configuracao> {
  const response = await api.put('/config', config);
  return response.data;
}

export async function fetchProdutos(query?: string): Promise<Produto[]> {
  const url = query ? `/produtos?q=${encodeURIComponent(query)}` : '/produtos';
  const response = await api.get(url);
  return response.data;
}

export async function fetchVendas(dataInicio?: string, dataFim?: string, produtoId?: number): Promise<Venda[]> {
  const response = await api.get('/vendas', {
    params: { dataInicio, dataFim, produtoId }
  });
  return response.data;
}

type ProdutoPayload = {
  nome: string;
  codigos: string[];
  valor: number;
  estoque: number;
};

export async function cadastrarProduto(p: ProdutoPayload): Promise<Produto> {
  const response = await api.post('/produtos', p);
  return response.data;
}

export async function atualizarProduto(id: number, p: ProdutoPayload): Promise<Produto> {
  const response = await api.put(`/produtos/${id}`, p);
  return response.data;
}

export async function excluirProduto(id: number): Promise<void> {
  await api.delete(`/produtos/${id}`);
}

export async function fetchProdutoByCodigo(codigo: string): Promise<Produto | null> {
  try {
    const response = await api.get(`/produtos/codigo/${codigo}`);
    return response.data;
  } catch (err: any) {
    if (err.response?.status === 404) return null;
    throw err;
  }
}

export async function fetchClientes(query?: string): Promise<Cliente[]> {
  const url = query ? `/clientes?q=${encodeURIComponent(query)}` : '/clientes';
  const response = await api.get(url);
  return response.data;
}

export async function cadastrarClienteApi(c: Omit<Cliente, 'id'>): Promise<Cliente> {
  const response = await api.post('/clientes', c);
  return response.data;
}

export async function atualizarClienteApi(id: number, c: Partial<Cliente>): Promise<Cliente> {
  const response = await api.put(`/clientes/${id}`, c);
  return response.data;
}

export async function excluirClienteApi(id: number): Promise<void> {
  await api.delete(`/clientes/${id}`);
}

export async function createVenda(itens: { produtoId: number; quantidade: number }[], clienteId?: number): Promise<Venda> {
  const response = await api.post('/vendas', { itens, clienteId });
  return response.data;
}

export async function movimentarEstoque(dados: { produtoId: number; tipo: string; quantidade: number; motivo: string }): Promise<void> {
  await api.post('/estoque/movimentacao', dados);
}

export async function corrigirEstoque(dados: { produtoId: number; novoEstoque: number; motivo: string }): Promise<void> {
  await api.post('/estoque/ajuste', dados);
}

export async function fetchHistoricoMovimentacao(produtoId?: number): Promise<any[]> {
  const url = produtoId ? `/estoque/historico/${produtoId}` : '/estoque/historico';
  const response = await api.get(url);
  return response.data;
}

export async function fetchDashboardStats(): Promise<any> {
  const response = await api.get('/estoque/dashboard');
  return response.data;
}

export async function fetchSugestaoCompra(): Promise<any[]> {
  const response = await api.get('/estoque/sugestao-compra');
  return response.data;
}

export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};
