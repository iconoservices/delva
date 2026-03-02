import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../data/products';

interface ProductCardProps {
    product: Product;
    onQuickAdd?: (p: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickAdd }) => {
    const navigate = useNavigate();

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onQuickAdd) onQuickAdd(product);
        else alert(`¡${product.title} añadido al carrito velozmente! (Próximamente conectado)`);
    };

    return (
        <div className="product-card" onClick={() => navigate(`/producto/${product.id}`)}>
            <div style={{ position: 'relative', overflow: 'hidden' }}>
                <img src={product.image} loading="lazy" />
                {product.colors && product.colors.length > 0 && (
                    <div style={{ position: 'absolute', bottom: '12px', right: '12px', display: 'flex', gap: '5px', background: 'rgba(255,255,255,0.9)', padding: '5px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        {product.colors.slice(0, 3).map((c: string, i: number) => (
                            <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: c, border: '1px solid rgba(0,0,0,0.1)' }}></div>
                        ))}
                        {product.colors.length > 3 && <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#333' }}>+</span>}
                    </div>
                )}
            </div>
            <div className="product-card-info">
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {product.tags?.slice(0, 2).map((t: string) => (
                        <span key={t} style={{ fontSize: '0.65rem', background: 'var(--bg)', color: 'var(--primary)', padding: '3px 10px', borderRadius: '20px', fontWeight: 700, border: '1px solid rgba(0,0,0,0.05)' }}>{t}</span>
                    ))}
                </div>
                <h4 className="product-card-title">{product.title}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <span className="product-card-price" style={{ fontSize: '1rem' }}>S/ {Number(product.price || 0).toFixed(2)}</span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button className="btn-wa" style={{ padding: '6px 12px', fontSize: '0.7rem' }}>Detalle</button>
                        <button
                            onClick={handleQuickAdd}
                            style={{ background: 'var(--primary)', color: 'white', border: 'none', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                            🛒
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
