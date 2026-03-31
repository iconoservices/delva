import React from 'react';

interface ShortcutRibbonProps {
    activeGlobalFilter: string;
    setActiveGlobalFilter: (id: any) => void;
}

export const ShortcutRibbon: React.FC<ShortcutRibbonProps> = ({
    activeGlobalFilter,
    setActiveGlobalFilter
}) => {
    const shortcuts = [
        { id: 'all', label: 'Inicio', icon: '🏠', color: '#6C4AB6', bg: '#F2EBFF' },
        { id: 'offers', label: 'Promos', icon: '🔥', color: '#E91E63', bg: '#FFF0F5', badge: '¡Dscto!' },
        { id: 'reservations', label: 'Reserva', icon: '🗓️', color: '#F39C12', bg: '#FFF8F0' },
        { id: 'new', label: 'Novedad', icon: '✨', color: '#00A651', bg: '#F1F9F5', badge: 'Nuevo' }
    ];

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-start', 
            alignItems: 'center',
            gap: '20px', 
            marginBottom: '30px',
            padding: '10px 0',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            maxWidth: '100%'
        }}>
            {shortcuts.map((btn: any) => {
                const isSel = activeGlobalFilter === btn.id;
                return (
                    <button 
                        key={btn.id}
                        onClick={() => {
                            setActiveGlobalFilter(btn.id);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center', 
                            gap: '8px', 
                            padding: '5px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            textAlign: 'center',
                            minWidth: '80px',
                            position: 'relative'
                        }}
                    >
                        {/* ICON CIRCLE */}
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: btn.bg,
                            borderRadius: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.8rem',
                            transition: 'all 0.3s',
                            boxShadow: isSel ? `0 10px 20px ${btn.color}33` : '0 4px 10px rgba(0,0,0,0.03)',
                            border: isSel ? `3px solid ${btn.color}` : '2px solid transparent',
                            transform: isSel ? 'scale(1.05)' : 'scale(1)'
                         }}>
                            {btn.icon}
                        </div>
                        
                        {/* BADGE (¡Dscto / Nuevo) */}
                        {btn.badge && (
                            <span style={{ 
                                position: 'absolute',
                                top: '-2px',
                                right: '0px',
                                fontSize: '0.65rem', 
                                fontWeight: 950, 
                                color: 'white',
                                background: btn.color,
                                padding: '3px 8px',
                                borderRadius: '10px',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                whiteSpace: 'nowrap',
                                zIndex: 1
                            }}>
                                {btn.badge}
                            </span>
                        )}

                        {/* LABEL */}
                        <span style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: isSel ? 900 : 700,
                            color: isSel ? btn.color : '#4F4F4F',
                            fontFamily: "'Outfit', sans-serif"
                        }}>
                            {btn.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};
