
import React, { useState, useEffect } from 'react';
import type { Produto } from '../types';
import { fetchProdutos, movimentarEstoque, corrigirEstoque as apiCorrigirEstoque, fetchHistoricoMovimentacao } from '../api';

interface EstoqueModalProps {
    onClose: () => void;
}

export const EstoqueModal: React.FC<EstoqueModalProps> = ({ onClose }) => {
    const [view, setView] = useState<'LIST' | 'MOVIMENTO' | 'HISTORY'>('LIST');
    const [products, setProducts] = useState<Produto[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);
    
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
        const timer = setTimeout(() => {
            loadProducts();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const loadProducts = async () => {
        try {
            const data = await fetchProdutos(searchTerm);
            setProducts(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSelectProduct = (prod: Produto) => {
        setSelectedProduct(prod);
        setView('MOVIMENTO');
        setTipoMovimento('ENTRADA');
        setQuantidade('');
        setNovoEstoque(prod.estoque.toString());
        setMotivo('');
        setError(null);
        setSuccess(null);
    };

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
            
            // Refresh product info
            const updatedList = await fetchProdutos(searchTerm);
            setProducts(updatedList);
            const updatedProd = updatedList.find(p => p.id === selectedProduct.id);
            if (updatedProd) setSelectedProduct(updatedProd);
            
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
            <div className="modal" style={{ width: '900px', maxWidth: '95%', height: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                    <h2>📦 Gestão de Estoque (MiniWMS)</h2>
                    <button className="secondary-close" onClick={onClose}>X</button>
                </div>

                {error && <div className="error-banner" style={{background: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '4px', marginBottom: '10px'}}>{error}</div>}
                {success && <div className="success-banner" style={{background: '#dcfce7', color: '#16a34a', padding: '10px', borderRadius: '4px', marginBottom: '10px'}}>{success}</div>}

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
                                    {products.map(p => (
                                        <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '10px' }}>
                                                <strong>{p.nome}</strong><br/>
                                                <small style={{color:'#666'}}>{p.codigos?.map(c => c.codigo).join(', ')}</small>
                                            </td>
                                            <td style={{ padding: '10px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                                {p.estoque}
                                            </td>
                                            <td style={{ padding: '10px', display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                <button className="secondary" onClick={() => handleSelectProduct(p)}>Movimentar</button>
                                                <button className="secondary" onClick={() => handleViewHistory(p)}>Histórico</button>
                                            </td>
                                        </tr>
                                    ))}
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
