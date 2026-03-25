import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../data/products';
import type { User } from '../../App';

interface ProductCardProps {
    product: Product;
    onQuickAdd?: (p: Product) => void;
    users?: User[]; // Optional users list to find author
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickAdd, users }) => {
    const navigate = useNavigate();

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onQuickAdd) onQuickAdd(product);
    };

    // Calculate a mock rating if none exists
    const rating = (4.5 + Math.random() * 0.4).toFixed(1);

    return (
        <div className="pro-card" onClick={() => navigate(`/producto/${product.id}`)}>
            {/* PRICE BADGE */}
            <div className="price-badge">
                S/ {Number(product.price || 0).toFixed(0)}
            </div>

            <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '1/1' }}>
                <img 
                    src={product.image} 
                    loading="lazy" 
                    style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} 
                    alt={product.title}
                />
                
                {/* CART ICON OVERLAY */}
                <div 
                    onClick={handleQuickAdd}
                    style={{ 
                        position: 'absolute', bottom: '15px', right: '15px', 
                        background: 'white', width: '40px', height: '40px', 
                        borderRadius: '50%', display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                        cursor: 'pointer', zIndex: 10
                    }}
                >
                    🛒
                </div>
            </div>

            <div style={{ padding: '10px 12px 14px' }}>
                <h4 style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 700, 
                    color: '#1a1a1a', 
                    margin: '0 0 2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {product.title}
                </h4>
                
                <p style={{ fontSize: '0.7rem', color: '#888', margin: '0 0 6px', fontWeight: 600 }}>
                    {users?.find(u => (u.id === (product as any).userId) || (u.id === (product as any).storeId))?.storeName || 'Selección Selva'}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                    {product.hasOffer ? (
                        <div className="fire-stats" style={{ color: '#ff5722', fontWeight: 900, fontSize: '0.75rem', marginTop: 0 }}>
                            <span className="fire-icon">🔥</span> OFERTA
                        </div>
                    ) : (
                        <div className="fire-stats" style={{ marginTop: 0 }}>
                            <span style={{ color: '#faad14', fontSize: '0.82rem' }}>★</span>
                            <span style={{ fontSize: '0.75rem' }}>{rating}</span>
                        </div>
                    )}
                    
                    {product.originalPrice ? (
                        <span style={{ fontSize: '0.7rem', textDecoration: 'line-through', color: '#aaa', fontWeight: 600 }}>
                            S/ {Number(product.originalPrice).toFixed(0)}
                        </span>
                    ) : null}
                </div>

                {/* Button Removed per request */}
            </div>
        </div>
    );
};

export default ProductCard;
