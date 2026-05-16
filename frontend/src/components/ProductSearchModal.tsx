
import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Produto } from '../types';

interface ProductSearchModalProps {
    allProducts: Produto[];
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    onClose: () => void;
    onSelect: (p: Produto) => void;
    onEdit: (p: Produto) => void;
    onDelete: (id: number) => void;
    formatCurrency: (value: number) => string;
}

export const ProductSearchModal: React.FC<ProductSearchModalProps> = ({ 
    allProducts, searchTerm, setSearchTerm, onClose, onSelect, onEdit, onDelete, formatCurrency
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
