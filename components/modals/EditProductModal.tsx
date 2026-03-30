import React, { useState } from 'react';

interface EditProductModalProps {
    editingProduct: any;
    setEditingProduct: (val: any) => void;
    globalCategories: { id: string, name: string, subCategories?: any[] }[];
    globalTags: string[];
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleGalleryUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeGalleryImage: (index: number) => void;
    isSaving: boolean;
    saveProduct: (data: any, keepOpen?: boolean) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    galleryInputRef: React.RefObject<HTMLInputElement | null>;
    products: any[];
    generateSuggestedSKU: (categoryId: string, title: string, color?: string, subCategoryId?: string) => string;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
    editingProduct, setEditingProduct, globalCategories, globalTags,
    handleImageUpload, handleGalleryUpload, removeGalleryImage,
    isSaving, saveProduct, fileInputRef, galleryInputRef, products,
    generateSuggestedSKU
}) => {
    const [newDetailInput, setNewDetailInput] = useState('');
    
    if (!editingProduct) return null;

    const availableCategories = globalCategories.filter(c => c.id !== 'all');

    const addDetail = () => {
        if (!newDetailInput.trim()) return;
        const currentDetails = editingProduct.details || [];
        setEditingProduct({ ...editingProduct, details: [...currentDetails, newDetailInput.trim()] });
        setNewDetailInput('');
    };

    const removeDetail = (idx: number) => {
        const currentDetails = [...(editingProduct.details || [])];
        currentDetails.splice(idx, 1);
        setEditingProduct({ ...editingProduct, details: currentDetails });
    };

    // --- Navegación ---
    const isNew = !editingProduct.id;
    const currentIndex = products ? products.findIndex((p: any) => p.id === editingProduct.id) : -1;
    const hasNext = currentIndex >= 0 && currentIndex < products.length - 1;
    const hasPrev = currentIndex > 0;

    const goNext = () => hasNext && setEditingProduct(products[currentIndex + 1]);
    const goPrev = () => hasPrev && setEditingProduct(products[currentIndex - 1]);

    return (
        <div className="modal-overlay open" style={{ padding: 0 }} onClick={() => setEditingProduct(null)}>
            <div className="modal-card fade-in" style={{ 
                maxWidth: 'none', 
                width: '100vw', 
                height: '100vh', 
                maxHeight: '100vh',
                borderRadius: 0, 
                boxShadow: 'none', 
                padding: '0 15px', 
                margin: 0, 
                backgroundColor: 'white',
                overflowY: 'auto' 
            }} onClick={e => e.stopPropagation()}>
                
                {/* HEADER SUPERIOR */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', position: 'sticky', top: 0, background: 'white', zIndex: 10, paddingBottom: '5px', paddingTop: '2px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>
                            {isNew ? '✨ Nuevo' : '📝 Editar'}
                        </h2>
                        {!isNew && (
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button onClick={goPrev} disabled={!hasPrev} style={{ background: hasPrev ? 'var(--primary)' : '#ddd', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '12px', fontWeight: 900, cursor: hasPrev ? 'pointer' : 'not-allowed', opacity: hasPrev ? 1 : 0.5, fontSize: '0.75rem' }}>⬅ Ant.</button>
                                <button onClick={goNext} disabled={!hasNext} style={{ background: hasNext ? 'var(--primary)' : '#ddd', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '12px', fontWeight: 900, cursor: hasNext ? 'pointer' : 'not-allowed', opacity: hasNext ? 1 : 0.5, fontSize: '0.75rem' }}>Sig. ➡</button>
                            </div>
                        )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button onClick={() => setEditingProduct(null)} style={{ padding: '8px 14px', borderRadius: '18px', fontWeight: 800, background: '#f0f0f0', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '0.8rem' }}>Descartar</button>
                        
                        <button onClick={() => {
                            let finalProduct = { ...editingProduct };
                            if (!availableCategories.some(c => c.id === finalProduct.categoryId)) {
                                const defaultCat = availableCategories[0];
                                if (defaultCat) {
                                    finalProduct.categoryId = defaultCat.id;
                                    finalProduct.category = defaultCat.name;
                                }
                            }
                            saveProduct(finalProduct, false);
                        }} className="btn-vibrant" style={{ padding: '8px 14px', borderRadius: '18px', cursor: 'pointer', border: 'none', fontSize: '0.8rem' }} disabled={isSaving}>
                            {isSaving ? '⏳...' : 'Guardar y Salir'}
                        </button>

                        <button onClick={() => {
                            let finalProduct = { ...editingProduct };
                            if (!availableCategories.some(c => c.id === finalProduct.categoryId)) {
                                const defaultCat = availableCategories[0];
                                if (defaultCat) {
                                    finalProduct.categoryId = defaultCat.id;
                                    finalProduct.category = defaultCat.name;
                                }
                            }
                            saveProduct(finalProduct, true);
                        }} style={{ padding: '8px 14px', borderRadius: '18px', background: 'var(--primary)', color: 'white', fontWeight: 800, cursor: 'pointer', border: 'none', fontSize: '0.8rem' }} disabled={isSaving}>
                            {isSaving ? '⏳...' : 'Guardar y Añadir Otro ➡'}
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px', alignItems: 'flex-start' }}>
                    
                    {/* COLUMNA 1: IDENTIDAD + CONFIG (IZQUIERDA - CONSOLIDADA) */}
                    <div style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        
                        {/* BLOQUE CONSOLIDADO: TODO LO DE IDENTIDAD Y ORGANIZACIÓN */}
                        <div style={{ 
                            background: 'white', 
                            padding: '18px', 
                            borderRadius: '26px', 
                            border: '1.5px solid rgba(0,0,0,0.04)',
                            boxShadow: 'var(--shadow-sm)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '15px'
                        }}>
                            {/* FILA 1: PORTADA + IDENTIDAD + PRECIOS */}
                            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                {/* PORTADA PRINCIPAL */}
                                <div style={{ width: '150px', flexShrink: 0 }}>
                                    <label style={{ fontWeight: 800, fontSize: '0.55rem', color: '#bbb', letterSpacing: '1px', marginBottom: '5px', display: 'block' }}>PORTADA</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{ 
                                            width: '150px', 
                                            height: '150px', 
                                            background: 'var(--bg)', 
                                            borderRadius: '20px', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            cursor: 'pointer', 
                                            overflow: 'hidden', 
                                            border: '2px dashed rgba(0,0,0,0.03)', 
                                            position: 'relative' 
                                        }}>
                                        {editingProduct.image ? <img src={editingProduct.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center' }}><span style={{ fontSize: '1.5rem' }}>📸</span></div>}
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} hidden accept="image/*" />
                                </div>

                                {/* INFO IDENTIDAD & PRECIOS */}
                                <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontWeight: 700, fontSize: '0.6rem', color: '#888', marginBottom: '3px', display: 'block' }}>Nombre del Producto</label>
                                            <input type="text" placeholder="Ej: Reloj Sanda..." value={editingProduct.title} onChange={e => setEditingProduct({ ...editingProduct, title: e.target.value })} style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', border: '1.5px solid rgba(0,0,0,0.06)', background: 'var(--bg)', fontSize: '0.95rem', fontWeight: 700 }} />
                                        </div>
                                        <div style={{ width: '140px' }}>
                                            <label style={{ fontWeight: 700, fontSize: '0.6rem', color: '#888', marginBottom: '3px', display: 'block' }}>SKU</label>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <input type="text" value={editingProduct.sku || ''} onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value.toUpperCase() })} placeholder="SKU" style={{ flex: 1, borderRadius: '12px', padding: '10px 14px', border: '1.5px solid rgba(0,0,0,0.06)', background: 'var(--bg)', fontSize: '0.85rem', fontWeight: 600 }} />
                                                <button 
                                                    onClick={() => setEditingProduct({ ...editingProduct, sku: generateSuggestedSKU(editingProduct.categoryId, editingProduct.title, editingProduct.colors?.[0], editingProduct.subCategoryId) })} 
                                                    style={{ width: '38px', borderRadius: '10px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}
                                                >✨</button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PRECIOS Y STOCK (GRID) */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                        {[
                                            { label: 'Precio (S/)', key: 'price' },
                                            { label: 'Oferta (S/)', key: 'originalPrice' },
                                            { label: 'Stock', key: 'stock' }
                                        ].map(field => (
                                            <div key={field.key}>
                                                <label style={{ fontWeight: 700, fontSize: '0.6rem', color: '#888', marginBottom: '2px', display: 'block' }}>{field.label}</label>
                                                <input type="number" 
                                                    value={(editingProduct as any)[field.key] ?? ''} 
                                                    onChange={e => setEditingProduct({ ...editingProduct, [field.key]: e.target.value ? Number(e.target.value) : 0 })} 
                                                    style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', border: '1.5px solid rgba(0,0,0,0.05)', background: 'var(--bg)', fontSize: '0.9rem', fontWeight: 600 }} 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* SEPARADOR SUTIL */}
                            <div style={{ height: '1.5px', background: 'linear-gradient(90deg, rgba(0,0,0,0.05) 0%, transparent 100%)', margin: '4px 0' }} />

                            {/* FILA 2: CATEGORÍAS + WHATSAPP + COLORES + TAGS */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
                                {/* SUBCOL 2.1: CATS & WHATSAPP */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontWeight: 700, fontSize: '0.6rem', color: '#888', marginBottom: '5px', display: 'block' }}>Categoría / Subcategoría</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <select 
                                                value={availableCategories.some(c => c.id === editingProduct.categoryId) ? editingProduct.categoryId : availableCategories[0]?.id || ''} 
                                                onChange={e => {
                                                    const catId = e.target.value;
                                                    const catName = globalCategories.find(c => c.id === catId)?.name || '';
                                                    setEditingProduct({ ...editingProduct, categoryId: catId, category: catName, subCategoryId: '' });
                                                }} 
                                                style={{ flex: 1, borderRadius: '10px', padding: '8px 12px', border: '1.5px solid rgba(0,0,0,0.04)', background: 'var(--bg)', fontSize: '0.8rem' }}
                                            >
                                                {availableCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            {globalCategories.find(c => c.id === editingProduct.categoryId)?.subCategories?.length ? (
                                                <select
                                                    value={editingProduct.subCategoryId || ''}
                                                    onChange={e => setEditingProduct({ ...editingProduct, subCategoryId: e.target.value })}
                                                    style={{ flex: 1, borderRadius: '10px', padding: '8px 12px', border: '1.5px solid rgba(0,0,0,0.04)', background: 'var(--bg)', fontSize: '0.8rem' }}
                                                >
                                                    <option value="">Subcat...</option>
                                                    {globalCategories.find(c => c.id === editingProduct.categoryId)?.subCategories?.map((s: any) => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))}
                                                </select>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontWeight: 700, fontSize: '0.6rem', color: '#888', marginBottom: '5px', display: 'block' }}>WhatsApp Directo</label>
                                        <input type="text" placeholder="519XXXXXXXX" value={editingProduct.waNumber || ''} onChange={e => setEditingProduct({ ...editingProduct, waNumber: e.target.value })} style={{ width: '100%', borderRadius: '10px', padding: '8px 12px', border: '1.5px solid rgba(0,0,0,0.04)', background: 'var(--bg)', fontSize: '0.8rem' }} />
                                    </div>
                                </div>

                                {/* SUBCOL 2.2: COLORES Y TAGS */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div>
                                        <label style={{ fontWeight: 800, fontSize: '0.65rem', color: 'var(--primary)', marginBottom: '8px', display: 'block', letterSpacing: '0.5px' }}>COLORES & TAGS</label>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                {(editingProduct.colors || []).map((c: string, i: number) => (
                                                    <div key={i} style={{ position: 'relative', width: '26px', height: '26px' }}>
                                                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: c, border: '1px solid #ddd', boxShadow: 'inset 0 0 2px rgba(0,0,0,0.1)' }} />
                                                        <button onClick={() => {
                                                            const colors = [...(editingProduct.colors || [])];
                                                            colors.splice(i, 1);
                                                            setEditingProduct({ ...editingProduct, colors });
                                                        }} style={{ position: 'absolute', top: -6, right: -6, background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '50%', width: '14px', height: '14px', fontSize: '0.5rem', cursor: 'pointer', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                                                    </div>
                                                ))}
                                                <div style={{ position: 'relative', width: '26px', height: '26px', background: 'var(--bg)', border: '1.5px dashed #ccc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                    <input type="color" onBlur={(e) => {
                                                        const val = e.target.value;
                                                        if (val && !editingProduct.colors?.includes(val)) {
                                                            setEditingProduct({ ...editingProduct, colors: [...(editingProduct.colors || []), val] });
                                                        }
                                                    }} style={{ position: 'absolute', inset: -5, cursor: 'pointer', opacity: 0 }} />
                                                    <span style={{ fontSize: '0.8rem', color: '#999', fontWeight: 700 }}>+</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            <input 
                                                placeholder="Enter tag..." 
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        const val = (e.target as HTMLInputElement).value.trim();
                                                        if (val) {
                                                            const tags = editingProduct.tags || [];
                                                            if (!tags.includes(val)) setEditingProduct({ ...editingProduct, tags: [...tags, val] });
                                                            (e.target as HTMLInputElement).value = '';
                                                        }
                                                    }
                                                }}
                                                style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1.5px solid rgba(0,0,0,0.03)', fontSize: '0.7rem', background: 'var(--bg)', marginBottom: '4px' }} 
                                            />
                                            {(editingProduct.tags || []).map((tag: string) => (
                                                <div key={tag} style={{ background: 'var(--bg)', padding: '3px 10px', borderRadius: '15px', fontSize: '0.65rem', fontWeight: 700, color: '#666', border: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    #{tag}
                                                    <button onClick={() => setEditingProduct({ ...editingProduct, tags: editingProduct.tags.filter((t: string) => t !== tag) })} style={{ color: '#ff4d4f', border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontSize: '0.6rem' }}>✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* GALERÍA (INFERIOR IZQUIERDA) */}
                        <div style={{ background: 'white', padding: '15px', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: 'var(--shadow-xs)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <label style={{ fontWeight: 800, fontSize: '0.6rem', color: '#888', letterSpacing: '0.5px' }}>GALERÍA ADICIONAL</label>
                                <button onClick={() => galleryInputRef.current?.click()} style={{ background: 'var(--bg)', border: 'none', borderRadius: '10px', padding: '6px 16px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>+ Añadir Fotos</button>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {editingProduct.gallery?.map((img: string, i: number) => (
                                    <div key={i} style={{ position: 'relative', width: '60px', height: '60px' }}>
                                        <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }} />
                                        <button onClick={() => removeGalleryImage(i)} style={{ position: 'absolute', top: -6, right: -6, background: '#ff4d4f', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.6rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>✕</button>
                                    </div>
                                ))}
                            </div>
                            <input type="file" multiple ref={galleryInputRef} onChange={handleGalleryUpload} hidden accept="image/*" />
                        </div>
                    </div>

                    {/* COLUMNA 2: DETALLES (DERECHA - SIDEBAR) */}
                    <div style={{ flex: '0 0 340px', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        
                        {/* CARD DE CONTENIDO EXTENSO */}
                        <div style={{ background: 'white', padding: '18px', borderRadius: '26px', border: '1.5px solid rgba(0,0,0,0.04)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <div>
                                <label style={{ fontWeight: 800, fontSize: '0.7rem', color: 'var(--primary)', marginBottom: '10px', display: 'block', letterSpacing: '0.5px' }}>DESCRIPCIÓN DETALLADA</label>
                                <textarea 
                                    placeholder="Describe tu producto de forma impactante..." 
                                    value={editingProduct.description || ''} 
                                    onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} 
                                    rows={12}
                                    style={{ width: '100%', borderRadius: '14px', padding: '14px', border: '1.5px solid rgba(0,0,0,0.04)', background: 'var(--bg)', fontSize: '0.85rem', resize: 'vertical', lineHeight: '1.6' }} 
                                />
                            </div>

                            <div style={{ height: '1.5px', background: 'rgba(0,0,0,0.04)' }} />

                            <div>
                                <label style={{ fontWeight: 800, fontSize: '0.7rem', color: 'var(--primary)', marginBottom: '10px', display: 'block', letterSpacing: '0.5px' }}>ESPECIFICACIONES / VIÑETAS</label>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                    <input 
                                        value={newDetailInput} 
                                        onChange={e => setNewDetailInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addDetail()}
                                        placeholder="Ej: Resistente al agua..." 
                                        style={{ flex: 1, padding: '12px 14px', borderRadius: '12px', border: '1.5px solid rgba(0,0,0,0.04)', fontSize: '0.8rem', background: 'var(--bg)' }} 
                                    />
                                    <button onClick={addDetail} style={{ background: 'var(--primary)', color: 'white', padding: '0 18px', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer' }}>+</button>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {(editingProduct.details || []).map((d: string, i: number) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg)', padding: '10px 14px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, border: '1px solid rgba(0,0,0,0.02)' }}>
                                            <span style={{ color: 'var(--primary)', fontSize: '1rem' }}>•</span>
                                            <span style={{ flex: 1, color: '#555' }}>{d}</span>
                                            <button onClick={() => removeDetail(i)} style={{ background: 'none', color: '#ff4d4f', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 900 }}>✕</button>
                                        </div>
                                    ))}
                                    {(!editingProduct.details || editingProduct.details.length === 0) && (
                                        <p style={{ fontSize: '0.75rem', color: '#ccc', textAlign: 'center', margin: '15px 0', fontStyle: 'italic' }}>No hay especificaciones aún.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EditProductModal;
