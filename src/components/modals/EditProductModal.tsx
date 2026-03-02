import React, { useState } from 'react';

interface EditProductModalProps {
    editingProduct: any;
    setEditingProduct: (val: any) => void;
    globalCategories: { id: string, name: string }[];
    storeCategories?: { id: string, name: string }[];
    globalTags: string[];
    storeTags?: string[];
    onAddTag?: (tag: string) => void;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleGalleryUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeGalleryImage: (index: number) => void;
    handleAddColor: () => void;
    removeColor: (index: number) => void;
    newColorInput: string;
    setNewColorInput: (val: string) => void;
    isSaving: boolean;
    saveProduct: (data: any) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    galleryInputRef: React.RefObject<HTMLInputElement | null>;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
    editingProduct, setEditingProduct, globalCategories, storeCategories, globalTags, storeTags, onAddTag,
    handleImageUpload, handleGalleryUpload, removeGalleryImage,
    handleAddColor, removeColor, newColorInput, setNewColorInput,
    isSaving, saveProduct, fileInputRef, galleryInputRef
}) => {
    if (!editingProduct) return null;
    const [newTagInput, setNewTagInput] = useState('');
    const availableTags = storeTags?.length ? storeTags : globalTags;
    const availableCategories = storeCategories?.length ? storeCategories.slice(1) : globalCategories.slice(1);

    return (
        <div className="modal-overlay open" onClick={() => setEditingProduct(null)}>
            <div className="modal-card" style={{ maxWidth: '650px', padding: '40px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>{editingProduct.id ? '📝 Editar Producto' : '✨ Nuevo Producto'}</h2>
                    <button onClick={() => setEditingProduct(null)} style={{ background: 'var(--bg)', width: '35px', height: '35px', borderRadius: '50%', fontSize: '1rem', fontWeight: 800 }}>✕</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', marginBottom: '30px' }}>
                    <div>
                        <label style={{ fontWeight: 800, fontSize: '0.7rem', color: 'var(--primary)', letterSpacing: '1px', opacity: 0.8, marginBottom: '10px', display: 'block' }}>PORTADA DEL PRODUCTO</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{ width: '100%', height: '220px', background: 'var(--bg)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', border: '2.5px dashed rgba(0,0,0,0.08)', position: 'relative', transition: 'var(--transition)' }}>
                            {editingProduct.image ? <img src={editingProduct.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center' }}><span style={{ fontSize: '2rem' }}>🖼️</span><p style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6 }}>Subir Imagen</p></div>}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} hidden accept="image/*" />

                        {/* GALLERIA */}
                        <label style={{ fontWeight: 800, fontSize: '0.7rem', color: 'var(--primary)', letterSpacing: '1px', opacity: 0.8, marginTop: '25px', marginBottom: '10px', display: 'block' }}>GALERÍA DE FOTOS</label>
                        <div className="gallery-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '5px 0' }}>
                            <div onClick={() => galleryInputRef.current?.click()} style={{ minWidth: '70px', height: '70px', borderRadius: '15px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px dashed rgba(0,0,0,0.1)' }}><span style={{ fontSize: '1.2rem' }}>+</span></div>
                            {editingProduct.gallery?.map((img: string, i: number) => (
                                <div key={i} style={{ position: 'relative', minWidth: '70px', height: '70px' }}>
                                    <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '15px' }} />
                                    <button onClick={() => removeGalleryImage(i)} style={{ position: 'absolute', top: -5, right: -5, background: 'var(--danger)', color: 'white', borderRadius: '50%', width: '22px', height: '22px', fontSize: '0.7rem' }}>✕</button>
                                </div>
                            ))}
                        </div>
                        <input type="file" multiple ref={galleryInputRef} onChange={handleGalleryUpload} hidden accept="image/*" />

                        {/* COLORES */}
                        <label style={{ fontWeight: 800, fontSize: '0.7rem', color: 'var(--primary)', letterSpacing: '1px', opacity: 0.8, marginTop: '25px', marginBottom: '10px', display: 'block' }}>COLORES</label>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '15px' }}>
                            <input type="color" value={newColorInput} onChange={e => setNewColorInput(e.target.value)} style={{ padding: 0, height: '40px', width: '40px', borderRadius: '50%', border: 'none', cursor: 'pointer' }} />
                            <button onClick={handleAddColor} className="btn-wa" style={{ border: '1px solid var(--primary)' }}>+ Agregar</button>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {editingProduct.colors?.map((c: string, i: number) => (
                                <div key={i} style={{ width: '30px', height: '30px', borderRadius: '50%', background: c, border: '1px solid rgba(0,0,0,0.1)', position: 'relative', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                                    <button onClick={() => removeColor(i)} style={{ position: 'absolute', top: -8, right: -8, background: 'var(--primary)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.6rem' }}>✕</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Nombre del Producto</label>
                            <input type="text" placeholder="Ej: Café Blend Selva" value={editingProduct.title} onChange={e => setEditingProduct({ ...editingProduct, title: e.target.value })} style={{ borderRadius: '15px', padding: '15px', border: '1px solid rgba(0,0,0,0.08)', background: 'var(--bg)' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Precio (S/.)</label>
                                <input type="number" placeholder="0.00" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })} style={{ borderRadius: '15px', padding: '15px', border: '1px solid rgba(0,0,0,0.08)', background: 'var(--bg)' }} />
                            </div>
                            <div>
                                <label style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Categoría</label>
                                <select value={editingProduct.categoryId} onChange={e => setEditingProduct({ ...editingProduct, categoryId: e.target.value })} style={{ borderRadius: '15px', padding: '15px', border: '1px solid rgba(0,0,0,0.08)', background: 'var(--bg)' }}>
                                    {availableCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '10px', display: 'block' }}>Etiquetas del Producto</label>
                            {/* Available tags as pills */}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
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
                                            padding: '8px 18px', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(0,0,0,0.08)', transition: 'var(--transition)', cursor: 'pointer'
                                        }}>
                                        #{tag}
                                    </button>
                                ))}
                                {availableTags.length === 0 && <p style={{ fontSize: '0.7rem', opacity: 0.5, fontStyle: 'italic' }}>Aún no hay etiquetas. Añade una abajo.</p>}
                            </div>
                            {/* Inline add new tag */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    value={newTagInput}
                                    onChange={e => setNewTagInput(e.target.value)}
                                    placeholder="Nueva etiqueta (ej: vegano)..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newTagInput.trim()) {
                                            const t = newTagInput.trim().toLowerCase();
                                            onAddTag?.(t);
                                            const tags = editingProduct.tags || [];
                                            if (!tags.includes(t)) setEditingProduct({ ...editingProduct, tags: [...tags, t] });
                                            setNewTagInput('');
                                        }
                                    }}
                                    style={{ flex: 1, padding: '9px 14px', borderRadius: '30px', border: '1px solid rgba(0,0,0,0.1)', background: 'var(--bg)', fontSize: '0.8rem', outline: 'none' }}
                                />
                                <button onClick={() => {
                                    if (newTagInput.trim()) {
                                        const t = newTagInput.trim().toLowerCase();
                                        onAddTag?.(t);
                                        const tags = editingProduct.tags || [];
                                        if (!tags.includes(t)) setEditingProduct({ ...editingProduct, tags: [...tags, t] });
                                        setNewTagInput('');
                                    }
                                }} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '9px 16px', borderRadius: '30px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}>+ Añadir</button>
                            </div>
                        </div>
                        <div>
                            <label style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>WhatsApp Directo (Opcional)</label>
                            <input type="text" placeholder="Ej: 519XXXXXXXX" value={editingProduct.waNumber || ''} onChange={e => setEditingProduct({ ...editingProduct, waNumber: e.target.value })} style={{ borderRadius: '15px', padding: '15px', border: '1px solid rgba(0,0,0,0.08)', background: 'var(--bg)' }} />
                            <p style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '5px' }}>Si se deja vacío, usará el global de la tienda.</p>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                    <button onClick={() => setEditingProduct(null)} style={{ flex: 1, padding: '18px', borderRadius: '30px', fontWeight: 800, background: 'var(--bg)', color: 'var(--text)' }}>Cancelar</button>
                    <button onClick={() => saveProduct(editingProduct)} className="btn-cart" style={{ flex: 1, padding: '18px', borderRadius: '30px' }} disabled={isSaving}>
                        {isSaving ? '⏳ Guardando...' : 'Guardar ✨'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditProductModal;
