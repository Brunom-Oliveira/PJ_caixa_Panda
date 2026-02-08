import type { Produto, Venda, Configuracao } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function fetchConfig(): Promise<Configuracao> {
  const response = await fetch(`${API_URL}/config`);
  if (!response.ok) throw new Error('Erro ao buscar configurações');
  return response.json();
}

export async function updateConfig(config: Partial<Configuracao>): Promise<Configuracao> {
  const response = await fetch(`${API_URL}/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!response.ok) throw new Error('Erro ao atualizar configurações');
  return response.json();
}

export async function fetchProdutos(): Promise<Produto[]> {
  const response = await fetch(`${API_URL}/produtos`);
  if (!response.ok) throw new Error('Erro ao buscar lista de produtos');
  return response.json();
}

export async function fetchVendas(dataInicio?: string, dataFim?: string): Promise<Venda[]> {
  let url = `${API_URL}/vendas`;
  const params = new URLSearchParams();
  if (dataInicio) params.append('dataInicio', dataInicio);
  if (dataFim) params.append('dataFim', dataFim);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const response = await fetch(url);
  if (!response.ok) throw new Error('Erro ao buscar vendas');
  return response.json();
}

export async function cadastrarProduto(p: any): Promise<Produto> {
  const response = await fetch(`${API_URL}/produtos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.erro || 'Erro ao cadastrar produto');
  }
  return response.json();
}

export async function atualizarProduto(id: number, p: any): Promise<Produto> {
  const response = await fetch(`${API_URL}/produtos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.erro || 'Erro ao atualizar produto');
  }
  return response.json();
}

export async function excluirProduto(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/produtos/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Erro ao remover produto');
}

export async function fetchProdutoByCodigo(codigo: string): Promise<Produto | null> {
  const response = await fetch(`${API_URL}/produtos/codigo/${codigo}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Erro ao buscar produto');
  }
  return response.json();
}

export async function createVenda(itens: { produtoId: number; quantidade: number }[]): Promise<Venda> {
  const response = await fetch(`${API_URL}/vendas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itens }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.erro || 'Falha ao finalizar venda');
  }
  return response.json();
}

export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};
