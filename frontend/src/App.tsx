import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
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
    updateConfig
} from './api';
import type { ItemVenda, Venda, Produto, Configuracao } from './types';

// Declaração para o html2pdf
declare var html2pdf: any;

function App() {
  const [items, setItems] = useState<ItemVenda[]>([]);
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<Venda | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [reportDates, setReportDates] = useState({ inicio: new Date().toISOString().split('T')[0], fim: new Date().toISOString().split('T')[0] });
  const [expandedVenda, setExpandedVenda] = useState<number | null>(null);
  
  const [allProducts, setAllProducts] = useState<Produto[]>([]);
  const [vendasHistory, setVendasHistory] = useState<Venda[]>([]);
  const [config, setConfig] = useState<Configuracao>({ id: 1, nomeMercado: 'Panda Market', cnpj: '00.000.000/0001-00' });
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Novo estado para formulário de produto
  const [newProd, setNewProd] = useState({ nome: '', codigos: '', valor: '', estoque: '' });
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [editConfig, setEditConfig] = useState({ nomeMercado: '', cnpj: '' });
  const reportRef = useRef<HTMLDivElement>(null);

  const total = items.reduce((acc, item) => acc + item.subtotal, 0);

  useEffect(() => {
    // Carregar configurações iniciais
    fetchConfig().then(setConfig).catch(console.error);
  }, []);

  useEffect(() => {
    // Focar no input sempre que o recibo ou modal forem fechados
    if (!receipt && !loading && !showSearchModal && !showReportModal && !showAddProductModal && !showConfigModal) {
      inputRef.current?.focus();
    }
  }, [receipt, loading, showSearchModal, showReportModal, showAddProductModal, showConfigModal]);

  const openSearchModal = async () => {
    setLoading(true);
    try {
      const prods = await fetchProdutos();
      setAllProducts(prods);
      setShowSearchModal(true);
      setSearchTerm('');
    } catch (err) {
      setError('Erro ao carregar lista de produtos');
    } finally {
      setLoading(false);
    }
  };

  const openReportModal = async () => {
    setLoading(true);
    try {
      const history = await fetchVendas(reportDates.inicio, reportDates.fim);
      setVendasHistory(history);
      setShowReportModal(true);
    } catch (err) {
      setError('Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterReport = async () => {
    setLoading(true);
    try {
      const history = await fetchVendas(reportDates.inicio, reportDates.fim);
      setVendasHistory(history);
    } catch (err) {
      setError('Erro ao filtrar relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReportPDF = async () => {
    if (!reportRef.current) return;
    setLoading(true);
    try {
      const element = reportRef.current;
      const opt = {
        margin: 10,
        filename: `extrato_vendas_${reportDates.inicio}_a_${reportDates.fim}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Clonar e ajustar temporariamente para o PDF (preto no branco)
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.background = '#ffffff';
      clone.style.color = '#000000';
      clone.style.padding = '20px';
      clone.style.width = '1000px'; // Forçar largura para renderização boa
      
      // Ajustar cores de textos internos no clone
      clone.querySelectorAll('*').forEach((el: any) => {
        el.style.color = '#000000';
        el.style.borderColor = '#dddddd';
        if (el.classList.contains('history-item')) {
           el.style.backgroundColor = '#f9f9f9';
        }
      });

      await html2pdf().set(opt).from(clone).save();
    } catch (err) {
      setError('Erro ao gerar PDF do extrato');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        nome: newProd.nome,
        codigos: newProd.codigos.split(',').map(c => c.trim()).filter(c => c),
        valor: parseFloat(newProd.valor),
        estoque: parseInt(newProd.estoque)
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
      setNewProd({ nome: '', codigos: '', valor: '', estoque: '' });
      setTimeout(() => setError(null), 3000);
      
      // Refresh list if search modal is open
      if (showSearchModal) {
        const prods = await fetchProdutos();
        setAllProducts(prods);
      }
    } catch (err: any) {
      setError(err.message);
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
    } catch (err: any) {
      setError(err.message);
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
      estoque: p.estoque.toString()
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
    } catch (err) {
      setError('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const openConfigModal = () => {
    setEditConfig({ nomeMercado: config.nomeMercado, cnpj: config.cnpj });
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
    const text = `*${config.nomeMercado} - NOTA FISCAL #${receipt.id}*\n\n` +
      receipt.itens.map(i => `${i.quantidade}x ${i.produto?.nome} - ${formatCurrency(i.subtotal)}`).join('\n') +
      `\n\n*TOTAL: ${formatCurrency(receipt.total)}*\n` +
      `CNPJ: ${config.cnpj}\nData: ${new Date(receipt.dataVenda).toLocaleString()}`;
    
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const addProductFromList = (produto: Produto) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(item => item.produtoId === produto.id);
      if (existingIndex >= 0) {
        return prev.map((item, idx) => {
          if (idx === existingIndex) {
            const novaQtd = item.quantidade + 1;
            return { ...item, quantidade: novaQtd, subtotal: novaQtd * (item.produto?.valor || 0) };
          }
          return item;
        });
      }
      return [...prev, { produtoId: produto.id, produto, quantidade: 1, subtotal: produto.valor }];
    });
    setShowSearchModal(false);
  };

  const filteredProducts = allProducts.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.codigos?.some(c => c.codigo.includes(searchTerm))
  );

  const handleScan = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!barcode) return;
      setLoading(true);
      setError(null);
      try {
        const produto = await fetchProdutoByCodigo(barcode);
        setBarcode(''); // Limpa o campo imediatamente para evitar disparos duplos
        
        if (produto) {
          addProductFromList(produto);
        } else {
            // Beep sound here would be nice
          setError('Produto não encontrado');
          setTimeout(() => setError(null), 3000);
        }
      } catch (err) {
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
      const venda = await createVenda(items.map(i => ({ produtoId: i.produtoId, quantidade: i.quantidade })));
      setReceipt(venda);
      setItems([]);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="pos-container">
        {/* Header */}
        <div className="header">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🐼 Caixa Panda</h1>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button className="btn-icon" onClick={openConfigModal} title="Configurações do Mercado">⚙️</button>
                <button className="btn-icon" onClick={openReportModal} title="Extrato e Relatórios">📊</button>
                <button className="btn-icon" onClick={() => setShowAddProductModal(true)} title="Cadastrar Novo Produto">➕</button>
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
                placeholder="Escaneie o código ou clique na lupa..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={handleScan}
                autoFocus
                disabled={loading}
            />
        </div>

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
                        <button type="submit" className="success" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}>Salvar Configurações</button>
                    </form>
                </div>
            </div>
        )}

        {/* Modal: Cadastro de Produto */}
        {showAddProductModal && (
            <div className="modal-overlay" onClick={() => setShowAddProductModal(false)}>
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
                                <label>Preço (R$)</label>
                                <input required type="number" step="0.01" value={newProd.valor} onChange={e => setNewProd({...newProd, valor: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Estoque</label>
                                <input required type="number" value={newProd.estoque} onChange={e => setNewProd({...newProd, estoque: e.target.value})} />
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '24px', border: '1px solid var(--border)', alignItems: 'center' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Data Início</label>
                            <input type="date" value={reportDates.inicio} onChange={e => setReportDates({...reportDates, inicio: e.target.value})} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Data Fim</label>
                            <input type="date" value={reportDates.fim} onChange={e => setReportDates({...reportDates, fim: e.target.value})} />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignSelf: 'end' }}>
                          <button className="success" style={{ flex: 1, padding: '1rem' }} onClick={handleFilterReport}>Filtrar</button>
                          <button style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }} onClick={handleGenerateReportPDF}>📄 PDF</button>
                        </div>
                    </div>

                    <div ref={reportRef} style={{ background: 'transparent' }}>
                        {/* Header do Mercado no PDF */}
                        <div className="pdf-only" style={{ textAlign: 'center', marginBottom: '2rem', display: 'none' }}>
                            <h1 style={{ color: '#000' }}>{config.nomeMercado}</h1>
                            <p style={{ color: '#000' }}>CNPJ: {config.cnpj}</p>
                            <h2 style={{ color: '#000', marginTop: '1rem' }}>EXTRATO DE VENDAS</h2>
                            <p style={{ color: '#000' }}>Período: {new Date(reportDates.inicio).toLocaleDateString()} - {new Date(reportDates.fim).toLocaleDateString()}</p>
                            <hr style={{ border: '1px solid #eee', margin: '1rem 0' }} />
                        </div>

                        {/* Resumo */}
                        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                            <div style={{ flex: 1, background: 'var(--accent-soft)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--accent)' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Volume Total</span>
                                <h2 style={{ margin: 0, color: 'var(--accent)' }}>{formatCurrency(vendasHistory.reduce((acc, v) => acc + v.total, 0))}</h2>
                            </div>
                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border)' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Vendas</span>
                                <h2 style={{ margin: 0 }}>{vendasHistory.length}</h2>
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
                                    
                                    {expandedVenda === venda.id && (
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
                    {vendasHistory.length === 0 && (
                            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                                Nenhuma venda encontrada para este período.
                            </div>
                        )}
                </div>
            </div>
        )}

        {/* Product Search Modal (Lupa) */}
        {showSearchModal && (
            <div className="modal-overlay" onClick={() => setShowSearchModal(false)}>
                <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2>📦 Buscar Produto</h2>
                        <button className="secondary-close" onClick={() => setShowSearchModal(false)}>X</button>
                    </div>

                    <input 
                        className="big-input" 
                        style={{ fontSize: '1rem', padding: '0.75rem' }}
                        placeholder="Filtrar por nome ou código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />

                    <div style={{ marginTop: '1rem', maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '24px' }}>
                        {filteredProducts.map(produto => (
                            <div 
                                key={produto.id} 
                                className="table-row animate-item" 
                                style={{ gridTemplateColumns: '1fr 1fr 1fr auto', cursor: 'default' }}
                            >
                                <div style={{ textAlign: 'left', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => addProductFromList(produto)}>{produto.nome}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                    {produto.codigos?.map(c => c.codigo).join(', ')}
                                </div>
                                <div style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{formatCurrency(produto.valor)}</div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="secondary" style={{ padding: '0.4rem', fontSize: '1rem' }} onClick={() => startEditProduct(produto)}>✏️</button>
                                    <button className="danger" style={{ padding: '0.4rem', fontSize: '1rem' }} onClick={() => handleDeleteProduct(produto.id)}>🗑️</button>
                                </div>
                            </div>
                        ))}
                        {filteredProducts.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                Nenhum produto encontrado.
                            </div>
                        )}
                    </div>
                </div>
            </div>
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
                        <hr style={{ borderTop: '1px dashed #000', margin: '0.5rem 0' }} />
                        <p>CUPOM #000{receipt.id}</p>
                        <p>{new Date(receipt.dataVenda).toLocaleString()}</p>
                        <hr style={{ borderTop: '1px dashed #000', margin: '0.5rem 0' }} />
                        
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {receipt.itens && receipt.itens.map((item: any, idx: number) => (
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

        {/* Floating Error */}
        {error && (
            <div style={{ 
                position: 'fixed', top: '20px', right: '20px', 
                background: 'rgba(239, 68, 68, 0.9)', color: '#fff', 
                padding: '1rem 2rem', borderRadius: '8px',
                fontWeight: 'bold', animation: 'fadeIn 0.3s',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                zIndex: 200
            }}>
                ⚠️ {error}
            </div>
        )}
    </div>
  );
}

export default App;
