import React from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/data/products';
import type { User } from '@/lib/types';
import ColorSwatch from './ColorSwatch';

interface ProductCardProps {
    product: Product;
    onQuickAdd?: (p: Product) => void;
    users?: User[]; // Optional users list to find author
}

const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, onQuickAdd, users }) => {
    const router = useRouter();
    const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);

    const images = React.useMemo(() => {
        const arr = [product.image, ...(product.gallery || [])].filter(url => typeof url === 'string' && url.trim().length > 5);
        return arr.length > 0 ? arr : ['https://via.placeholder.com/300?text=No+Image'];
    }, [product.image, product.gallery]);

    // Index tracking for hover cycling
    React.useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (hoverIndex !== null && images.length > 1) {
            timeout = setTimeout(() => {
                setHoverIndex((hoverIndex + 1) % images.length);
            }, 1200);
        }
        return () => clearTimeout(timeout);
    }, [hoverIndex, images.length]);

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onQuickAdd) onQuickAdd(product);
    };

    const isOutOfStock = (Number(product.stock) || 0) <= 0;

    const isNew = !isOutOfStock && !!product.createdAt && (Date.now() - new Date(product.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
    const showOffer = !!(product.hasOffer && product.originalPrice && product.price);
    const discount = showOffer ? Math.round((1 - Number(product.price) / Number(product.originalPrice)) * 100) : 0;

    return (
        <div
            className={`pro-card pc ${isOutOfStock ? 'pc-soldout' : ''}`}
            onClick={() => router.push(`/producto/${product.slug || product.id}`)}
            onMouseEnter={() => images.length > 1 ? setHoverIndex(1) : setHoverIndex(0)}
            onMouseLeave={() => setHoverIndex(null)}
        >
            <div className="pc-media">
                {images.map((imgSrc, i) => (
                    <img
                        key={i}
                        src={imgSrc}
                        loading="lazy"
                        className="pc-img"
                        style={{ opacity: (hoverIndex !== null ? hoverIndex : 0) === i ? 1 : 0 }}
                        alt={`${product.title} - ${i}`}
                    />
                ))}

                {images.length > 1 && hoverIndex !== null && (
                    <div className="pc-progress">
                        {images.map((_, i) => (
                            <div key={i} style={{ flex: 1, background: i === hoverIndex ? '#fff' : 'transparent', transition: '0.3s' }} />
                        ))}
                    </div>
                )}

                {(isOutOfStock || isNew) && (
                    <div className="pc-badges">
                        {isOutOfStock && <span className="pc-badge pc-badge-reserve">Reservar</span>}
                        {isNew && <span className="pc-badge pc-badge-new">Nuevo</span>}
                    </div>
                )}
            </div>

            <div className="pc-body">
                {showOffer && !isOutOfStock && discount > 0 && <span className="pc-discount">{discount}%</span>}

                <h4 className="pc-title">{product.title}</h4>

                <div className="pc-divider" />

                <div className="pc-prices">
                    {showOffer ? (
                        <>
                            <div className="pc-old">Antes <s>S/ {Number(product.originalPrice).toFixed(2)}</s></div>
                            <div className="pc-offer">Oferta S/ {Number(product.price).toFixed(2)}</div>
                        </>
                    ) : (
                        <div className="pc-regular">S/ {Number(product.price || 0).toFixed(2)}</div>
                    )}
                </div>

                <div className="pc-colors">
                    {product.colors && product.colors.length > 0 && (
                        <ColorSwatch colors={product.colors} size="12px" border="1px solid white" />
                    )}
                </div>

                <button
                    type="button"
                    className={`pc-buy ${isOutOfStock ? 'pc-buy-reserve' : ''}`}
                    onClick={handleQuickAdd}
                >
                    {isOutOfStock ? 'Reservar' : 'Comprar'}
                </button>
            </div>
        </div>
    );
});

export default ProductCard;
