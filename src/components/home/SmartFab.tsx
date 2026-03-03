import { useNavigate } from 'react-router-dom';

export default function SmartFab({ expanded, onClick }: { expanded: boolean, onClick?: () => void }) {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            navigate('/admin');
        }
    };

    return (
        <button
            onClick={handleClick}
            className="smart-fab"
            style={{
                width: expanded ? '140px' : '52px',
                boxShadow: expanded
                    ? '0 8px 25px rgba(255,87,34,0.45), 0 0 0 3px rgba(255,87,34,0.15)'
                    : '0 6px 18px rgba(26,60,52,0.35)',
                background: expanded
                    ? 'linear-gradient(135deg, #ff5722, #ff9800)'
                    : 'linear-gradient(135deg, #1A3C34, #2E7D32)',
                gap: expanded ? '8px' : '0',
            }}
            aria-label="Vender ya"
        >
            <span style={{ fontSize: expanded ? '1rem' : '1.3rem', transition: 'font-size 0.3s' }}>
                {expanded ? '🚀' : '+'}
            </span>
            <span className="fab-label" style={{ opacity: expanded ? 1 : 0, width: expanded ? 'auto' : 0, overflow: 'hidden', whiteSpace: 'nowrap', transition: 'opacity 0.25s, width 0.3s' }}>
                VENDER YA
            </span>
        </button>
    );
}
