import React, { useState } from 'react';

interface EditProductModalProps {
    editingProduct: any;
    setEditingProduct: (val: any) => void;
    globalCategories: { id: string, name: string }[];
    globalTags: string[];
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleGalleryUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeGalleryImage: (index: number) => void;
    isSaving: boolean;
    saveProduct: (data: any) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    galleryInputRef: React.RefObject<HTMLInputElement | null>;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
    editingProduct, setEditingProduct, globalCategories, globalTags,
    handleImageUpload, handleGalleryUpload, removeGalleryImage,
    isSaving, saveProduct, fileInputRef, galleryInputRef
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

    return (
        <div className="modal-overlay open" onClick={() => setEditingProduct(null)}>
            <div className="modal-card" style={{ maxWidth: '1000px', width: '95%', padding: 'clamp(15px, 4vw, 30px)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>{editingProduct.id ? '📝 Editar Producto' : '✨ Nuevo Producto'}</h2>
                    <button onClick={() => setEditingProduct(null)} style={{ background: 'var(--bg)', width: '35px', height: '35px', borderRadius: '50%', fontSize: '1rem', fontWeight: 800 }}>✕</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '30px' }}>
                    {/* COLUMNA 1: IMAGEN Y DETALLES */}
                    <div>
                        <label style={{ fontWeight: 800, fontSize: '0.7rem', color: 'var(--primary)', letterSpacing: '1px', opacity: 0.8, marginBottom: '10px', display: 'block' }}>PORTADA</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{ width: '160px', height: '160px', background: 'var(--bg)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', border: '2.5px dashed rgba(0,0,0,0.08)', position: 'relative', marginBottom: '20px' }}>
                            {editingProduct.image ? <img src={editingProduct.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center' }}><span style={{ fontSize: '1.5rem' }}>🖼️</span><p style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.6 }}>Subir</p></div>}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} hidden accept="image/*" />

                        {/* DETALLES LIST */}
                        <label style={{ fontWeight: 800, fontSize: '0.7rem', color: 'var(--primary)', letterSpacing: '1px', opacity: 0.8, marginBottom: '10px', display: 'block' }}>DETALLES DEL PRODUCTO</label>
                        <div style={{ background: 'var(--bg)', padding: '15px', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                <input 
                                    value={newDetailInput} 
                                    onChange={e => setNewDetailInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addDetail()}
                                    placeholder="Ej: 100% Orgánico..." 
                                    style={{ flex: 1, padding: '10px 15px', borderRadius: '12px', border: '1px solid #eee', fontSize: '0.8rem' }} 
                                />
                                <button onClick={addDetail} style={{ background: 'var(--primary)', color: 'white', padding: '0 15px', borderRadius: '12px', fontWeight: 800 }}>+</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {(editingProduct.details || []).map((d: string, i: number) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '8px 12px', borderRadius: '10px', fontSize: '0.75rem', border: '1px solid #f0f0f0' }}>
                                        <span>✓ {d}</span>
                                        <button onClick={() => removeDetail(i)} style={{ background: 'none', color: '#ff4d4f', fontWeight: 900 }}>✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA 2: INFO BÁSICA */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Nombre del Producto</label>
                            <input type="text" placeholder="Ej: Café Blend Selva" value={editingProduct.title} onChange={e => setEditingProduct({ ...editingProduct, title: e.target.value })} style={{ borderRadius: '15px', padding: '12px', border: '1px solid rgba(0,0,0,0.08)', background: 'var(--bg)' }} />
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Precio Original</label>
                                <input type="number" value={editingProduct.originalPrice || ''} onChange={e => {
                                    const val = e.target.value ? Number(e.target.value) : 0;
                                    setEditingProduct({ ...editingProduct, originalPrice: val, hasOffer: !!(editingProduct.price && val > editingProduct.price) });
                                }} style={{ width: '100%', borderRadius: '15px', padding: '12px', border: '1px solid rgba(0,0,0,0.08)', background: 'var(--bg)' }} />
                            </div>
                            <div>
                                <label style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Precio Oferta</label>
                                <input type="number" value={editingProduct.price || ''} onChange={e => {
                                    const val = e.target.value ? Number(e.target.value) : 0;
                                    setEditingProduct({ ...editingProduct, price: val, hasOffer: !!(editingProduct.originalPrice && editingProduct.originalPrice > val) });
                                }} style={{ width: '100%', borderRadius: '15px', padding: '12px', border: '1px solid rgba(0,0,0,0.08)', background: 'var(--bg)' }} />
                            </div>
                        </div>

                        <div>
                            <label style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Categoría</label>
                            <select value={editingProduct.categoryId} onChange={e => setEditingProduct({ ...editingProduct, categoryId: e.target.value })} style={{ width: '100%', borderRadius: '15px', padding: '12px', border: '1px solid rgba(0,0,0,0.08)', background: 'var(--bg)' }}>
                                {availableCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Stock Disponible</label>
                            <input type="number" value={editingProduct.stock ?? 0} onChange={e => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })} style={{ width: '100%', borderRadius: '15px', padding: '12px', border: '1px solid rgba(0,0,0,0.08)', background: 'var(--bg)' }} />
                        </div>
                    </div>

                    {/* COLUMNA 3: EXTRAS Y GALERÍA */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ fontWeight: 800, fontSize: '0.7rem', color: 'var(--primary)', letterSpacing: '1px', opacity: 0.8, marginBottom: '10px', display: 'block' }}>GALERÍA</label>
                            <div className="gallery-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '5px 0' }}>
                                <div onClick={() => galleryInputRef.current?.click()} style={{ minWidth: '60px', height: '60px', borderRadius: '12px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px dashed rgba(0,0,0,0.1)' }}><span style={{ fontSize: '1.2rem' }}>+</span></div>
                                {editingProduct.gallery?.map((img: string, i: number) => (
                                    <div key={i} style={{ position: 'relative', minWidth: '60px', height: '60px' }}>
                                        <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                                        <button onClick={() => removeGalleryImage(i)} style={{ position: 'absolute', top: -5, right: -5, background: 'var(--danger)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.6rem' }}>✕</button>
                                    </div>
                                ))}
                            </div>
                            <input type="file" multiple ref={galleryInputRef} onChange={handleGalleryUpload} hidden accept="image/*" />
                        </div>

                        <div>
                            <label style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '8px', display: 'block' }}>Etiquetas</label>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                {availableTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => {
                                            const tags = editingProduct.tags || [];
                                            const newTags = tags.includes(tag) ? tags.filter((t: string) => t !== tag) : [...tags, tag];
                                            setEditingProduct({ ...editingProduct, tags: newTags });
                                        }}
                                        style={{
                                            background: editingProduct.tags?.includes(tag) ? 'var(--primary)' : 'var(--bg)',
                                            color: editingProduct.tags?.includes(tag) ? 'white' : 'var(--text)',
                                            padding: '6px 12px', borderRadius: '30px', fontSize: '0.7rem', fontWeight: 700, border: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer'
                                        }}>
                                        #{tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>WhatsApp Directo</label>
                            <input type="text" placeholder="Ej: 519XXXXXXXX" value={editingProduct.waNumber || ''} onChange={e => setEditingProduct({ ...editingProduct, waNumber: e.target.value })} style={{ borderRadius: '15px', padding: '12px', border: '1px solid rgba(0,0,0,0.08)', background: 'var(--bg)' }} />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                    <button onClick={() => setEditingProduct(null)} style={{ flex: 1, padding: '16px', borderRadius: '30px', fontWeight: 800, background: 'var(--bg)', color: 'var(--text)' }}>Cancelar</button>
                    <button onClick={() => saveProduct(editingProduct)} className="btn-vibrant" style={{ flex: 1.5, padding: '16px', borderRadius: '30px' }} disabled={isSaving}>
                        {isSaving ? '⏳ Guardando...' : 'GUARDAR PRODUCTO ✨'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditProductModal;
