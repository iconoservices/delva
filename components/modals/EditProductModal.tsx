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
    generateSuggestedSKU: (categoryId: string, title: string, color?: string) => string;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
    editingProduct, setEditingProduct, globalCategories, globalTags,
    handleImageUpload, handleGalleryUpload, removeGalleryImage,
    isSaving, saveProduct, fileInputRef, galleryInputRef, products,
    generateSuggestedSKU
}) => {
    const [newDetailInput, setNewDetailInput] = useState('');
    
    if (!editingProduct) return null;

    const availableTags = globalTags;
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

    // --- Navegación (Prev / Next) ---
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
                padding: 'clamp(10px, 2vw, 20px)', 
                margin: 0, 
                backgroundColor: 'white',
                overflowY: 'auto' 
            }} onClick={e => e.stopPropagation()}>
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
                    
                    {/* BOTONES DE ACCIÓN EN EL HEADER */}
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

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px', alignItems: 'flex-start' }}>
                    
                        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        
                        {/* SECCIÓN: MULTIMEDIA (Movido Arriba) */}
                        <div>
                            <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: 'var(--primary)', fontWeight: 900 }}>Archivos Multimedia</h3>
                            
                            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                {/* Portada Principal */}
                                <div>
                                    <label style={{ fontWeight: 800, fontSize: '0.65rem', color: '#888', letterSpacing: '1px', marginBottom: '8px', display: 'block' }}>PORTADA PRINCIPAL</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{ width: '150px', height: '150px', background: 'var(--bg)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', border: '2px dashed rgba(0,0,0,0.1)', position: 'relative' }}>
                                        {editingProduct.image ? <img src={editingProduct.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center' }}><span style={{ fontSize: '1.5rem' }}>🖼️</span><p style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.5, marginTop: '5px' }}>Clic para Subir</p></div>}
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} hidden accept="image/*" />
                                </div>

                                {/* Galería Secundaria */}
                                <div style={{ flex: 1, minWidth: '180px' }}>
                                    <label style={{ fontWeight: 800, fontSize: '0.65rem', color: '#888', letterSpacing: '1px', marginBottom: '8px', display: 'block' }}>GALERÍA ADICIONAL</label>
                                    <div className="gallery-scroll" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        <div onClick={() => galleryInputRef.current?.click()} style={{ width: '70px', height: '70px', borderRadius: '10px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px dashed rgba(0,0,0,0.1)' }}><span style={{ fontSize: '1.2rem', opacity: 0.5 }}>+</span></div>
                                        {editingProduct.gallery?.map((img: string, i: number) => (
                                            <div key={i} style={{ position: 'relative', width: '70px', height: '70px' }}>
                                                <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
                                                <button onClick={() => removeGalleryImage(i)} style={{ position: 'absolute', top: -4, right: -4, background: 'var(--danger)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.55rem', border: 'none', cursor: 'pointer' }}>✕</button>
                                            </div>
                                        ))}
                                    </div>
                                    <input type="file" multiple ref={galleryInputRef} onChange={handleGalleryUpload} hidden accept="image/*" />
                                </div>
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.05)', margin: '2px 0' }} />

                        {/* SECCIÓN: INFORMACIÓN BÁSICA */}
                        <div>
                            <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: 'var(--primary)', fontWeight: 900 }}>Información General</h3>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '5px', display: 'block' }}>Nombre del Producto</label>
                                <input type="text" placeholder="Ej: Café Blend Selva" value={editingProduct.title} onChange={e => setEditingProduct({ ...editingProduct, title: e.target.value })} style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', border: '1px solid rgba(0,0,0,0.08)', background: 'var(--bg)', fontSize: '0.85rem' }} />
                            </div>

                            <div>
                                <label style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '8px', display: 'block' }}>Detalles (Viñetas / Características)</label>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                    <input 
                                        value={newDetailInput} 
                                        onChange={e => setNewDetailInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addDetail()}
                                        placeholder="Ej: 100% Orgánico..." 
                                        style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', border: '1px solid #eee', fontSize: '0.85rem', background: 'var(--bg)' }} 
                                    />
                                    <button onClick={addDetail} style={{ background: 'var(--primary)', color: 'white', padding: '0 16px', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem' }}>Añadir</button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {(editingProduct.details || []).map((d: string, i: number) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.75rem', border: '1px solid rgba(0,0,0,0.03)' }}>
                                            <span>✓ {d}</span>
                                            <button onClick={() => removeDetail(i)} style={{ background: 'none', color: '#ff4d4f', fontWeight: 900, cursor: 'pointer', border: 'none' }}>✕</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.05)', margin: '2px 0' }} />

                        {/* SECCIÓN: PRECIOS */}
                        <div>
                            <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: 'var(--primary)', fontWeight: 900 }}>Precios e Inventario</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '5px', display: 'block' }}>Precio Regular (S/)</label>
                                    <input type="number" value={editingProduct.price || ''} onChange={e => {
                                        const val = e.target.value ? Number(e.target.value) : 0;
                                        setEditingProduct({ ...editingProduct, price: val, hasOffer: !!(editingProduct.originalPrice && editingProduct.originalPrice > val) });
                                    }} placeholder="Ej: 119" style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', border: '1px solid rgba(0,0,0,0.08)', background: 'var(--bg)', fontSize: '0.85rem' }} />
                                </div>
                                <div>
                                    <label style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '5px', display: 'block', color: '#888' }}>Precio Tachado (Opcional)</label>
                                    <input type="number" value={editingProduct.originalPrice || ''} onChange={e => {
                                        const val = e.target.value ? Number(e.target.value) : 0;
                                        setEditingProduct({ ...editingProduct, originalPrice: val, hasOffer: !!(editingProduct.price && val > editingProduct.price) });
                                    }} placeholder="Ej: 150" style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', border: '1px solid rgba(0,0,0,0.08)', background: 'var(--bg)', fontSize: '0.85rem' }} />
                                </div>
                                <div>
                                    <label style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '5px', display: 'block' }}>Stock Disponible</label>
                                    <input type="number" value={editingProduct.stock ?? 0} onChange={e => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })} style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', border: '1px solid rgba(0,0,0,0.08)', background: 'var(--bg)', fontSize: '0.85rem' }} />
                                </div>
                                <div>
                                    <label style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '5px', display: 'block' }}>SKU (Código Interno)</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input 
                                            type="text" 
                                            value={editingProduct.sku || ''} 
                                            onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value.toUpperCase() })} 
                                            placeholder="Ej: LNT-PIL-NEG" 
                                            style={{ flex: 1, borderRadius: '12px', padding: '10px 14px', border: '1px solid rgba(0,0,0,0.08)', background: 'var(--bg)', fontSize: '0.85rem' }} 
                                        />
                                        <button 
                                            onClick={() => {
                                                const suggested = generateSuggestedSKU(editingProduct.categoryId, editingProduct.title, editingProduct.details?.[0] || '');
                                                setEditingProduct({ ...editingProduct, sku: suggested });
                                            }}
                                            title="Generar SKU Automático"
                                            style={{ padding: '0 12px', borderRadius: '12px', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: 900, cursor: 'pointer' }}
                                        >
                                            ✨
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA 2: BARRA LATERAL (DERECHA) */}
                    <div style={{ flex: '1 1 300px', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: 'var(--primary)', fontWeight: 900 }}>Organización</h3>
                            <p style={{ margin: '0 0 15px 0', fontSize: '0.7rem', color: '#888' }}>Clasifica tu producto para que sea fácil de encontrar.</p>
                            
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '5px', display: 'block' }}>Categoría Principal</label>
                                <select 
                                    value={availableCategories.some(c => c.id === editingProduct.categoryId) ? editingProduct.categoryId : availableCategories[0]?.id || ''} 
                                    onChange={e => {
                                        const catId = e.target.value;
                                        const catName = globalCategories.find(c => c.id === catId)?.name || '';
                                        setEditingProduct({ 
                                            ...editingProduct, 
                                            categoryId: catId, 
                                            category: catName,
                                            subCategoryId: '' 
                                        });
                                    }} 
                                    style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', border: '1px solid rgba(0,0,0,0.08)', background: 'var(--bg)', fontFamily: 'inherit', fontSize: '0.85rem' }}
                                >
                                    {availableCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            {/* SUBCATEGORÍAS */}
                            {globalCategories.find(c => c.id === editingProduct.categoryId)?.subCategories?.length ? (
                                <div className="fade-in" style={{ marginBottom: '15px' }}>
                                    <label style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '5px', display: 'block', color: '#666' }}>Subcategoría (Opcional)</label>
                                    <select
                                        value={editingProduct.subCategoryId || ''}
                                        onChange={e => setEditingProduct({ 
                                            ...editingProduct, 
                                            subCategoryId: e.target.value,
                                            subSubCategoryId: '' // Limpiar al cambiar subcat
                                        })}
                                        style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', border: '1px solid rgba(0,0,0,0.08)', background: 'var(--bg)', fontFamily: 'inherit', fontSize: '0.85rem' }}
                                    >
                                        <option value="">Ninguna</option>
                                        {globalCategories.find(c => c.id === editingProduct.categoryId)?.subCategories?.map((s: any) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : null}

                            {/* Nivel 3 */}
                            {globalCategories.find(c => c.id === editingProduct.categoryId)?.subCategories?.find((s: any) => s.id === editingProduct.subCategoryId)?.subCategories?.length ? (
                                <div className="fade-in">
                                    <label style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '5px', display: 'block', color: '#666' }}>Nivel 3 (Opcional)</label>
                                    <select
                                        value={editingProduct.subSubCategoryId || ''}
                                        onChange={e => setEditingProduct({ ...editingProduct, subSubCategoryId: e.target.value })}
                                        style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', border: '1px solid rgba(0,0,0,0.08)', background: 'var(--bg)', fontFamily: 'inherit', fontSize: '0.85rem' }}
                                    >
                                        <option value="">Ninguno</option>
                                        {globalCategories.find(c => c.id === editingProduct.categoryId)
                                            ?.subCategories?.find((s: any) => s.id === editingProduct.subCategoryId)
                                            ?.subCategories?.map((ss: any) => (
                                                <option key={ss.id} value={ss.id}>{ss.name}</option>
                                            ))}
                                    </select>
                                </div>
                            ) : null}
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.05)', margin: '5px 0' }} />

                        <div>
                            <label style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '8px', display: 'block' }}>Etiquetas Destacadas</label>
                            
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                <input 
                                    type="text" 
                                    placeholder="Añadir y [Enter]..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const val = (e.target as HTMLInputElement).value.trim().toLowerCase().replace(/\s+/g, '-');
                                            if (val) {
                                                const tags = editingProduct.tags || [];
                                                if (!tags.includes(val)) setEditingProduct({ ...editingProduct, tags: [...tags, val] });
                                                (e.target as HTMLInputElement).value = '';
                                            }
                                        }
                                    }}
                                    style={{ flex: 1, padding: '8px 12px', borderRadius: '10px', border: '1px solid #eee', fontSize: '0.8rem', background: 'var(--bg)' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                {availableTags.map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => {
                                            const tags = editingProduct.tags || [];
                                            const newTags = tags.includes(tag) ? tags.filter((t: string) => t !== tag) : [...tags, tag];
                                            setEditingProduct({ ...editingProduct, tags: newTags });
                                        }}
                                        style={{
                                            background: editingProduct.tags?.includes(tag) ? 'var(--primary)' : 'white',
                                            color: editingProduct.tags?.includes(tag) ? 'white' : 'var(--text)',
                                            padding: '6px 12px', borderRadius: '15px', fontSize: '0.7rem', fontWeight: 700, border: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer', transition: '0.2s'
                                        }}>
                                        #{tag}
                                    </button>
                                ))}
                                {editingProduct.tags?.filter((t: string) => !availableTags.includes(t)).map((tag: string) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => {
                                            const tags = editingProduct.tags || [];
                                            setEditingProduct({ ...editingProduct, tags: tags.filter((t: string) => t !== tag) });
                                        }}
                                        style={{
                                            background: 'var(--primary)', color: 'white',
                                            padding: '6px 12px', borderRadius: '15px', fontSize: '0.7rem', fontWeight: 700, border: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer'
                                        }}>
                                        #{tag} ✕
                                    </button>
                                ))}
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.05)', margin: '5px 0' }} />

                        <div>
                            <label style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '5px', display: 'block' }}>WhatsApp Directo (Vendedor Externo)</label>
                            <input type="text" placeholder="Ej: 519XXXXXXXX" value={editingProduct.waNumber || ''} onChange={e => setEditingProduct({ ...editingProduct, waNumber: e.target.value })} style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', border: '1px solid rgba(0,0,0,0.08)', background: 'white', fontSize: '0.85rem' }} />
                            <p style={{ margin: '5px 0 0 0', fontSize: '0.65rem', color: '#888' }}>Déjalo en blanco si usas el global.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditProductModal;
