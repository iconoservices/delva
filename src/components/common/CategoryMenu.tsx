import React from 'react';
import { useNavigate } from 'react-router-dom';

export const CAT_STYLES: Record<string, { bg: string, icon: string, color: string }> = {
    'all': { bg: '#FFF1F0', icon: '✨', color: '#CF1322' },
    'ropa': { bg: '#E6FFFB', icon: '👗', color: '#08979C' },
    'moda': { bg: '#E6FFFB', icon: '👗', color: '#08979C' },
    'accesorios': { bg: '#F6FFED', icon: '💎', color: '#389E0D' },
    'cafe': { bg: '#FFF7E6', icon: '☕', color: '#D46B08' },
    'artesania': { bg: '#F9F0FF', icon: '🎨', color: '#531DAB' },
    'default': { bg: '#F5F5F5', icon: '📦', color: '#555555' }
};

interface CategoryMenuProps {
    categories: { id: string, name: string }[];
    activeCategory: string;
    setActiveCategory: (val: string) => void;
    isMarketplace?: boolean;
}

export const CategoryMenu: React.FC<CategoryMenuProps> = ({ 
    categories, 
    activeCategory, 
    setActiveCategory,
    isMarketplace 
}) => {
    const navigate = useNavigate();

    return (
        <div style={{ 
            overflowX: 'auto', 
            whiteSpace: 'nowrap', 
            padding: '10px 20px', 
            display: 'flex', 
            gap: '12px',
            scrollbarWidth: 'none',
            background: 'transparent',
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>
            {categories.map(cat => {
                const style = CAT_STYLES[cat.id] || CAT_STYLES.default;
                const isSel = activeCategory === cat.id;
                return (
                    <button
                        key={cat.id}
                        onClick={() => {
                            if (isMarketplace) {
                                if (cat.id === 'all') {
                                    navigate('/');
                                } else {
                                    navigate(`/tienda?cat=${cat.id}`);
                                }
                            } else {
                                setActiveCategory(cat.id);
                            }
                        }}
                        className="pro-pill"
                        style={{
                            background: isSel ? style.color : style.bg,
                            color: isSel ? 'white' : style.color,
                            boxShadow: isSel ? `0 8px 15px ${style.color}44` : 'none',
                            flexShrink: 0
                        }}
                    >
                        <span>{isSel ? '✨' : style.icon}</span>
                        <span>{cat.name}</span>
                    </button>
                );
            })}
        </div>
    );
};
