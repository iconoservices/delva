import React from 'react';

interface CategoryMenuProps {
    categories: { id: string, name: string }[];
    activeCategory: string;
    setActiveCategory: (val: string) => void;
}

export const CategoryMenu: React.FC<CategoryMenuProps> = ({ 
    categories, 
    activeCategory, 
    setActiveCategory
}) => {
    return (
        <div style={{ 
            overflowX: 'auto', 
            whiteSpace: 'nowrap', 
            padding: '10px 20px', 
            display: 'flex', 
            gap: '12px',
            scrollbarWidth: 'none',
            background: 'transparent'
        }}>
            {categories.map(cat => {
                const style = {
                    bg: (cat as any).color ? `${(cat as any).color}22` : '#f5f5f5',
                    icon: (cat as any).icon || '',
                    color: (cat as any).color || '#555'
                };
                const isSel = activeCategory === cat.id;
                return (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className="pro-pill"
                        style={{
                            background: isSel ? style.color : style.bg,
                            color: isSel ? 'white' : style.color,
                            boxShadow: isSel ? `0 8px 15px ${style.color}44` : 'none',
                            flexShrink: 0
                        }}
                    >
                        <span>{(isSel || cat.id === 'all') ? '' : style.icon}</span>
                        <span>{cat.name}</span>
                    </button>
                );
            })}
        </div>
    );
};
