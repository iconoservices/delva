import React, { useState } from 'react';
import { doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import type { Product } from '../../../data/products';

interface InventoryManagerProps {
    effectiveStoreId: string;
    storeProducts: Product[];
    setEditingProduct: (p: Product | null) => void;
    globalCategories: { id: string, name: string, subCategories?: any[] }[];
    saveGlobalCategories?: (newCats: any[]) => Promise<void>;
    confirmAction: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void;
    onRecordSale?: (product: Product) => void;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({
    effectiveStoreId, storeProducts, setEditingProduct, globalCategories, saveGlobalCategories = async () => {}, confirmAction, onRecordSale
}) => {
    const [subTab, setSubTab] = useState<'products' | 'categories'>('products');
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // --- CATEGORIES INLINE EDITING ---
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempValue, setTempValue] = useState('');

    const handleStartEdit = (id: string, current: string) => {
        setEditingId(id);
        setTempValue(current);
    };

    const handleSaveEdit = (type: 'cat' | 'sub', catId: string, subId?: string) => {
        if (!tempValue.trim()) return setEditingId(null);
        let updated = [...globalCategories];
        if (type === 'cat') {
            updated = updated.map(c => c.id === catId ? { ...c, name: tempValue.trim() } : c);
        } else if (type === 'sub' && subId) {
            updated = updated.map(c => c.id === catId ? {
                ...c,
                subCategories: c.subCategories?.map((s: any) => s.id === subId ? { ...s, name: tempValue.trim() } : s)
            } : c);
        }
        saveGlobalCategories(updated);
        setEditingId(null);
    };

    const filtered = storeProducts.filter(p =>
        p.title?.toLowerCase().includes(search.toLowerCase())
    );

    const togglePublish = async (p: Product) => {
        await setDoc(doc(db, 'products', p.id), { published: !(p as any).published }, { merge: true });
    };

    const slugify = (title: string) =>
        title?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 40) || 'producto';

    return (
        <div className="fade-in">
            {/* SUB-TABS NAVIGATION */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: '#f5f5f5', padding: '5px', borderRadius: '18px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                <button onClick={() => setSubTab('products')} style={{ flex: 1, padding: '10px 20px', borderRadius: '14px', border: 'none', background: subTab === 'products' ? 'white' : 'transparent', color: subTab === 'products' ? 'var(--primary)' : '#888', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer', boxShadow: subTab === 'products' ? 'var(--shadow-sm)' : 'none' }}>📦 PRODUCTOS</button>
                <button onClick={() => setSubTab('categories')} style={{ flex: 1, padding: '10px 20px', borderRadius: '14px', border: 'none', background: subTab === 'categories' ? 'white' : 'transparent', color: subTab === 'categories' ? 'var(--primary)' : '#888', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer', boxShadow: subTab === 'categories' ? 'var(--shadow-sm)' : 'none' }}>🌳 CATEGORÍAS GLOBALES</button>
            </div>

            {subTab === 'products' && (
                <>
                    {/* HEADER BAR */}
                    <div style={{ background: 'var(--primary)', borderRadius: '24px', padding: '22px 25px', marginBottom: '25px', color: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                            <div>
                                <h2 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0 }}>Gestión de Inventario 🌿</h2>
                                <p style={{ fontSize: '0.78rem', opacity: 0.75, margin: '4px 0 0' }}>{storeProducts.length} productos · {storeProducts.filter(p => (p as any).published).length} publicados</p>
                            </div>
                        </div>
                    </div>

                    {/* TOOLBAR */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="🔍 Buscar producto..."
                            style={{ flex: 1, minWidth: '200px', padding: '12px 16px', borderRadius: '15px', border: '1.5px solid #eee', fontFamily: '"Outfit", sans-serif', fontSize: '0.9rem', outline: 'none' }}
                        />
                        {/* Toggle grid / list */}
                        <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: '12px', padding: '4px', gap: '4px' }}>
                            <button onClick={() => setViewMode('grid')}
                                style={{ padding: '8px 14px', borderRadius: '9px', border: 'none', background: viewMode === 'grid' ? 'white' : 'transparent', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>
                                ▦ Grid
                            </button>
                            <button onClick={() => setViewMode('list')}
                                style={{ padding: '8px 14px', borderRadius: '9px', border: 'none', background: viewMode === 'list' ? 'white' : 'transparent', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>
                                ☰ Lista
                            </button>
                        </div>

                <button
                    onClick={() => setEditingProduct({ title: '', price: '', categoryId: globalCategories[1]?.id || 'varios', image: '', gallery: [], colors: [], tags: [], userId: effectiveStoreId, id: '' } as any)}
                    style={{ padding: '12px 22px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 900, fontSize: '0.82rem', cursor: 'pointer' }}>
                    + NUEVO
                </button>
            </div>

            {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '28px', color: '#bbb' }}>
                    <span style={{ fontSize: '3rem' }}>📦</span>
                    <p style={{ fontWeight: 700, marginTop: '15px', color: '#aaa' }}>
                        {search ? 'Sin resultados para esa búsqueda.' : '¡Crea tu primer producto!'}
                    </p>
                </div>
            )}

            {/* ── GRID VIEW ── */}
            {viewMode === 'grid' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                    {filtered.map(p => {
                        const isPublished = (p as any).published;
                        return (
                            <div key={p.id} style={{ background: '#111', borderRadius: '20px', overflow: 'hidden', border: '1px solid #222', position: 'relative' }}>
                                {/* Star */}
                                <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 2 }}>
                                    <span style={{ color: '#555', fontSize: '0.9rem' }}>☆</span>
                                </div>
                                {/* Sombra edit moved to footer */}

                                {/* Image */}
                                <div style={{ aspectRatio: '4/3', background: '#1a1a1a', overflow: 'hidden', position: 'relative' }}>
                                    {p.image
                                        ? <img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={p.title} />
                                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: '2rem' }}>📷</div>
                                    }
                                </div>

                                {/* Info */}
                                <div style={{ padding: '14px', paddingBottom: '70px' }}>
                                    <p style={{ color: 'white', fontWeight: 700, fontSize: '0.88rem', margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title || '—'}</p>
                                    <p style={{ color: '#888', fontSize: '0.68rem', margin: '0 0 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>/shop/{slugify(p.title)}</p>
                                    <p style={{ color: '#ccc', fontSize: '0.82rem', fontWeight: 800, margin: '0 0 10px' }}>Precio: S/ {Number(p.price || 0).toFixed(2)}</p>

                                    {/* Publish toggle */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                        <div
                                            onClick={(e) => { e.stopPropagation(); togglePublish(p); }}
                                            style={{
                                                width: '40px', height: '22px', borderRadius: '11px',
                                                background: isPublished ? '#00b96b' : '#333',
                                                position: 'relative', cursor: 'pointer', transition: '0.3s', flexShrink: 0
                                            }}>
                                            <div style={{
                                                position: 'absolute', top: '3px',
                                                left: isPublished ? '21px' : '3px',
                                                width: '16px', height: '16px', borderRadius: '50%',
                                                background: 'white', transition: '0.3s'
                                            }} />
                                        </div>
                                        <span style={{ color: isPublished ? '#00b96b' : '#555', fontSize: '0.72rem', fontWeight: 800 }}>
                                            {isPublished ? 'Publicado' : 'Sin publicar'}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions Container - Fixed at bottom, no overlap */}
                                <div style={{ 
                                    position: 'absolute', 
                                    bottom: 0, left: 0, right: 0, 
                                    padding: '12px 14px', 
                                    display: 'flex', 
                                    gap: '8px', 
                                    background: 'rgba(255,255,255,0.03)', 
                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                    justifyContent: 'flex-end',
                                    zIndex: 10
                                }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onRecordSale && onRecordSale(p); }}
                                        style={{ 
                                            background: '#00b96b', 
                                            border: 'none', 
                                            color: 'white', 
                                            width: '34px',
                                            height: '34px',
                                            borderRadius: '10px', 
                                            cursor: 'pointer', 
                                            fontWeight: 900, 
                                            fontSize: '1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 4px 12px rgba(0,185,107,0.3)'
                                        }}>
                                        +
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditingProduct(p); }}
                                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '34px', height: '34px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
                                        ✏️
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); confirmAction('Borrar', `¿Eliminar "${p.title}"?`, () => deleteDoc(doc(db, 'products', p.id))); }}
                                        style={{ background: 'rgba(255,77,79,0.1)', border: 'none', color: '#ff4d4f', width: '34px', height: '34px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── LIST VIEW ── */}
            {viewMode === 'list' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filtered.map(p => {
                        const isPublished = (p as any).published;
                        return (
                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'white', padding: '15px 20px', borderRadius: '18px', border: '1px solid #f0f0f0' }}>
                                <img src={p.image} style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', background: '#eee', flexShrink: 0 }} alt={p.title} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: 800, margin: 0, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#aaa' }}>/shop/{slugify(p.title)} · S/ {p.price}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                                    <div onClick={(e) => { e.stopPropagation(); togglePublish(p); }} style={{ width: '38px', height: '20px', borderRadius: '10px', background: isPublished ? '#00b96b' : '#ddd', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                                        <div style={{ position: 'absolute', top: '2px', left: isPublished ? '20px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: '0.3s' }} />
                                    </div>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: isPublished ? '#00b96b' : '#aaa', minWidth: '70px' }}>{isPublished ? 'Publicado' : 'Sin publicar'}</span>
                                    <button onClick={(e) => { e.stopPropagation(); onRecordSale && onRecordSale(p); }} style={{ background: '#00b96b', color: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '10px', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                    <button onClick={(e) => { e.stopPropagation(); setEditingProduct(p); }} style={{ background: '#f5f5f5', border: 'none', padding: '7px 14px', borderRadius: '10px', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}>✏️ Editar</button>
                                    <button onClick={(e) => { e.stopPropagation(); confirmAction('Borrar', `¿Eliminar "${p.title}"?`, () => deleteDoc(doc(db, 'products', p.id))); }} style={{ background: '#FFF1F0', color: '#CF1322', border: 'none', padding: '7px 14px', borderRadius: '10px', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}>🗑️</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            </>
            )}

            {/* CATEGORIES EDITOR (From BrandingSettings) */}
            {subTab === 'categories' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'white', padding: '25px', borderRadius: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 950, margin: 0, letterSpacing: '-0.5px' }}>Estructura de Categorías</h3>
                            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#888' }}>Estas son las categorías globales de tu tienda.</p>
                        </div>
                        <button onClick={() => { 
                            const id = `cat-${Date.now()}`;
                            const updated = [...globalCategories, { id, name: "Nueva Categoría", subCategories: [] }];
                            if (saveGlobalCategories) saveGlobalCategories(updated);
                            handleStartEdit(id, "Nueva Categoría");
                        }} className="btn-vibrant" style={{ padding: '8px 18px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 900, background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}>+ AGREGAR CATEGORÍA</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {globalCategories.filter(c => c.id !== 'all').map((cat: any, idx: number) => {
                            const isEditingCat = editingId === `cat-${cat.id}`;
                            return (
                                <div key={`cat-row-${cat.id}-${idx}`} style={{ background: '#f8f8fa', borderRadius: '16px', padding: '15px', border: '1px solid #eee' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '1.2rem' }}>📁</span>
                                        {isEditingCat ? (
                                            <input 
                                                autoFocus
                                                style={{ border: '2px solid var(--primary)', borderRadius: '8px', padding: '6px 12px', fontWeight: 800, outline: 'none', flex: 1 }}
                                                value={tempValue}
                                                onChange={(e) => setTempValue(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit('cat', cat.id)}
                                                onBlur={() => handleSaveEdit('cat', cat.id)}
                                            />
                                        ) : (
                                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <h4 onClick={() => handleStartEdit(`cat-${cat.id}`, cat.name)} style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, cursor: 'text' }}>{cat.name}</h4>
                                                <span style={{ fontSize: '0.7rem', color: '#888', background: '#e0e0e0', padding: '3px 8px', borderRadius: '10px', fontFamily: 'monospace' }}>ID: {cat.id}</span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => confirmAction("Eliminar", `¿Borrar "${cat.name}"?`, () => {
                                                const updated = globalCategories.filter(c => c.id !== cat.id);
                                                if (saveGlobalCategories) saveGlobalCategories(updated);
                                            })} style={{ border: 'none', background: '#ffeef0', color: '#cf1322', padding: '8px 14px', borderRadius: '10px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>🗑️ ELIMINAR</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryManager;
