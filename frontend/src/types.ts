export interface CodigoBarras {
  id: number;
  codigo: string;
}

export interface Produto {
  id: number;
  nome: string;
  valor: number;
  estoque: number;
  codigos?: CodigoBarras[];
}

export interface ItemVenda {
  id?: number;
  vendaId?: number;
  produtoId: number;
  quantidade: number;
  subtotal: number;
  produto?: Produto;
}

export interface Venda {
  id: number;
  total: number;
  dataVenda: string;
  itens: ItemVenda[];
}

export interface Configuracao {
  id: number;
  nomeMercado: string;
  cnpj: string;
}
