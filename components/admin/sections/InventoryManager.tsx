import React, { useState } from 'react';
import { doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product } from '@/lib/data/products';
import type { User } from '@/lib/types';

interface InventoryManagerProps {
    effectiveStoreId: string;
    storeProducts: Product[];
    setEditingProduct: (p: Product | null) => void;
    globalCategories: { id: string, name: string, color?: string, icon?: string, subCategories?: any[] }[];
    saveGlobalCategories?: (newCats: any[]) => Promise<void>;
    confirmAction: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void;
    onRecordSale?: (product: Product) => void;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({
    effectiveStoreId, storeProducts, setEditingProduct, globalCategories, saveGlobalCategories = async () => {}, confirmAction, onRecordSale
}) => {
    const [subTab, setSubTab] = useState<'products' | 'categories'>('products');
    const [search, setSearch] = useState('');
    const [catSearch, setCatSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filterCat, setFilterCat] = useState('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az' | 'za' | 'price_asc' | 'price_desc' | 'stock'>('newest');

    // --- CATEGORIES INLINE EDITING ---
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempValue, setTempValue] = useState('');

    const handleStartEdit = (id: string, current: string) => {
        setEditingId(id);
        setTempValue(current);
    };

    const slugify = (title: string) =>
        title?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 40) || 'item';

    const handleSaveEdit = (_type: string, path: string[], value: string, extra?: { color?: string, icon?: string, slug?: string }) => {
        let updated = [...globalCategories];
        
        const updateRecursive = (list: any[], currentPath: string[]): any[] => {
            const [head, ...tail] = currentPath;
            return list.map(item => {
                if (item.id === head) {
                    if (tail.length === 0) {
                        return { 
                            ...item, 
                            name: value || item.name,
                            slug: extra?.slug ?? slugify(value || item.name),
                            color: extra?.color ?? item.color,
                            icon: extra?.icon ?? item.icon
                        };
                    }
                    return { ...item, subCategories: updateRecursive(item.subCategories || [], tail) };
                }
                return item;
            });
        };

        updated = updateRecursive(updated, path);
        saveGlobalCategories(updated);
        setEditingId(null);
    };

    const handleAddNode = (path: string[]) => {
        const id = `${path.length > 0 ? 'sub' : 'cat'}-${Date.now()}`;
        const defaultName = "Nueva Categoría";
        const slug = slugify(defaultName);
        let updated = [...globalCategories];

        const addRecursive = (list: any[], currentPath: string[]): any[] => {
            if (currentPath.length === 0) {
                return [...list, { id, name: defaultName, slug, subCategories: [], color: '#08979C', icon: '📁' }];
            }
            const [head, ...tail] = currentPath;
            return list.map(item => {
                if (item.id === head) {
                    return { ...item, subCategories: addRecursive(item.subCategories || [], tail) };
                }
                return item;
            });
        };

        updated = addRecursive(updated, path);
        saveGlobalCategories(updated);
        handleStartEdit(id, defaultName);
    };

    const handleDeleteNode = (path: string[]) => {
        let updated = [...globalCategories];

        const deleteRecursive = (list: any[], currentPath: string[]): any[] => {
            const [head, ...tail] = currentPath;
            if (tail.length === 0) {
                return list.filter(item => item.id !== head);
            }
            return list.map(item => {
                if (item.id === head) {
                    return { ...item, subCategories: deleteRecursive(item.subCategories || [], tail) };
                }
                return item;
            });
        };

        updated = deleteRecursive(updated, path);
        saveGlobalCategories(updated);
    };

    const togglePublish = async (p: Product) => {
        await setDoc(doc(db, 'products', p.id), { published: !(p as any).published }, { merge: true });
    };

    const filtered = (() => {
        let list = [...storeProducts];
        if (search) list = list.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()));
        if (filterCat === '__none__') list = list.filter(p => !(p as any).categoryId || (p as any).categoryId === '' || (p as any).categoryId === 'all');
        else if (filterCat !== 'all') list = list.filter(p => (p as any).categoryId === filterCat);
        
        if (filterStatus === 'published') list = list.filter(p => (p as any).published);
        if (filterStatus === 'draft') list = list.filter(p => !(p as any).published);

