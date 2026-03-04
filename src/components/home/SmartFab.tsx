import { useNavigate } from 'react-router-dom';

export default function SmartFab({ expanded, onClick, isOpen }: { expanded: boolean, onClick?: () => void, isOpen?: boolean }) {
    const navigate = useNavigate();

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClick) {
            onClick();
        } else {
            navigate('/admin');
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`smart-fab ${isOpen ? 'is-open' : ''}`}
            style={{
                width: isOpen ? '52px' : (expanded ? '140px' : '52px'),
                boxShadow: isOpen
                    ? '0 8px 25px rgba(244,67,54,0.45)'
                    : (expanded
                        ? '0 8px 25px rgba(255,87,34,0.45), 0 0 0 3px rgba(255,87,34,0.15)'
                        : '0 6px 18px rgba(26,60,52,0.35)'),
                background: isOpen
                    ? '#f44336'
                    : (expanded
                        ? 'linear-gradient(135deg, #ff5722, #ff9800)'
                        : 'linear-gradient(135deg, #1A3C34, #2E7D32)'),
                gap: (expanded && !isOpen) ? '8px' : '0',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                zIndex: 10001
            }}
            aria-label={isOpen ? "Cerrar" : "Vender ya"}
        >
            <span style={{
                fontSize: (expanded || isOpen) ? '1.2rem' : '1.3rem',
                transition: 'all 0.3s',
                transform: isOpen ? 'rotate(135deg)' : 'none',
                display: 'inline-block'
            }}>
                +
            </span>
            <span className="fab-label" style={{
                opacity: (expanded && !isOpen) ? 1 : 0,
                width: (expanded && !isOpen) ? 'auto' : 0,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                transition: 'opacity 0.25s, width 0.3s',
                fontWeight: 900,
                fontSize: '0.75rem',
                letterSpacing: '1px'
            }}>
                VENDER YA
            </span>

            {!isOpen && expanded && (
                <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'white', color: '#ff5722', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                    !
                </span>
            )}
        </button>
    );
}
