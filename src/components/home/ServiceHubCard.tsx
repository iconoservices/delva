import { useNavigate } from 'react-router-dom';
import type { Product } from '../../data/products';
import type { User } from '../../types';

export default function ServiceHubCard({ product, author }: { product: Product, author?: User }) {
    const navigate = useNavigate();
    return (
        <div className="peeking-item service-card" onClick={() => navigate(`/tienda?u=${author?.id || 'master'}&viewAsGuest=true`)} style={{ cursor: 'pointer' }}>
            <img src={product.image} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div className="service-overlay">
                <span style={{ background: '#ff5722', color: 'white', padding: '3px 10px', borderRadius: '10px', fontSize: '0.6rem', fontWeight: 900, marginBottom: '8px', width: 'fit-content' }}>SERVICIO PRO</span>
                <h4 style={{ fontSize: '1rem', fontWeight: 900, margin: '0 0 5px' }}>{product.title}</h4>
                <p style={{ fontSize: '0.7rem', opacity: 0.8, margin: 0 }}>Desde S/ {product.price} • Por {author?.name || 'DELVA'}</p>
            </div>
        </div>
    );
}
