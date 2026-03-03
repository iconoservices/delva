import { useNavigate } from 'react-router-dom';

export default function HomeHeader({ onVenderClick }: { onVenderClick: () => void }) {
    const navigate = useNavigate();
    return (
        <div className="home-header-container" style={{ position: 'sticky', top: '65px', zIndex: 1001, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.03)', height: '40px' }}>
            <h1 onClick={() => navigate('/')} className="hub-logo modern-title" style={{ cursor: 'pointer', fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-1.5px', margin: 0, background: 'linear-gradient(45deg, #1A3C34, #2E7D32)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DELVA<span style={{ color: '#ff5722', WebkitTextFillColor: '#ff5722' }}>HUB</span></h1>
            <button onClick={onVenderClick} className="hub-sell-btn btn-vibrant btn-pulse-gold modern-title" style={{ padding: '6px 14px', borderRadius: '12px', fontSize: '0.65rem' }}>
                VENDER YA 🚀
            </button>
        </div>
    );
}