        list.sort((a, b) => {
            const aTime = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : storeProducts.indexOf(a);
            const bTime = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : storeProducts.indexOf(b);
            if (sortBy === 'newest') return bTime - aTime;
            if (sortBy === 'oldest') return aTime - bTime;
            if (sortBy === 'az') return (a.title || '').localeCompare(b.title || '');
            if (sortBy === 'za') return (b.title || '').localeCompare(a.title || '');
            if (sortBy === 'price_asc') return Number(a.price || 0) - Number(b.price || 0);
            if (sortBy === 'price_desc') return Number(b.price || 0) - Number(a.price || 0);
            if (sortBy === 'stock') return Number((b as any).stock || 0) - Number((a as any).stock || 0);
            return 0;
        });
        return list;
    })();

    return (
        <div className="fade-in">
            {/* INVENTORY HEADER & TABS ROW */}
            <div style={{ display: 'flex', flexWrap: 'wrap-reverse', alignItems: 'center', justifyContent: 'space-between', gap: '15px', marginBottom: '20px', padding: '0 5px' }}>
                <div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0, color: 'var(--primary)' }}>Gestión de Inventario 🌿</h2>
                    {subTab === 'products' && <p style={{ fontSize: '0.8rem', color: '#888', margin: '4px 0 0' }}>{storeProducts.length} productos en total</p>}
                    {subTab === 'categories' && <p style={{ fontSize: '0.8rem', color: '#888', margin: '4px 0 0' }}>Gestión de categorías globales</p>}
                </div>

                <div style={{ display: 'flex', gap: '8px', background: '#f5f5f5', padding: '5px', borderRadius: '18px' }}>
                    <button onClick={() => setSubTab('products')} style={{ padding: '8px 18px', borderRadius: '14px', border: 'none', background: subTab === 'products' ? 'white' : 'transparent', color: subTab === 'products' ? 'var(--primary)' : '#888', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer' }}>📦 PRODUCTOS</button>
                    <button onClick={() => setSubTab('categories')} style={{ padding: '8px 18px', borderRadius: '14px', border: 'none', background: subTab === 'categories' ? 'white' : 'transparent', color: subTab === 'categories' ? 'var(--primary)' : '#888', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer' }}>🌳 CATEGORÍAS</button>
                </div>
            </div>

            {subTab === 'products' && (
                <>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', overflowX: 'auto', flex: 1 }}>
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="🔍 Buscar..."
                                style={{ flex: '0 0 160px', height: '40px', padding: '0 14px', borderRadius: '15px', border: '1.5px solid #eee', outline: 'none' }}
                            />
                            <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ height: '40px', borderRadius: '14px', border: '1.5px solid #eee', background: 'white', padding: '0 10px' }}>
                                <option value="all">📂 Categoría</option>
                                <option value="__none__">⚠️ Sin Categoría</option>
                                {globalCategories.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} style={{ height: '40px', borderRadius: '14px', border: '1.5px solid #eee', background: 'white', padding: '0 10px' }}>
                                <option value="all">👁️ Estado</option>
                                <option value="published">✅ Live</option>
                                <option value="draft">⏸️ Off</option>
                            </select>
                            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ height: '40px', borderRadius: '14px', border: '1.5px solid #eee', background: 'white', padding: '0 10px' }}>
                                <option value="newest">🕒 Recientes</option>
                                <option value="oldest">📅 Antiguos</option>
                                <option value="price_asc">💰 Precio ↑</option>
                                <option value="price_desc">💰 Precio ↓</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} style={{ height: '40px', width: '40px', borderRadius: '14px', border: 'none', background: '#f5f5f5', fontWeight: 800 }}>{viewMode === 'grid' ? '☰' : '▦'}</button>
                            <button onClick={() => setEditingProduct({ title: '', price: '', categoryId: globalCategories[1]?.id || 'cat-original', userId: effectiveStoreId, published: true } as any)} style={{ height: '40px', padding: '0 20px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 900 }}>+ NUEVO</button>
                        </div>
                    </div>

                    {viewMode === 'grid' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                            {filtered.map(p => {
                                const isPublished = (p as any).published;
                                return (
                                <div key={p.id} style={{ display: 'flex', background: '#111', borderRadius: '16px', overflow: 'hidden', height: '110px', position: 'relative', border: '1px solid #222' }}>
                                    <div style={{ width: '110px', height: '110px', background: '#1a1a1a', flexShrink: 0 }}>
                                        <img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={p.title} />
                                    </div>
                                    <div style={{ flex: 1, padding: '10px 12px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                                        <p style={{ color: 'white', fontWeight: 800, fontSize: '0.85rem', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</p>
                                        <p style={{ color: '#555', fontSize: '0.58rem', margin: '0 0 4px' }}>/shop/{slugify(p.title)}</p>
                                        <p style={{ color: 'var(--accent)', fontWeight: 900, fontSize: '0.82rem', margin: '0 0 6px' }}>S/ {Number(p.price || 0).toFixed(2)}</p>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 'auto' }}>
                                            <div onClick={(e) => { e.stopPropagation(); togglePublish(p); }} style={{ width: '28px', height: '16px', borderRadius: '8px', background: isPublished ? '#00b96b' : '#333', position: 'relative', cursor: 'pointer' }}>
                                                <div style={{ position: 'absolute', top: '2px', left: isPublished ? '14px' : '2px', width: '12px', height: '12px', borderRadius: '50%', background: 'white' }} />
                                            </div>
                                            <span style={{ fontSize: '0.6rem', color: isPublished ? '#00b96b' : '#333', fontWeight: 800 }}>{isPublished ? 'Live' : 'Off'}</span>
                                        </div>
                                    </div>
                                    <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', gap: '6px' }}>
                                        <button onClick={(e) => { e.stopPropagation(); onRecordSale && onRecordSale(p); }} style={{ background: '#00b96b22', color: '#00b96b', border: 'none', width: '28px', height: '28px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer' }}>+</button>
                                        <button onClick={(e) => { e.stopPropagation(); setEditingProduct(p); }} style={{ background: '#ffffff11', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.7rem' }}>✏️</button>
                                        <button onClick={(e) => { e.stopPropagation(); confirmAction('Borrar', `¿Eliminar "${p.title}"?`, () => deleteDoc(doc(db, 'products', p.id))); }} style={{ background: '#ff4d4f11', border: 'none', color: '#ff4d4f', width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.7rem' }}>🗑️</button>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {filtered.map(p => (
                                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'white', padding: '12px 18px', borderRadius: '18px', border: '1px solid #f0f0f0' }}>
                                    <img src={p.image} style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', background: '#f5f5f5' }} alt={p.title} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontWeight: 800, margin: 0, fontSize: '0.9rem' }}>{p.title}</p>
                                        <p style={{ color: '#aaa', fontSize: '0.7rem', margin: 0 }}>S/ {p.price} · /shop/{slugify(p.title)}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <button onClick={() => onRecordSale && onRecordSale(p)} style={{ background: '#00b96b', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '10px', fontWeight: 900, fontSize: '0.8rem' }}>+</button>
                                        <button onClick={() => setEditingProduct(p)} style={{ background: '#f5f5f5', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: 800, fontSize: '0.75rem' }}>✏️ Editar</button>
                                        <button onClick={() => confirmAction('Borrar', `¿Eliminar "${p.title}"?`, () => deleteDoc(doc(db, 'products', p.id)))} style={{ background: '#FFF1F0', color: '#CF1322', border: 'none', width: '36px', height: '36px', borderRadius: '10px' }}>🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {subTab === 'categories' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'white', padding: '25px', borderRadius: '24px', border: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <input value={catSearch} onChange={e => setCatSearch(e.target.value)} placeholder="🔍 Buscar categoría..." style={{ flex: 1, padding: '12px 16px', borderRadius: '15px', border: '1.5px solid #eee', outline: 'none', fontSize: '0.9rem' }} />
                        <button onClick={() => handleAddNode([])} style={{ padding: '12px 22px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 900, fontSize: '0.82rem' }}>+ NUEVA CATEGORÍA</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {globalCategories
                            .filter(c => c.id !== 'all' && (c.name || '').toLowerCase().includes(catSearch.toLowerCase()))
                            .map((cat, idx) => (
                                <CategoryNode 
                                    key={`${cat.id}-${idx}`}
                                    node={cat}
                                    path={[cat.id]}
                                    level={0}
                                    parentSlug=""
                                    editingId={editingId}
                                    tempValue={tempValue}
                                    setTempValue={setTempValue}
                                    handleStartEdit={handleStartEdit}
                                    handleSaveEdit={handleSaveEdit}
                                    handleAddNode={handleAddNode}
                                    handleDeleteNode={handleDeleteNode}
                                    confirmAction={confirmAction}
                                />
                            ))
                        }
                    </div>
                </div>
            )}
        </div>
    );
};

const CategoryNode: React.FC<{
    node: any, path: string[], level: number, parentSlug: string, editingId: string | null, tempValue: string,
    setTempValue: (v: string) => void, handleStartEdit: (id: string, name: string) => void,
    handleSaveEdit: (type: any, path: string[], val: string, extra?: any) => void,
    handleAddNode: (path: string[]) => void, handleDeleteNode: (path: string[]) => void, confirmAction: any
}> = ({ node, path, level, parentSlug, editingId, tempValue, setTempValue, handleStartEdit, handleSaveEdit, handleAddNode, handleDeleteNode, confirmAction }) => {
    const isEditing = editingId === node.id;
    const currentFullSlug = parentSlug ? `${parentSlug}/${node.slug || node.id}` : `/${node.slug || node.id}`;

    return (
        <div style={{ background: level === 0 ? 'white' : 'transparent', borderRadius: level === 0 ? '20px' : '0', padding: level === 0 ? '5px' : '0', border: level === 0 ? '1.5px solid #f0f0f0' : 'none', borderLeft: level > 0 ? '2px solid #ddd' : 'none', marginLeft: level > 0 ? '25px' : '0', transition: '0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 15px', borderRadius: '16px', cursor: 'pointer' }}>
                {isEditing ? (
                    <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input autoFocus style={{ border: '2px solid var(--primary)', borderRadius: '12px', padding: '10px 14px', flex: 1, fontSize: '0.9rem', outline: 'none' }} value={tempValue} onChange={(e) => setTempValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit('cat', path, tempValue)} />
                        {level === 0 && (
                            <>
                                <input style={{ width: '42px', height: '42px', padding: 0, borderRadius: '10px', border: '1.5px solid #eee' }} type="text" value={node.icon || ''} placeholder="Icon" onChange={(e) => handleSaveEdit('cat', path, tempValue, { icon: e.target.value })} />
                                <input style={{ width: '42px', height: '42px', padding: 0, borderRadius: '10px', border: 'none', cursor: 'pointer' }} type="color" value={node.color || '#08979C'} onChange={(e) => handleSaveEdit('cat', path, tempValue, { color: e.target.value })} />
                            </>
                        )}
                        <button onClick={() => handleSaveEdit('cat', path, tempValue)} style={{ background: 'var(--primary)', color: 'white', padding: '10px 20px', borderRadius: '12px', fontWeight: 800 }}>OK</button>
                    </div>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: level === 0 ? '34px' : '26px', height: level === 0 ? '34px' : '26px', borderRadius: '10px', background: node.color ? `${node.color}22` : '#eee', color: node.color || '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: level === 0 ? '1rem' : '0.8rem' }}>{node.icon || (level === 0 ? (node.name ? node.name[0] : '?') : '●')}</div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h4 onClick={() => handleStartEdit(node.id, node.name)} style={{ margin: 0, fontSize: level === 0 ? '1.05rem' : '0.92rem', fontWeight: level === 0 ? 800 : 600, color: level === 0 ? '#111' : '#555' }}>
                                {node.name}
                            </h4>
                            <span style={{ fontSize: '0.62rem', color: '#999', fontWeight: 600, letterSpacing: '0.4px' }}>
                                URL: {currentFullSlug}
                            </span>
                        </div>
                    </div>
                )}
                <div style={{ display: 'flex', gap: '8px', opacity: isEditing ? 0 : 1 }}>
                    <button onClick={() => handleAddNode(path)} style={{ border: 'none', background: '#f8f8f8', color: '#888', padding: '6px 12px', borderRadius: '10px', fontWeight: 900, fontSize: '0.65rem', cursor: 'pointer' }}>+ SUB</button>
                    <button onClick={() => confirmAction("Eliminar", `¿Borrar "${node.name}" y todo su contenido?`, () => handleDeleteNode(path))} style={{ border: 'none', background: 'transparent', color: '#ff4d4f', padding: '6px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', opacity: 0.4 }}>🗑️</button>
                </div>
            </div>
            {node.subCategories && node.subCategories.length > 0 && (
                <div style={{ marginTop: '2px' }}>
                    {node.subCategories.map((sub: any, sIdx: number) => (
                        <CategoryNode key={`${sub.id}-${sIdx}`} node={sub} path={[...path, sub.id]} level={level + 1} parentSlug={currentFullSlug} editingId={editingId} tempValue={tempValue} setTempValue={setTempValue} handleStartEdit={handleStartEdit} handleSaveEdit={handleSaveEdit} handleAddNode={handleAddNode} handleDeleteNode={handleDeleteNode} confirmAction={confirmAction} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default InventoryManager;
