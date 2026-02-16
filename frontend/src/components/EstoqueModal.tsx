
import React, { useState, useEffect } from 'react';
import type { Produto } from '../types';
import { fetchProdutos, movimentarEstoque, corrigirEstoque as apiCorrigirEstoque, fetchHistoricoMovimentacao, fetchDashboardStats, fetchSugestaoCompra } from '../api';

interface EstoqueModalProps {
    onClose: () => void;
}

export const EstoqueModal: React.FC<EstoqueModalProps> = ({ onClose }) => {
    const [view, setView] = useState<'LIST' | 'MOVIMENTO' | 'HISTORY' | 'DASHBOARD'>('LIST');
    const [products, setProducts] = useState<Produto[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);
    
    // Dashboard Data
    const [stats, setStats] = useState<any>(null);
    const [sugestaoCompra, setSugestaoCompra] = useState<any[]>([]);

    // Form data
    const [tipoMovimento, setTipoMovimento] = useState<'ENTRADA' | 'SAIDA' | 'AJUSTE'>('ENTRADA');
    const [quantidade, setQuantidade] = useState('');
    const [motivo, setMotivo] = useState('');
    const [novoEstoque, setNovoEstoque] = useState('');

    const [history, setHistory] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (view === 'LIST') {
            const timer = setTimeout(() => {
                loadProducts();
            }, 300);
            return () => clearTimeout(timer);
        } else if (view === 'DASHBOARD') {
            loadDashboard();
        }
    }, [searchTerm, view]);

    const loadProducts = async () => {
        try {
            const data = await fetchProdutos(searchTerm);
            setProducts(data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const [statsData, sugestaoData] = await Promise.all([
                fetchDashboardStats(),
                fetchSugestaoCompra()
            ]);
            setStats(statsData);
            setSugestaoCompra(sugestaoData);
        } catch (err) {
            console.error(err);
            setError('Erro ao carregar dashboard');
        } finally {
            setLoading(false);
        }
    };

    // ... (rest of styles or helper vars)
    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const handleSelectProduct = (prod: Produto) => {
        // ... (existing)
        setSelectedProduct(prod);
        setView('MOVIMENTO');
        setTipoMovimento('ENTRADA');
        setQuantidade('');
        setNovoEstoque(prod.estoque.toString());
        setMotivo('');
        setError(null);
        setSuccess(null);
    };

    // ... (existing handlers)

    const handleViewHistory = async (prod: Produto) => {
        setSelectedProduct(prod);
        setLoading(true);
        try {
            const data = await fetchHistoricoMovimentacao(prod.id);
            setHistory(data);
            setView('HISTORY');
        } catch (err) {
            setError('Erro ao carregar histórico');
        } finally {
            setLoading(false);
        }
    };

     const handleSubmitMovimentacao = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (tipoMovimento === 'AJUSTE') {
                const novo = parseInt(novoEstoque);
                if (isNaN(novo)) throw new Error('Novo estoque inválido');
                await apiCorrigirEstoque({
                    produtoId: selectedProduct.id,
                    novoEstoque: novo,
                    motivo: motivo || 'Ajuste Manual'
                });
                setSuccess('Estoque corrigido com sucesso!');
            } else {
                const qtd = parseInt(quantidade);
                if (isNaN(qtd) || qtd <= 0) throw new Error('Quantidade inválida');
                await movimentarEstoque({
                    produtoId: selectedProduct.id,
                    tipo: tipoMovimento,
                    quantidade: qtd,
                    motivo: motivo || (tipoMovimento === 'ENTRADA' ? 'Entrada Manual' : 'Baixa Manual')
                });
                setSuccess('Movimentação registrada com sucesso!');
            }
            
            // Go back to list or refresh
            // For now, refresh list and maybe go back if needed, or stay
            
            // Clear form
            setQuantidade('');
            setMotivo('');
            
        } catch (err: any) {
             setError(err.message || 'Erro ao processar');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString();
    };


    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
            <div className="modal" style={{ width: '1000px', maxWidth: '98%', height: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', alignItems: 'center' }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                        <h2 style={{margin: 0}}>🏭 Gestão de Estoque (WMS)</h2>
                        <div style={{display: 'flex', background: '#eee', borderRadius: '8px', padding: '4px'}}>
                            <button 
                                onClick={() => setView('LIST')}
                                style={{
                                    border: 'none', 
                                    background: view === 'LIST' ? 'white' : 'transparent',
                                    boxShadow: view === 'LIST' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    fontWeight: view === 'LIST' ? 'bold' : 'normal',
                                    cursor: 'pointer'
                                }}
                            >
                                Lista de Produtos
                            </button>
                            <button 
                                onClick={() => setView('DASHBOARD')}
                                style={{
                                    border: 'none', 
                                    background: view === 'DASHBOARD' ? 'white' : 'transparent',
                                    boxShadow: view === 'DASHBOARD' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    fontWeight: view === 'DASHBOARD' ? 'bold' : 'normal',
                                    cursor: 'pointer'
                                }}
                            >
                                Dashboard & Compras 📊
                            </button>
                        </div>
                    </div>
                    <button className="secondary-close" onClick={onClose}>X</button>
                </div>

                {error && <div className="error-banner" style={{background: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '4px', marginBottom: '10px'}}>{error}</div>}
                {success && <div className="success-banner" style={{background: '#dcfce7', color: '#16a34a', padding: '10px', borderRadius: '4px', marginBottom: '10px'}}>{success}</div>}

                {view === 'DASHBOARD' && stats && (
                    <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                        {/* KPI Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                            <div style={{ background: '#f0f9ff', padding: '20px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                                <div style={{ fontSize: '0.9rem', color: '#0369a1', marginBottom: '5px' }}>Total em Estoque (Custo)</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#0c4a6e' }}>{formatMoney(stats.valorTotalCusto)}</div>
                            </div>
                            <div style={{ background: '#ecfdf5', padding: '20px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                                <div style={{ fontSize: '0.9rem', color: '#15803d', marginBottom: '5px' }}>Total Valor Venda</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#14532d' }}>{formatMoney(stats.valorTotalVenda)}</div>
                            </div>
                            <div style={{ background: '#fffbeb', padding: '20px', borderRadius: '12px', border: '1px solid #fde68a' }}>
                                <div style={{ fontSize: '0.9rem', color: '#b45309', marginBottom: '5px' }}>Lucro Projetado</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#78350f' }}>{formatMoney(stats.lucroProjetado)}</div>
                                <div style={{ fontSize: '0.8rem', color: '#92400e' }}>Margem Média: {stats.margemMedia.toFixed(1)}%</div>
                            </div>
                            <div style={{ background: stats.itensBaixoEstoque > 0 ? '#fef2f2' : '#f9fafb', padding: '20px', borderRadius: '12px', border: stats.itensBaixoEstoque > 0 ? '1px solid #fecaca' : '1px solid #e5e7eb' }}>
                                <div style={{ fontSize: '0.9rem', color: stats.itensBaixoEstoque > 0 ? '#b91c1c' : '#374151', marginBottom: '5px' }}>Itens Baixo Estoque</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: stats.itensBaixoEstoque > 0 ? '#ef4444' : '#111827' }}>{stats.itensBaixoEstoque}</div>
                            </div>
                        </div>

                        <h3>📝 Sugestão de Compras (Reposição)</h3>
                        <div className="product-list-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                             <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{position: 'sticky', top: 0, background: 'white'}}>
                                    <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                                        <th style={{ padding: '10px' }}>Produto</th>
                                        <th style={{ padding: '10px' }}>Fornecedor/Local</th>
                                        <th style={{ padding: '10px', textAlign: 'center' }}>Estoque Atual</th>
                                        <th style={{ padding: '10px', textAlign: 'center' }}>Mínimo</th>
                                        <th style={{ padding: '10px', textAlign: 'center' }}>Sugestão Compra</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>Custo Est.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sugestaoCompra.map((p: any) => (
                                        <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '10px' }}>
                                                <strong>{p.nome}</strong><br/>
                                                <small style={{color:'#666'}}>{p.codigos?.[0]?.codigo || '-'}</small>
                                            </td>
                                            <td style={{ padding: '10px', color: '#666' }}>{p.localizacao || '-'}</td>
                                            <td style={{ padding: '10px', textAlign: 'center', color: '#dc2626', fontWeight: 'bold' }}>{p.estoque}</td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>{p.estoqueMinimo}</td>
                                            <td style={{ padding: '10px', textAlign: 'center', background: '#e0f2fe', fontWeight: 'bold', color: '#0284c7' }}>
                                                {p.sugestaoReposicao} {p.unidade}
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'right' }}>
                                                {formatMoney(p.sugestaoReposicao * (p.precoCusto || 0))}
                                            </td>
                                        </tr>
                                    ))}
                                    {sugestaoCompra.length === 0 && (
                                        <tr><td colSpan={6} style={{padding: '30px', textAlign: 'center', color: '#666'}}>✅ Nenhum produto precisa de reposição no momento.</td></tr>
                                    )}
                                </tbody>
                             </table>
                        </div>
                         <div style={{marginTop: '20px', textAlign: 'right'}}>
                            <button className="primary" onClick={() => window.print()}>🖨️ Imprimir Lista</button>
                        </div>
                    </div>
                )}

                {view === 'LIST' && (
                    <>
                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <input 
                                className="big-input" 
                                placeholder="Buscar produto por nome ou código..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="product-list-container" style={{ flex: 1, overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{position: 'sticky', top: 0, background: 'white'}}>
                                    <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                                        <th style={{ padding: '10px' }}>Produto</th>
                                        <th style={{ padding: '10px' }}>Estoque Atual</th>
                                        <th style={{ padding: '10px', textAlign: 'center' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(p => {
                                        const isLowStock = p.estoque <= (p.estoqueMinimo || 5);
                                        return (
                                        <tr key={p.id} style={{ borderBottom: '1px solid #eee', background: isLowStock ? '#fff1f2' : 'transparent' }}>
                                            <td style={{ padding: '10px' }}>
                                                <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                                                    <strong>{p.nome}</strong>
                                                    {isLowStock && <span title="Estoque Baixo!" style={{fontSize: '12px'}}>⚠️</span>}
                                                </div>
                                                <small style={{color:'#666'}}>{p.codigos?.map(c => c.codigo).join(', ')}</small>
                                                <div style={{fontSize: '0.8rem', color: '#888'}}>
                                                    Local: {p.localizacao || '-'} | Mín: {p.estoqueMinimo || 5} | {p.unidade || 'UN'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isLowStock ? '#dc2626' : 'inherit' }}>
                                                    {p.estoque} <span style={{fontSize: '0.9rem', fontWeight: 'normal'}}>{p.unidade || 'UN'}</span>
                                                </div>
                                                <div style={{fontSize: '0.8rem', color: '#666'}}>
                                                    Custo: R$ {p.precoCusto?.toFixed(2) || '0.00'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '10px', display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                <button className="secondary" onClick={() => handleSelectProduct(p)}>Movimentar</button>
                                                <button className="secondary" onClick={() => handleViewHistory(p)}>Histórico</button>
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {view === 'MOVIMENTO' && selectedProduct && (
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <button className="secondary" onClick={() => setView('LIST')} style={{ marginBottom: '1rem' }}>← Voltar para Lista</button>
                        
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
                            <h3 style={{marginTop: 0}}>{selectedProduct.nome}</h3>
                            <p>Estoque Atual: <strong>{selectedProduct.estoque}</strong></p>
                            
                            <div style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
                                <button 
                                    onClick={() => setTipoMovimento('ENTRADA')}
                                    style={{ flex: 1, padding: '10px', background: tipoMovimento === 'ENTRADA' ? '#22c55e' : '#eee', color: tipoMovimento === 'ENTRADA' ? 'white' : 'black', border: 'none', borderRadius: '4px' }}
                                >
                                    ENTRADA (Compra)
                                </button>
                                <button 
                                    onClick={() => setTipoMovimento('SAIDA')}
                                    style={{ flex: 1, padding: '10px', background: tipoMovimento === 'SAIDA' ? '#ef4444' : '#eee', color: tipoMovimento === 'SAIDA' ? 'white' : 'black', border: 'none', borderRadius: '4px' }}
                                >
                                    SAÍDA (Baixa/Perda)
                                </button>
                                <button 
                                    onClick={() => setTipoMovimento('AJUSTE')}
                                    style={{ flex: 1, padding: '10px', background: tipoMovimento === 'AJUSTE' ? '#3b82f6' : '#eee', color: tipoMovimento === 'AJUSTE' ? 'white' : 'black', border: 'none', borderRadius: '4px' }}
                                >
                                    CORREÇÃO (Inventário)
                                </button>
                            </div>

                            <form onSubmit={handleSubmitMovimentacao}>
                                {tipoMovimento === 'AJUSTE' ? (
                                    <div className="form-group">
                                        <label>Novo Valor do Estoque (Absoluto)</label>
                                        <input 
                                            type="number" 
                                            required 
                                            value={novoEstoque} 
                                            onChange={e => setNovoEstoque(e.target.value)}
                                            style={{ fontSize: '1.5rem', padding: '10px' }}
                                        />
                                        <small>O sistema calculará a diferença automaticamente.</small>
                                    </div>
                                ) : (
                                    <div className="form-group">
                                        <label>Quantidade a {tipoMovimento === 'ENTRADA' ? 'Adicionar' : 'Remover'}</label>
                                        <input 
                                            type="number" 
                                            required 
                                            min="1"
                                            value={quantidade} 
                                            onChange={e => setQuantidade(e.target.value)}
                                            style={{ fontSize: '1.5rem', padding: '10px' }}
                                        />
                                    </div>
                                )}

                                <div className="form-group" style={{ marginTop: '15px' }}>
                                    <label>Motivo / Observação</label>
                                    <input 
                                        value={motivo} 
                                        onChange={e => setMotivo(e.target.value)}
                                        placeholder={tipoMovimento === 'ENTRADA' ? 'Ex: Compra NF 123' : 'Ex: Produto Vencido'}
                                    />
                                </div>

                                <button type="submit" className="success" style={{ width: '100%', padding: '15px', marginTop: '20px', fontSize: '1.1rem' }} disabled={loading}>
                                    {loading ? 'Salvando...' : 'CONFIRMAR MOVIMENTAÇÃO'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {view === 'HISTORY' && selectedProduct && (
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                         <button className="secondary" onClick={() => setView('LIST')} style={{ marginBottom: '1rem' }}>← Voltar para Lista</button>
                         <h3>Histórico: {selectedProduct.nome}</h3>
                         
                         <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                                    <th style={{ padding: '8px' }}>Data</th>
                                    <th style={{ padding: '8px' }}>Tipo</th>
                                    <th style={{ padding: '8px' }}>Qtd</th>
                                    <th style={{ padding: '8px' }}>Motivo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((h: any) => (
                                    <tr key={h.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '8px', fontSize: '0.9rem' }}>{formatDate(h.data)}</td>
                                        <td style={{ padding: '8px' }}>
                                            <span style={{ 
                                                padding: '2px 6px', 
                                                borderRadius: '4px',
                                                fontSize: '0.8rem',
                                                background: ['ENTRADA', 'AJUSTE_ENTRADA'].includes(h.tipo) ? '#dcfce7' : '#fee2e2',
                                                color: ['ENTRADA', 'AJUSTE_ENTRADA'].includes(h.tipo) ? '#166534' : '#991b1b'
                                            }}>
                                                {h.tipo.replace('AJUSTE_', 'AJUSTE ')}
                                            </span>
                                        </td>
                                        <td style={{ padding: '8px', fontWeight: 'bold' }}>{h.quantidade}</td>
                                        <td style={{ padding: '8px', color: '#555' }}>{h.motivo || '-'}</td>
                                    </tr>
                                ))}
                                {history.length === 0 && <tr><td colSpan={4} style={{padding: '20px', textAlign: 'center'}}>Nenhum registro encontrado.</td></tr>}
                            </tbody>
                         </table>
                    </div>
                )}
            </div>
        </div>
    );
};
