import React, { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { EstoqueModal } from './components/EstoqueModal';
import { 
    fetchProdutoByCodigo, 
    createVenda, 
    formatCurrency, 
    fetchProdutos, 
    fetchVendas, 
    cadastrarProduto,
    atualizarProduto,
    excluirProduto,
    fetchConfig,
    updateConfig,
    fetchClientes,
    cadastrarClienteApi,
    atualizarClienteApi,
    excluirClienteApi
} from './api';
import type { ItemVenda, Venda, Produto, Configuracao, Cliente } from './types';

// Declaração para o html2pdf
declare const html2pdf: () => {
  set: (opt: unknown) => {
    from: (el: HTMLElement) => {
      save: () => Promise<void>;
    };
  };
};

interface ProductSearchModalProps {
    allProducts: Produto[];
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    onClose: () => void;
    onSelect: (p: Produto) => void;
    onEdit: (p: Produto) => void;
    onDelete: (id: number) => void;
}

const ProductSearchModal: React.FC<ProductSearchModalProps> = ({ 
    allProducts, searchTerm, setSearchTerm, onClose, onSelect, onEdit, onDelete 
}) => {
    const parentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: allProducts.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 60,
        overscan: 5,
    });

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: '700px', width: '95%', height: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2>📦 Buscar Produto</h2>
                    <button className="secondary-close" onClick={onClose}>X</button>
                </div>

                <input 
                    className="big-input" 
                    style={{ fontSize: '1.1rem', padding: '1rem', marginBottom: '1rem' }}
                    placeholder="Filtrar por nome ou código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                />

                <div ref={parentRef} style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '16px' }}>
                    <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                            const produto = allProducts[virtualRow.index];
                            if (!produto) return null;
                            return (
                                <div 
                                    key={virtualRow.key} 
                                    className="table-row animate-item" 
                                    style={{ 
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                        gridTemplateColumns: '2fr 1fr 1fr 1fr auto', 
                                        cursor: 'pointer',
                                        display: 'grid',
                                        alignItems: 'center',
                                        padding: '0 1rem',
                                        borderBottom: '1px solid var(--border)',
                                        boxSizing: 'border-box'
                                    }}
                                    onClick={() => onSelect(produto)}
                                >
                                    <div style={{ textAlign: 'left', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{produto.nome}</div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                        {produto.codigos?.map(c => c.codigo).join(', ') || '-'}
                                    </div>
                                    <div style={{ 
                                        fontWeight: 'bold', 
                                        textAlign: 'center',
                                        color: produto.estoque <= 0 ? 'var(--danger)' : produto.estoque < 10 ? 'var(--warning, orange)' : 'var(--success)' 
                                    }}>
                                        {produto.estoque} {produto.unidade || 'un'}
                                    </div>
                                    <div style={{ color: 'var(--accent)', fontWeight: 'bold', textAlign: 'right' }}>{formatCurrency(produto.valor)}</div>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                                        <button className="secondary" style={{ padding: '0.4rem', fontSize: '0.9rem' }} onClick={() => onEdit(produto)}>✏️</button>
                                        <button className="danger" style={{ padding: '0.4rem', fontSize: '0.9rem' }} onClick={() => onDelete(produto.id)}>🗑️</button>
                                    </div>
                                </div>
                            );
                        })}
                        {allProducts.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                Nenhum produto encontrado.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

import { LoginPage } from './components/LoginPage';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { user, token, logout, loading: authLoading } = useAuth();
  const [items, setItems] = useState<ItemVenda[]>([]);
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<Venda | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showEstoqueModal, setShowEstoqueModal] = useState(false);

  // ... (rest of states)
  const [showScanner, setShowScanner] = useState(false);
  const [reportDates, setReportDates] = useState({ inicio: new Date().toISOString().split('T')[0], fim: new Date().toISOString().split('T')[0] });
  const [reportProductId, setReportProductId] = useState<number | null>(null);
  const [expandedVenda, setExpandedVenda] = useState<number | null>(null);
  
  const [allProducts, setAllProducts] = useState<Produto[]>([]);
  const [vendasHistory, setVendasHistory] = useState<Venda[]>([]);
  const [config, setConfig] = useState<Configuracao>({ id: 1, nomeMercado: 'Panda Market', cnpj: '00.000.000/0001-00', endereco: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null); // Adicionado para o PDF do relatório

  // Estados para Clientes
  const [showClientesModal, setShowClientesModal] = useState(false);
  const [showAddClienteModal, setShowAddClienteModal] = useState(false);
  const [allClientes, setAllClientes] = useState<Cliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [newCliente, setNewCliente] = useState({ nome: '', whatsapp: '', email: '' });
  const [clienteSearchTerm, setClienteSearchTerm] = useState('');

  // Estados para Produtos
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [newProd, setNewProd] = useState({ 
    nome: '', 
    codigos: '', 
    valor: '', 
    estoque: '', 
    precoCusto: '', 
    estoqueMinimo: '5', 
    unidade: 'UN', 
    localizacao: '', 
    dataValidade: '' 
  });

  // Estados para Configurações
  const [editConfig, setEditConfig] = useState({ nomeMercado: '', cnpj: '', endereco: '' });

  // Estados para Quantidade ao adicionar produto
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [qtyProduct, setQtyProduct] = useState<Produto | null>(null);
  const [qtyValue, setQtyValue] = useState('1');

  const promptQuantidade = useCallback((produto: Produto) => {
    console.log('📦 Prompt Quantidade called for:', produto.nome);
    setQtyProduct(produto);
    setQtyValue('1');
    setShowQtyModal(true);
  }, []);

  const handleScanFromCamera = useCallback(async (code: string) => {
    setLoading(true);
    try {
      const produto = await fetchProdutoByCodigo(code);
      if (produto) {
        promptQuantidade(produto);
      } else {
        setError('Produto nÃ£o encontrado: ' + code);
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError('Erro ao buscar produto');
    } finally {
      setLoading(false);
    }
  }, [promptQuantidade]);

  const total = items.reduce((acc, item) => acc + item.subtotal, 0);

  useEffect(() => {
    if (token) {
      fetchConfig().then(setConfig).catch(console.error);
    }
  }, [token]);

  useEffect(() => {
    // Focar no input sempre que o recibo ou modal forem fechados
    if (token && !receipt && !loading && !showSearchModal && !showReportModal && !showAddProductModal && !showConfigModal && !showClientesModal && !showAddClienteModal && !showScanner && !showQtyModal) {
      inputRef.current?.focus();
    }
  }, [receipt, loading, showSearchModal, showReportModal, showAddProductModal, showConfigModal, showClientesModal, showAddClienteModal, showScanner, showQtyModal, token]);

  // Efeito para o Scanner da Câmera
  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner("reader", { 
        fps: 10, 
        qrbox: { width: 250, height: 150 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [0] // 0 = Camera
      }, false);

      scanner.render((decodedText) => {
        handleScanFromCamera(decodedText);
        scanner.clear();
        setShowScanner(false);
      }, () => {
        // Ignorar erros de scan frequentes (não leu nada)
      });

      return () => {
        scanner.clear().catch(err => console.error("Erro ao limpar scanner", err));
      };
    }
  }, [showScanner, handleScanFromCamera]);

  // Efeitos para busca no backend
  useEffect(() => {
    if (!showSearchModal) return;
    const timer = setTimeout(() => {
      fetchProdutos(searchTerm).then(setAllProducts).catch(console.error);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, showSearchModal]);

  useEffect(() => {
    if (!showClientesModal) return;
    const timer = setTimeout(() => {
      fetchClientes(clienteSearchTerm).then(setAllClientes).catch(console.error);
    }, 300);
    return () => clearTimeout(timer);
  }, [clienteSearchTerm, showClientesModal]);

  // Renderização condicional movida para dentro do return principal para garantir a ordem dos hooks

  const openSearchModal = async () => {
    setLoading(true);
    try {
      const prods = await fetchProdutos();
      setAllProducts(prods);
      setShowSearchModal(true);
      setSearchTerm('');
    } catch {
      setError('Erro ao carregar lista de produtos');
    } finally {
      setLoading(false);
    }
  };

  const openReportModal = async () => {
    setLoading(true);
    try {
      const prods = await fetchProdutos();
      setAllProducts(prods);
      const history = await fetchVendas(reportDates.inicio, reportDates.fim, reportProductId || undefined);
      setVendasHistory(history);
      setShowReportModal(true);
    } catch {
      setError('Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterReport = async () => {
    setLoading(true);
    try {
      const history = await fetchVendas(reportDates.inicio, reportDates.fim, reportProductId || undefined);
      setVendasHistory(history);
    } catch {
      setError('Erro ao filtrar relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReportPDF = async () => {
    if (!reportRef.current) return;
    setLoading(true);
    const originalExpanded = expandedVenda;
    
    // Forçar expansão de todos os itens para o PDF
    setExpandedVenda(-1);
    
    // Pequeno delay para garantir renderização do React
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const element = reportRef.current;
      const filteredProductName = reportProductId 
        ? allProducts.find(p => p.id === reportProductId)?.nome 
        : 'Todos';

      const opt = {
        margin: 10,
        filename: `extrato_${filteredProductName}_${reportDates.inicio}_a_${reportDates.fim}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Clonar e ajustar temporariamente para o PDF (preto no branco)
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.background = '#ffffff';
      clone.style.color = '#000000';
      clone.style.padding = '20px';
      clone.style.width = '1000px'; 
      
      // Mostrar elemento pdf-only no clone
      const pdfOnly = clone.querySelector('.pdf-only') as HTMLElement;
      if (pdfOnly) pdfOnly.style.display = 'block';

      // Ajustar cores de textos internos no clone
      clone.querySelectorAll('*').forEach((el) => {
        const node = el as HTMLElement;
        node.style.color = '#000000';
        node.style.borderColor = '#dddddd';
        if (node.classList.contains('history-item')) {
           node.style.backgroundColor = '#f9f9f9';
           // Remover limite de altura ou overflow se houver
           node.style.height = 'auto';
           node.style.maxHeight = 'none';
        }
      });
      
      // Remover container de scroll para o PDF mostrar tudo
      const listContainer = clone.querySelector('.report-list-container') as HTMLElement;
      if (listContainer) {
          listContainer.style.maxHeight = 'none';
          listContainer.style.overflow = 'visible';
      }

      await html2pdf().set(opt).from(clone).save();
    } catch {
      setError('Erro ao gerar PDF do extrato');
    } finally {
      // Restaurar estado original
      setExpandedVenda(originalExpanded);
      setLoading(false);
    }
  };

  const handleGenerateStockPDF = async () => {
    setLoading(true);
    try {
      // Garantir que temos a lista atualizada
      const prods = await fetchProdutos();
      setAllProducts(prods);

      // Calcular totais
      const valorTotalEstoque = prods.reduce((acc, p) => acc + (p.valor * p.estoque), 0);
      const totalItens = prods.reduce((acc, p) => acc + p.estoque, 0);

      // Criar elemento HTML temporário para o PDF
      const container = document.createElement('div');
      
      // Estilo Inline para garantir a aparência no PDF
      container.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #000; background: #fff; width: 900px; box-sizing: border-box;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px;">
            <h1 style="margin: 0; text-transform: uppercase; font-size: 24px;">${config.nomeMercado}</h1>
            <p style="margin: 5px 0; font-size: 14px;">CNPJ: ${config.cnpj}</p>
            <h2 style="margin-top: 15px; font-size: 18px;">RELATÓRIO DE ESTOQUE</h2>
            <p style="font-size: 12px; color: #666;">Gerado em: ${new Date().toLocaleString()}</p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">PRODUTO</th>
                <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">CÓDIGO</th>
                <th style="text-align: center; padding: 8px; border-bottom: 1px solid #ddd;">QTD</th>
                <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">UNIT. (R$)</th>
                <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">TOTAL (R$)</th>
              </tr>
            </thead>
            <tbody>
              ${prods.map((p, index) => `
                <tr style="background-color: ${index % 2 === 0 ? '#fff' : '#f9f9f9'};">
                  <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${p.nome}</strong></td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; color: #555;">${p.codigos?.map(c => c.codigo).join(', ') || '-'}</td>
                  <td style="padding: 8px; text-align: center; border-bottom: 1px solid #eee; font-weight: bold; ${p.estoque <= 0 ? 'color: red;' : ''}">${p.estoque}</td>
                  <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">${p.valor.toFixed(2)}</td>
                  <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">${(p.valor * p.estoque).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="margin-top: 20px; text-align: right; border-top: 2px solid #333; padding-top: 15px; padding-right: 20px;">
             <div style="font-size: 14px; margin-bottom: 5px;">
              TOTAL DE ITENS: <strong>${totalItens}</strong>
            </div>
            <div style="font-size: 18px; font-weight: bold;">
              VALOR TOTAL EM ESTOQUE: ${valorTotalEstoque.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </div>
          
           <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #999; border-top: 1px dashed #ccc; padding-top: 10px;">
            Sistema Panda Caixa - Relatório gerado automaticamente
          </div>
        </div>
      `;

      const opt = {
        margin: 10,
        filename: `relatorio_estoque_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      await html2pdf().set(opt).from(container).save();
    } catch (err) {
      console.error(err);
      setError('Erro ao gerar relatório de estoque');
    } finally {
      setLoading(false);
    }
  };


  // Funções de Gestão de Clientes
  const openClientesModal = async () => {
    setLoading(true);
    try {
      const data = await fetchClientes();
      setAllClientes(data);
      setShowClientesModal(true);
      setClienteSearchTerm('');
    } catch {
      setError('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingCliente) {
        await atualizarClienteApi(editingCliente.id, newCliente);
        setError('Cliente atualizado!');
      } else {
        await cadastrarClienteApi(newCliente);
        setError('Cliente cadastrado!');
      }
      setShowAddClienteModal(false);
      setEditingCliente(null);
      setNewCliente({ nome: '', whatsapp: '', email: '' });
      setTimeout(() => setError(null), 3000);
      openClientesModal(); // Refresh client list
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCliente = async (id: number) => {
    if (!window.confirm('Excluir este cliente?')) return;
    setLoading(true);
    try {
      await excluirClienteApi(id);
      setError('Cliente excluído!');
      setTimeout(() => setError(null), 3000);
      openClientesModal(); // Refresh client list
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir cliente');
    } finally {
      setLoading(false);
    }
  };

  const startEditCliente = (c: Cliente) => {
    setEditingCliente(c);
    setNewCliente({ nome: c.nome, whatsapp: c.whatsapp || '', email: c.email || '' });
    setShowAddClienteModal(true);
  };

  // Funções de Gestão de Produtos
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        nome: newProd.nome,
        codigos: newProd.codigos.split(',').map(c => c.trim()).filter(c => c),
        valor: parseFloat(newProd.valor),
        estoque: parseInt(newProd.estoque),
        precoCusto: parseFloat(newProd.precoCusto) || 0,
        estoqueMinimo: parseInt(newProd.estoqueMinimo) || 5,
        unidade: newProd.unidade || 'UN',
        localizacao: newProd.localizacao,
        dataValidade: newProd.dataValidade ? new Date(newProd.dataValidade).toISOString() : undefined
      };

      if (editingProduct) {
        await atualizarProduto(editingProduct.id, payload);
        setError('Produto atualizado com sucesso!');
      } else {
        await cadastrarProduto(payload);
        setError('Produto cadastrado com sucesso!');
      }

      setShowAddProductModal(false);
      setEditingProduct(null);
      setNewProd({ 
        nome: '', 
        codigos: '', 
        valor: '', 
        estoque: '', 
        precoCusto: '', 
        estoqueMinimo: '5', 
        unidade: 'UN', 
        localizacao: '', 
        dataValidade: '' 
      });
      setTimeout(() => setError(null), 3000);
      
      // Refresh list if search modal is open
      if (showSearchModal) {
        const prods = await fetchProdutos();
        setAllProducts(prods);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja remover este produto?')) return;
    setLoading(true);
    try {
      await excluirProduto(id);
      const prods = await fetchProdutos();
      setAllProducts(prods);
      setError('Produto removido');
      setTimeout(() => setError(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao remover produto');
    } finally {
      setLoading(false);
    }
  };

  const startEditProduct = (p: Produto) => {
    setEditingProduct(p);
    setNewProd({
      nome: p.nome,
      codigos: p.codigos?.map(c => c.codigo).join(', ') || '',
      valor: p.valor.toString(),
      estoque: p.estoque.toString(),
      precoCusto: p.precoCusto?.toString() || '',
      estoqueMinimo: p.estoqueMinimo?.toString() || '5',
      unidade: p.unidade || 'UN',
      localizacao: p.localizacao || '',
      dataValidade: p.dataValidade ? p.dataValidade.split('T')[0] : ''
    });
    setShowAddProductModal(true);
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await updateConfig(editConfig);
      setConfig(updated);
      setShowConfigModal(false);
      setError('Configurações salvas!');
      setTimeout(() => setError(null), 3000);
    } catch {
      setError('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const openConfigModal = () => {
    setEditConfig({ nomeMercado: config.nomeMercado, cnpj: config.cnpj, endereco: config.endereco });
    setShowConfigModal(true);
  };

  const handleGeneratePDF = async () => {
    if (!receiptRef.current) return;
    const element = receiptRef.current;
    const opt = {
      margin: 10,
      filename: `nota_fiscal_${receipt?.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const handleWhatsApp = () => {
    if (!receipt) return;

    const dataVenda = new Date(receipt.dataVenda).toLocaleString();
    
    let text = `🐼 *${config.nomeMercado}*\n`;
    text += `📄 *Pedido #${receipt.id.toString().padStart(6, '0')}*\n`;
    text += `📅 ${dataVenda}\n\n`;

    if (receipt.cliente) {
        text += `👤 *Cliente:* ${receipt.cliente.nome}\n`;
        text += `--------------------------------\n`;
    }

    text += `*ITENS DO PEDIDO:*\n`;
    receipt.itens.forEach(item => {
        text += `▪️ ${item.quantidade}x ${item.produto?.nome}\n`;
        text += `   Valor: ${formatCurrency(item.subtotal)}\n`;
    });
    
    text += `--------------------------------\n`;
    text += `💰 *TOTAL: ${formatCurrency(receipt.total)}*\n`;
    text += `--------------------------------\n\n`;
    
    if (config.cnpj) text += `🏢 CNPJ: ${config.cnpj}\n`;
    if (config.endereco) text += `📍 ${config.endereco}\n`;
    
    text += `\nObrigado pela preferência! 🐼`;

    const encodedText = encodeURIComponent(text);
    
    let whatsappUrl = `https://wa.me/?text=${encodedText}`;
    
    // Se tiver cliente com telefone, direciona para ele
    if (receipt.cliente && receipt.cliente.whatsapp) {
        const phone = receipt.cliente.whatsapp.replace(/\D/g, ''); // Remove tudo que não é número
        if (phone.length >= 10) { // Validação básica
             whatsappUrl = `https://wa.me/55${phone}?text=${encodedText}`;
        }
    }
    
    window.open(whatsappUrl, '_blank');
  };

  const addProductFromList = (produto: Produto, quantidade = 1) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(item => item.produtoId === produto.id);
      if (existingIndex >= 0) {
        return prev.map((item, idx) => {
          if (idx === existingIndex) {
            const novaQtd = item.quantidade + quantidade;
            return { ...item, quantidade: novaQtd, subtotal: novaQtd * (item.produto?.valor || 0) };
          }
          return item;
        });
      }
      return [...prev, { produtoId: produto.id, produto, quantidade, subtotal: quantidade * produto.valor }];
    });
    setShowSearchModal(false);
  };

  const confirmQuantidade = () => {
    if (!qtyProduct) return;
    const qtd = parseInt(qtyValue);
    if (!Number.isFinite(qtd) || qtd <= 0) {
      setError('Quantidade inválida');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Verificar estoque
    const itemNoCarrinho = items.find(i => i.produtoId === qtyProduct.id);
    const qtdAtual = itemNoCarrinho ? itemNoCarrinho.quantidade : 0;

    if (qtdAtual + qtd > qtyProduct.estoque) {
      setError(`Estoque insuficiente! Restam apenas ${qtyProduct.estoque} unidades.`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    addProductFromList(qtyProduct, qtd);
    setShowQtyModal(false);
    setQtyProduct(null);
    setQtyValue('1');
  };



  const handleScan = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!barcode) return;
      setLoading(true);
      setError(null);
      try {
        const produto = await fetchProdutoByCodigo(barcode);
        setBarcode(''); // Limpa o campo imediatamente para evitar disparos duplos
        
        if (produto) {
          promptQuantidade(produto);
        } else {
            // Beep sound here would be nice
          setError('Produto não encontrado');
          setTimeout(() => setError(null), 3000);
        }
      } catch {
        setError('Erro ao buscar produto');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFinish = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const venda = await createVenda(items.map(i => ({ produtoId: i.produtoId, quantidade: i.quantidade })), selectedCliente?.id);
      setReceipt(venda);
      setItems([]);
      setSelectedCliente(null);
    } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao finalizar venda');
    } finally {
        setLoading(false);
    }
  };

  return (
    <>
      {authLoading ? (
        <div style={{height: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'}}>Carregando...</div>
      ) : !token ? (
        <LoginPage />
      ) : (
        <div className="pos-container">
        {/* Header */}
        <div className="header">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🐼 Caixa Panda</h1>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ marginRight: '10px', textAlign: 'right', lineHeight: '1.2' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Bem-vindo,</div>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{user?.nome}</div>
                </div>
                <button className="btn-icon" onClick={openConfigModal} title="Configurações do Mercado">⚙️</button>
                <button className="btn-icon" onClick={() => setShowEstoqueModal(true)} title="Gestão de Estoque (MiniWMS)" style={{ background: '#7c3aed', borderColor: '#7c3aed' }}>🏭</button>
                <button className="btn-icon" onClick={handleGenerateStockPDF} title="Baixar Relatório de Estoque" style={{ background: '#3b82f6', borderColor: '#3b82f6' }}>📦</button>
                <button className="btn-icon" onClick={openReportModal} title="Extrato e Relatórios">📊</button>
                <button className="btn-icon" onClick={() => setShowAddProductModal(true)} title="Cadastrar Novo Produto">➕</button>
                <button className="btn-icon" onClick={openClientesModal} title="Gerenciar Clientes">👥</button>
                <button className="btn-icon" onClick={logout} title="Sair do Sistema" style={{ background: '#ef4444', borderColor: '#ef4444' }}>🚪</button>
                <span className="mobile-hide" style={{ color: 'var(--text-secondary)' }}>{new Date().toLocaleDateString()}</span>
            </div>
        </div>

        {/* Product List */}
        <div className="product-list">
            <div className="table-row table-header">
                <div>Qtd</div>
                <div style={{ textAlign: 'left' }}>Produto</div>
                <div className="mobile-hide">Unit.</div>
                <div>Total</div>
                <div></div>
            </div>
            {items.map((item, idx) => (
                <div key={idx} className="table-row animate-item">
                    <div>{item.quantidade}x</div>
                    <div style={{ textAlign: 'left' }}>{item.produto?.nome}</div>
                    <div className="mobile-hide">{formatCurrency(item.produto?.valor || 0)}</div>
                    <div>{formatCurrency(item.subtotal)}</div>
                    <div>
                        <button 
                            className="danger" 
                            style={{ padding: '0.2rem 0.5rem' }}
                            onClick={() => setItems(items.filter((_, i) => i !== idx))}
                        >
                            X
                        </button>
                    </div>
                </div>
            ))}
            {items.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Nenhum item registrado. Escaneie um produto para começar.
                </div>
            )}
        </div>

        {/* Sidebar */}
        <div className="sidebar">
            <div className="total-display">
                <h3 style={{ color: 'var(--text-secondary)' }}>TOTAL A PAGAR</h3>
                <h1 style={{ fontSize: '3.5rem', color: 'var(--success)', margin: '0.5rem 0' }}>{formatCurrency(total)}</h1>
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                    <span>Itens:</span>
                    <span>{items.length}</span>
                </div>
            </div>
            
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button 
                  className="success" 
                  style={{ padding: '1.5rem', fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}
                  onClick={handleFinish}
                  disabled={items.length === 0 || loading}
                >
                    {loading ? 'Processando...' : 'Finalizar Venda'}
                </button>
                <button 
                    className="secondary" 
                    onClick={() => setItems([])}
                    disabled={items.length === 0}
                >
                    Cancelar
                </button>
            </div>
        </div>

        {/* Scan Input */}
        <div className="input-bar">
            {/* Botão Câmera (Mobile) */}
            <h2 
                style={{ fontSize: '2rem', cursor: 'pointer', userSelect: 'none' }} 
                onClick={() => setShowScanner(true)}
                title="Escanear com a câmera"
            >
                📷
            </h2>
            <h2 
                style={{ fontSize: '2rem', cursor: 'pointer', userSelect: 'none' }} 
                onClick={openSearchModal}
                title="Adicionar por lista"
            >
                🔎
            </h2>
            <input 
                ref={inputRef}
                className="big-input"
                placeholder="Escaneie o código ou use a câmera..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={handleScan}
                autoFocus
                disabled={loading}
            />
        </div>

        {/* Modal: Estoque (MiniWMS) */}
        {showEstoqueModal && <EstoqueModal onClose={() => setShowEstoqueModal(false)} />}

        {/* Modal: Configurações */}
        {showConfigModal && (
            <div className="modal-overlay" onClick={() => setShowConfigModal(false)}>
                <div className="modal" onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h2>⚙️ Configurações do Mercado</h2>
                        <button className="secondary-close" onClick={() => setShowConfigModal(false)}>X</button>
                    </div>
                    <form onSubmit={handleUpdateConfig}>
                        <div className="form-group">
                            <label>Nome do Mercado</label>
                            <input required value={editConfig.nomeMercado} onChange={e => setEditConfig({...editConfig, nomeMercado: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>CNPJ</label>
                            <input required value={editConfig.cnpj} onChange={e => setEditConfig({...editConfig, cnpj: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>Endereço</label>
                            <input value={editConfig.endereco} onChange={e => setEditConfig({...editConfig, endereco: e.target.value})} />
                        </div>
                        <button type="submit" className="success" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}>Salvar Configurações</button>
                    </form>
                </div>
            </div>
        )}

        {/* Modal: Cadastro de Produto */}
        {showAddProductModal && (
            <div className="modal-overlay" onClick={() => setShowAddProductModal(false)} style={{ zIndex: 99999 }}>
                <div className="modal" onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h2>{editingProduct ? '📝 Editar Produto' : '➕ Novo Produto'}</h2>
                        <button className="secondary-close" onClick={() => { setShowAddProductModal(false); setEditingProduct(null); }}>X</button>
                    </div>
                    <form onSubmit={handleCreateProduct}>
                        <div className="form-group">
                            <label>Nome do Produto</label>
                            <input required value={newProd.nome} onChange={e => setNewProd({...newProd, nome: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>Código(s) de Barras (separe por vírgula)</label>
                            <input required value={newProd.codigos} onChange={e => setNewProd({...newProd, codigos: e.target.value})} placeholder="ex: 789123, 789456" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Preço Venda (R$)</label>
                                <input required type="number" step="0.01" value={newProd.valor} onChange={e => setNewProd({...newProd, valor: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Preço Custo (R$)</label>
                                <input type="number" step="0.01" value={newProd.precoCusto} onChange={e => setNewProd({...newProd, precoCusto: e.target.value})} />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                             <div className="form-group">
                                <label>Estoque Atual</label>
                                <input required type="number" value={newProd.estoque} onChange={e => setNewProd({...newProd, estoque: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Estoque Mín.</label>
                                <input type="number" value={newProd.estoqueMinimo} onChange={e => setNewProd({...newProd, estoqueMinimo: e.target.value})} />
                            </div>
                             <div className="form-group">
                                <label>Unidade</label>
                                <input list="unidades" value={newProd.unidade} onChange={e => setNewProd({...newProd, unidade: e.target.value})} placeholder="UN" />
                                <datalist id="unidades">
                                    <option value="UN"/>
                                    <option value="KG"/>
                                    <option value="L"/>
                                    <option value="CX"/>
                                    <option value="PCT"/>
                                </datalist>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                              <div className="form-group">
                                <label>Localização (Corredor/Prat.)</label>
                                <input value={newProd.localizacao} onChange={e => setNewProd({...newProd, localizacao: e.target.value})} placeholder="Ex: C1-P2" />
                            </div>
                              <div className="form-group">
                                <label>Validade (Opcional)</label>
                                <input type="date" value={newProd.dataValidade} onChange={e => setNewProd({...newProd, dataValidade: e.target.value})} />
                            </div>
                        </div>
                        <button type="submit" className="success" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}>
                            {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* Modal: Relatórios e Extrato */}
        {showReportModal && (
            <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
                <div className="modal" style={{ maxWidth: '900px', width: '95%' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                        <h2>📊 Extrato de Vendas</h2>
                        <button className="secondary-close" onClick={() => setShowReportModal(false)}>X</button>
                    </div>

                    {/* Filtros */}
                    <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '1rem', 
                        marginBottom: '2rem', 
                        background: 'rgba(255,255,255,0.03)', 
                        padding: '1.5rem', 
                        borderRadius: '24px', 
                        border: '1px solid var(--border)',
                        alignItems: 'flex-end'
                    }}>
                        <div className="form-group" style={{ marginBottom: 0, flex: '1 1 150px' }}>
                            <label style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.5rem', display: 'block' }}>DATA INÍCIO</label>
                            <input type="date" value={reportDates.inicio} onChange={e => setReportDates({...reportDates, inicio: e.target.value})} style={{ width: '100%' }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0, flex: '1 1 150px' }}>
                            <label style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.5rem', display: 'block' }}>DATA FIM</label>
                            <input type="date" value={reportDates.fim} onChange={e => setReportDates({...reportDates, fim: e.target.value})} style={{ width: '100%' }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0, flex: '2 1 200px' }}>
                            <label style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.5rem', display: 'block' }}>FILTRAR POR PRODUTO</label>
                            <select 
                                value={reportProductId || ''} 
                                onChange={e => setReportProductId(e.target.value ? Number(e.target.value) : null)}
                                style={{ 
                                    background: 'var(--bg-tertiary)', 
                                    border: '1px solid var(--border)', 
                                    borderRadius: '12px', 
                                    padding: '0.75rem', 
                                    color: 'white', 
                                    width: '100%',
                                    outline: 'none'
                                }}
                            >
                                <option value="">Todos os Produtos</option>
                                {allProducts.map(p => (
                                    <option key={p.id} value={p.id}>{p.nome}</option>
                                ))}
                            </select>
                        </div>
                        <button 
                            className="success" 
                            style={{ padding: '0.85rem 2rem', height: '48px', fontWeight: 'bold' }} 
                            onClick={handleFilterReport}
                        >
                            FILTRAR
                        </button>
                        <button 
                            className="secondary"
                            style={{ 
                                padding: '0.85rem 1.5rem', 
                                height: '48px', 
                                background: 'rgba(255,255,255,0.05)', 
                                border: '1px solid var(--border)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontWeight: 'bold'
                            }} 
                            onClick={handleGenerateReportPDF}
                        >
                            <span>📄</span> PDF
                        </button>
                    </div>

                    <div ref={reportRef} style={{ background: 'transparent' }}>
                        {/* Header do Mercado no PDF */}
                        <div className="pdf-only" style={{ textAlign: 'center', marginBottom: '2rem', display: 'none' }}>
                            <h1 style={{ color: '#000' }}>{config.nomeMercado}</h1>
                            <p style={{ color: '#000' }}>CNPJ: {config.cnpj}</p>
                            {config.endereco && (
                                <p style={{ color: '#000' }}>Endereço: {config.endereco}</p>
                            )}
                            <h2 style={{ color: '#000', marginTop: '1rem' }}>EXTRATO DE VENDAS</h2>
                            <p style={{ color: '#000' }}>Produto: {reportProductId ? allProducts.find(p => p.id === reportProductId)?.nome : 'Todos'}</p>
                            <p style={{ color: '#000' }}>Período: {new Date(reportDates.inicio).toLocaleDateString()} - {new Date(reportDates.fim).toLocaleDateString()}</p>
                            <hr style={{ border: '1px solid #eee', margin: '1rem 0' }} />
                        </div>

                        {/* Resumo */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div style={{ 
                                background: 'linear-gradient(135deg, var(--accent-soft) 0%, rgba(16, 185, 129, 0.05) 100%)', 
                                padding: '1.5rem', 
                                borderRadius: '24px', 
                                border: '1px solid var(--accent)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1.5rem'
                            }}>
                                <div style={{ fontSize: '2.5rem', opacity: 0.8 }}>💰</div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>Volume Total</span>
                                    <h2 style={{ margin: 0, color: 'var(--accent)', fontSize: '2rem' }}>{formatCurrency(vendasHistory.reduce((acc, v) => acc + v.total, 0))}</h2>
                                </div>
                            </div>
                            <div style={{ 
                                background: 'rgba(255,255,255,0.03)', 
                                padding: '1.5rem', 
                                borderRadius: '24px', 
                                border: '1px solid var(--border)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1.5rem'
                            }}>
                                <div style={{ fontSize: '2.5rem', opacity: 0.8 }}>🧾</div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>Total de Vendas</span>
                                    <h2 style={{ margin: 0, fontSize: '2rem' }}>{vendasHistory.length}</h2>
                                </div>
                            </div>
                        </div>

                        {/* Lista de Vendas */}
                        <div className="report-list-container" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {vendasHistory.map(venda => (
                                <div key={venda.id} className="history-item" style={{ cursor: 'pointer' }} onClick={() => setExpandedVenda(expandedVenda === venda.id ? null : venda.id)}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Venda #{venda.id}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                {new Date(venda.dataVenda).toLocaleString()} • {venda.itens?.length} itens
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.2rem' }}>{formatCurrency(venda.total)}</div>
                                            <div style={{ fontSize: '0.7rem' }}>{expandedVenda === venda.id ? '🔼 Ocultar' : '🔽 Detalhes'}</div>
                                        </div>
                                    </div>
                                    
                                    {(expandedVenda === venda.id || expandedVenda === -1) && (
                                        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', animation: 'slideUp 0.3s ease' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                                <div>PRODUTO</div>
                                                <div style={{ textAlign: 'center' }}>QTD</div>
                                                <div style={{ textAlign: 'right' }}>SUBTOTAL</div>
                                            </div>
                                            {venda.itens?.map((item, i) => (
                                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', fontSize: '0.85rem', padding: '0.4rem 0' }}>
                                                    <div>{item.produto?.nome}</div>
                                                    <div style={{ textAlign: 'center' }}>{item.quantidade}x</div>
                                                    <div style={{ textAlign: 'right' }}>{formatCurrency(item.subtotal)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    {vendasHistory.length === 0 && !loading && (
                            <div style={{ 
                                padding: '4rem', 
                                textAlign: 'center', 
                                color: 'var(--text-secondary)',
                                background: 'rgba(255,255,255,0.01)',
                                borderRadius: '32px',
                                border: '1px dashed var(--border)',
                                marginTop: '1rem'
                            }}>
                                <div style={{ fontSize: '4rem', marginBottom: '1.5rem', filter: 'grayscale(1)' }}>🔎</div>
                                <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Nenhuma venda encontrada</h3>
                                <p style={{ fontSize: '0.9rem', maxWidth: '300px', margin: '0 auto' }}>Ajuste os filtros de data ou produto para visualizar outros resultados.</p>
                            </div>
                        )}
                </div>
            </div>
        )}

        {/* Product Search Modal (Lupa) */}
        {showSearchModal && (
            <ProductSearchModal 
                allProducts={allProducts}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onClose={() => setShowSearchModal(false)}
                onSelect={promptQuantidade}
                onEdit={startEditProduct}
                onDelete={handleDeleteProduct}
            />
        )}

        {/* Receipt Modal */}
        {receipt && (
            <div className="modal-overlay" onClick={() => setReceipt(null)}>
                <div className="modal" onClick={e => e.stopPropagation()}>
                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <h2>✅ Venda Concluída</h2>
                        <p style={{ color: 'var(--success)' }}>Sucesso</p>
                    </div>
                    
                    <div ref={receiptRef} style={{ background: '#fff', color: '#000', padding: '1.5rem', borderRadius: '4px', fontFamily: 'monospace' }}>
                        <h3 style={{ textAlign: 'center', color: '#000', textTransform: 'uppercase' }}>{config.nomeMercado}</h3>
                        <p style={{ textAlign: 'center', fontSize: '0.8rem' }}>CNPJ: {config.cnpj}</p>
                        {config.endereco && (
                            <p style={{ textAlign: 'center', fontSize: '0.75rem' }}>Endereço: {config.endereco}</p>
                        )}
                        <hr style={{ borderTop: '1px dashed #000', margin: '0.5rem 0' }} />
                        <p>CUPOM #000{receipt.id}</p>
                        <p>{new Date(receipt.dataVenda).toLocaleString()}</p>
                        {receipt.cliente && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                <hr style={{ borderTop: '1px dashed #000', margin: '0.5rem 0' }} />
                                <p>CLIENTE: {receipt.cliente.nome}</p>
                                {receipt.cliente.whatsapp && <p>WHATSAPP: {receipt.cliente.whatsapp}</p>}
                            </div>
                        )}
                        <hr style={{ borderTop: '1px dashed #000', margin: '0.5rem 0' }} />
                        
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {receipt.itens && receipt.itens.map((item: ItemVenda, idx: number) => (
                                 <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{item.quantidade}x {item.produto?.nome?.substring(0, 20)}</span>
                                    <span>{item.subtotal.toFixed(2)}</span>
                                 </div>
                            ))}
                        </div>
                        
                        <hr style={{ borderTop: '1px dashed #000', margin: '0.5rem 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                            <span>TOTAL</span>
                            <span>R$ {receipt.total.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                        <button style={{ flex: 1 }} onClick={handleGeneratePDF}>📄 Salvar PDF</button>
                        <button style={{ flex: 1, background: '#25D366', color: '#fff' }} onClick={handleWhatsApp}>📱 WhatsApp</button>
                    </div>
                    <button style={{ width: '100%', marginTop: '0.5rem' }} className="secondary" onClick={() => setReceipt(null)}>Fechar</button>
                </div>
            </div>
        )}

        {/* Clientes Management Modal */}
        {showClientesModal && (
            <div className="modal-overlay" onClick={() => setShowClientesModal(false)}>
                <div className="modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2>👥 Gestão de Clientes</h2>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="success" onClick={() => { setEditingCliente(null); setNewCliente({ nome: '', whatsapp: '', email: '' }); setShowAddClienteModal(true); }}>➕ Novo Cliente</button>
                            <button className="secondary-close" onClick={() => setShowClientesModal(false)}>X</button>
                        </div>
                    </div>

                    <input 
                        className="big-input"
                        placeholder="Pesquisar cliente por nome ou celular..."
                        value={clienteSearchTerm}
                        onChange={e => setClienteSearchTerm(e.target.value)}
                        style={{ fontSize: '1rem', padding: '0.75rem', marginBottom: '1rem' }}
                    />

                    <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '24px' }}>
                        {allClientes.map(cliente => (
                            <div key={cliente.id} className="table-row animate-item" style={{ gridTemplateColumns: '1fr 1fr 1fr auto' }}>
                                <div style={{ fontWeight: 'bold', textAlign: 'left' }}>{cliente.nome}</div>
                                <div style={{ color: 'var(--text-secondary)' }}>{cliente.whatsapp || '-'}</div>
                                <div style={{ color: 'var(--text-secondary)' }}>{cliente.email || '-'}</div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="success" style={{ padding: '0.4rem 0.8rem' }} onClick={() => { setSelectedCliente(cliente); setShowClientesModal(false); }}>Selecionar</button>
                                    <button className="secondary" style={{ padding: '0.4rem', fontSize: '1.2rem' }} onClick={() => startEditCliente(cliente)}>✏️</button>
                                    <button className="danger" style={{ padding: '0.4rem', fontSize: '1.2rem' }} onClick={() => handleDeleteCliente(cliente.id)}>🗑️</button>
                                </div>
                            </div>
                        ))}
                        {allClientes.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Nenhum cliente encontrado.</div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Add/Edit Cliente Modal */}
        {showAddClienteModal && (
            <div className="modal-overlay" onClick={() => setShowAddClienteModal(false)}>
                <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h2>{editingCliente ? '✏️ Editar Cliente' : '➕ Cadastro de Cliente'}</h2>
                        <button className="secondary-close" onClick={() => setShowAddClienteModal(false)}>X</button>
                    </div>
                    <form onSubmit={handleSaveCliente}>
                        <div className="form-group">
                            <label>Nome Completo</label>
                            <input required value={newCliente.nome} onChange={e => setNewCliente({...newCliente, nome: e.target.value})} placeholder="Nome do cliente" />
                        </div>
                        <div className="form-group">
                            <label>WhatsApp</label>
                            <input value={newCliente.whatsapp} onChange={e => setNewCliente({...newCliente, whatsapp: e.target.value})} placeholder="(00) 00000-0000" />
                        </div>
                        <div className="form-group">
                            <label>E-mail</label>
                            <input type="email" value={newCliente.email} onChange={e => setNewCliente({...newCliente, email: e.target.value})} placeholder="email@exemplo.com" />
                        </div>
                        <button type="submit" className="success" style={{ width: '100%', padding: '1rem', marginTop: '1rem' }}>
                            {editingCliente ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* Camera Scanner Modal */}
        {showScanner && (
            <div className="modal-overlay" onClick={() => setShowScanner(false)}>
                <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h2>📷 Escanear Produto</h2>
                        <button className="secondary-close" onClick={() => setShowScanner(false)}>X</button>
                    </div>
                    <div id="reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }}></div>
                    <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-secondary)' }}>
                        Aponte a câmera para o código de barras
                    </p>
                </div>
            </div>
        )}

        {/* Quantidade Modal */}
        {showQtyModal && qtyProduct && (
            <div className="modal-overlay" onClick={() => setShowQtyModal(false)}>
                <div className="modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h2>Quantidade</h2>
                        <button className="secondary-close" onClick={() => setShowQtyModal(false)}>X</button>
                    </div>
                    <div style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                        Produto: <strong style={{ color: 'var(--text-primary)' }}>{qtyProduct.nome}</strong>
                    </div>
                    <input
                        className="big-input"
                        type="number"
                        min="1"
                        value={qtyValue}
                        onChange={(e) => setQtyValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                confirmQuantidade();
                            }
                        }}
                        autoFocus
                    />
                    <button className="success" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }} onClick={confirmQuantidade}>
                        Adicionar
                    </button>
                </div>
            </div>
        )}

        <style dangerouslySetInnerHTML={{ __html: `
            .sidebar .btn-icon { font-size: 1.5rem !important; }
        `}} />

        {/* Floating Error */}
        {error && (
            <div style={{ 
                position: 'fixed', top: '20px', right: '20px', 
                background: 'rgba(239, 68, 68, 0.9)', color: '#fff', 
                padding: '1rem 2rem', borderRadius: '8px',
                fontWeight: 'bold', animation: 'fadeIn 0.3s',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                zIndex: 9999
            }}>
                ⚠️ {error}
            </div>
        )}
        </div>
      )}
    </>
  );
}

export default App;

