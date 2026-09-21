import React from 'react';

interface ShortcutRibbonProps {
    activeGlobalFilter: string;
    setActiveGlobalFilter: (id: any) => void;
}

const FILTERS = [
    { id: 'offers', label: 'Promos', icon: '🔥', color: '#E91E63' },
    { id: 'reservations', label: 'Reserva', icon: '🗓️', color: '#F39C12' },
    { id: 'new', label: 'Novedad', icon: '✨', color: '#00A651' }
];

// Filtros rápidos del Home, como chips. Tocar el activo lo desactiva.
export const ShortcutRibbon: React.FC<ShortcutRibbonProps> = ({ activeGlobalFilter, setActiveGlobalFilter }) => (
    <div className="filter-chips">
        {FILTERS.map(f => {
            const isSel = activeGlobalFilter === f.id;
            return (
                <button
                    key={f.id}
                    className={`filter-chip ${isSel ? 'active' : ''}`}
                    style={{ '--c': f.color } as React.CSSProperties}
                    onClick={() => setActiveGlobalFilter(isSel ? 'all' : f.id)}
                >
                    <span className="filter-chip-icon">{f.icon}</span>
                    {f.label}
                    {isSel && <span className="filter-chip-x">✕</span>}
                </button>
            );
        })}
    </div>
);
