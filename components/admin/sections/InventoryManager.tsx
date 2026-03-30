import React, { useState } from 'react';
import { doc, deleteDoc, setDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product } from '@/lib/data/products';
import type { User } from '@/lib/types';
import BarcodeScanner from './BarcodeScanner';

interface InventoryManagerProps {
    effectiveStoreId: string;
    storeProducts: Product[];
    setEditingProduct: (p: Product | null) => void;
    globalCategories: { id: string, name: string, color?: string, icon?: string, subCategories?: any[] }[];
    saveGlobalCategories?: (newCats: any[]) => Promise<void>;
    updateProductStock: (id: string, delta: number) => Promise<void>;
    assignSKUToProduct: (id: string, sku: string) => Promise<void>;
    generateSuggestedSKU: (categoryId: string, title: string, color?: string, subCategoryId?: string) => string;
    confirmAction: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void;
    onRecordSale?: (product: Product) => void;
    deleteProduct: (id: string) => Promise<void>;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({
    effectiveStoreId, storeProducts, setEditingProduct, globalCategories, saveGlobalCategories = async () => {}, 
    updateProductStock, assignSKUToProduct, generateSuggestedSKU,
    confirmAction, onRecordSale, deleteProduct
}) => {
    const [subTab, setSubTab] = useState<'products' | 'categories'>('products');
    const [search, setSearch] = useState('');
    const [catSearch, setCatSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filterCat, setFilterCat] = useState('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az' | 'za' | 'price_asc' | 'price_desc' | 'stock'>('newest');

    // --- SCANNER STATE ---
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scanResult, setScanResult] = useState<{ code: string, product: Product | null } | null>(null);
    const [isManualAssignOpen, setIsManualAssignOpen] = useState(false);
    const [assignSearch, setAssignSearch] = useState('');

    // --- CATEGORIES INLINE EDITING ---
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempValue, setTempValue] = useState('');

    const handleScan = (code: string) => {
        const found = storeProducts.find(p => p.sku === code);
        setScanResult({ code, product: found || null });
        setIsScannerOpen(false);
    };

    const handleQuickStock = async (delta: number) => {
        if (scanResult?.product) {
            await updateProductStock(scanResult.product.id, delta);
            // Update local scanResult to reflect change
            setScanResult({
                ...scanResult,
                product: { ...scanResult.product, stock: (Number(scanResult.product.stock) || 0) + delta }
            });
        }
    };

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
        const id = doc(collection(db, 'categories')).id; // Use Firestore ID instead of Math.random
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
                            <button 
                                onClick={() => setIsScannerOpen(true)}
                                style={{ 
                                    height: '40px', 
                                    width: '45px', 
                                    borderRadius: '15px', 
                                    border: 'none', 
                                    background: 'var(--primary)', 
                                    color: 'white', 
                                    fontSize: '1.2rem', 
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: 'var(--shadow-sm)'
                                }}
                                title="Escanear Código de Barras"
                            >
                                📷
                            </button>
                            <button onClick={() => setEditingProduct({ title: '', price: '', categoryId: globalCategories[1]?.id || 'cat-original', userId: effectiveStoreId, published: true } as any)} style={{ height: '40px', padding: '0 20px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 900 }}>+ NUEVO</button>
                        </div>
                    </div>

                    {viewMode === 'grid' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                            {filtered.map(p => {
                                const isPublished = (p as any).published;
                                return (
                                <div key={p.id} style={{ display: 'flex', background: 'white', borderRadius: '24px', overflow: 'hidden', position: 'relative', border: '1px solid #f0f0f0', boxShadow: 'var(--shadow-sm)' }}>
                                    <div style={{ width: '120px', minHeight: '120px', background: '#f9f9f9', flexShrink: 0 }}>
                                        <img src={p.image} style={{ width: '120px', height: '120px', objectFit: 'cover' }} alt={p.title} />
                                    </div>
                                    <div style={{ flex: 1, padding: '14px 16px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <p style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '0.88rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</p>
                                        <p style={{ color: 'var(--accent)', fontWeight: 900, fontSize: '0.95rem', margin: 0 }}>S/ {Number(p.price || 0).toFixed(2)}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div onClick={(e) => { e.stopPropagation(); togglePublish(p); }} style={{ width: '30px', height: '17px', borderRadius: '10px', background: isPublished ? '#00b96b' : '#ddd', position: 'relative', cursor: 'pointer', transition: '0.3s', flexShrink: 0 }}>
                                                <div style={{ position: 'absolute', top: '2px', left: isPublished ? '15px' : '2px', width: '13px', height: '13px', borderRadius: '50%', background: 'white', transition: '0.3s' }} />
                                            </div>
                                            <span style={{ fontSize: '0.6rem', color: isPublished ? '#00b96b' : '#bbb', fontWeight: 800 }}>{isPublished ? 'LIVE' : 'OFF'}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '8px' }}>
                                            <button onClick={(e) => { e.stopPropagation(); onRecordSale && onRecordSale(p); }} style={{ background: '#00b96b15', color: '#00b96b', border: 'none', flex: 1, height: '32px', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', fontSize: '0.8rem' }}>+</button>
                                            <button onClick={(e) => { e.stopPropagation(); setEditingProduct(p); }} style={{ background: '#f5f5f5', border: 'none', color: 'var(--primary)', flex: 2, height: '32px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800 }}>✏️ Editar</button>
                                            <button onClick={(e) => { e.stopPropagation(); confirmAction('Borrar', `¿Eliminar "${p.title}"?`, () => deleteProduct(p.id)); }} style={{ background: '#ff4d4f10', border: 'none', color: '#ff4d4f', flex: 1, height: '32px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem' }}>🗑️</button>
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {filtered.map(p => {
                                const isPublished = (p as any).published;
                                return (
                                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'white', padding: '15px 20px', borderRadius: '24px', border: '1px solid #f0f0f0', boxShadow: 'var(--shadow-sm)' }}>
                                    <div style={{ width: '85px', height: '85px', borderRadius: '18px', overflow: 'hidden', background: '#f9f9f9', flexShrink: 0 }}>
                                        <img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={p.title} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                            <p style={{ fontWeight: 900, margin: 0, fontSize: '1rem', color: 'var(--primary)' }}>{p.title}</p>
                                            <span style={{ fontSize: '0.6rem', padding: '2px 8px', borderRadius: '6px', background: isPublished ? '#E6FFED' : '#F5F5F5', color: isPublished ? '#52C41A' : '#999', fontWeight: 800 }}>{isPublished ? 'LIVE' : 'OFF'}</span>
                                        </div>
                                        <p style={{ color: 'var(--accent)', fontWeight: 900, fontSize: '0.9rem', margin: 0 }}>S/ {Number(p.price || 0).toFixed(2)}</p>
                                        <p style={{ color: '#bbb', fontSize: '0.65rem', margin: '4px 0 0', fontWeight: 600 }}>ID: {p.id} · /shop/{slugify(p.title)}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <button onClick={() => onRecordSale && onRecordSale(p)} style={{ background: '#00b96b', color: 'white', border: 'none', width: '42px', height: '42px', borderRadius: '14px', fontWeight: 900, fontSize: '1.2rem', cursor: 'pointer' }}>+</button>
                                        <button onClick={() => setEditingProduct(p)} style={{ background: '#f5f5f5', border: 'none', padding: '12px 20px', borderRadius: '14px', fontWeight: 900, fontSize: '0.78rem', color: 'var(--primary)', cursor: 'pointer' }}>✏️ EDITAR</button>
                                        <button onClick={() => confirmAction('Borrar', `¿Eliminar "${p.title}"?`, () => deleteProduct(p.id))} style={{ background: '#FFF1F0', color: '#CF1322', border: 'none', width: '42px', height: '42px', borderRadius: '14px', cursor: 'pointer' }}>🗑️</button>
                                    </div>
                                </div>
                                );
                            })}
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

            {/* SCANNER MODAL */}
            {isScannerOpen && (
                <BarcodeScanner 
                    onScan={handleScan}
                    onClose={() => setIsScannerOpen(false)}
                />
            )}

            {/* SCAN RESULT MODAL */}
            {scanResult && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', borderRadius: '30px', width: '100%', maxWidth: '400px', padding: '25px', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <span style={{ fontSize: '2.5rem' }}>{scanResult.product ? '📦' : '🔍'}</span>
                            <h3 style={{ margin: '10px 0 5px', fontWeight: 900 }}>{scanResult.product ? 'Producto Encontrado' : 'No Encontrado'}</h3>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#888' }}>Código: <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{scanResult.code}</span></p>
                        </div>

                        {scanResult.product ? (
                            <div style={{ display: 'grid', gap: '10px' }}>
                                <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '20px', marginBottom: '10px', textAlign: 'left' }}>
                                    <p style={{ margin: 0, fontWeight: 900, fontSize: '0.9rem' }}>{scanResult.product.title}</p>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', opacity: 0.6 }}>Stock actual: <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{scanResult.product.stock || 0}</span></p>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => handleQuickStock(1)} style={{ flex: 1, padding: '12px', borderRadius: '15px', border: 'none', background: '#e6ffed', color: '#52c41a', fontWeight: 800, cursor: 'pointer' }}>+ Stock</button>
                                    <button 
                                        onClick={() => {
                                            onRecordSale && onRecordSale(scanResult.product!);
                                            handleQuickStock(-1);
                                        }} 
                                        style={{ flex: 1, padding: '12px', borderRadius: '15px', border: 'none', background: '#fff1f0', color: '#ff4d4f', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                        - Venta
                                    </button>
                                </div>
                                <button 
                                    onClick={() => {
                                        setEditingProduct(scanResult.product);
                                        setScanResult(null);
                                    }}
                                    style={{ width: '100%', padding: '12px', borderRadius: '15px', border: '1.5px solid #f0f0f0', background: 'white', fontWeight: 800, cursor: 'pointer', marginTop: '5px' }}
                                >
                                    ✏️ Editar Completo
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '10px' }}>
                                <button 
                                    onClick={() => {
                                        setEditingProduct({ 
                                            title: '', 
                                            sku: scanResult.code, 
                                            price: '', 
                                            categoryId: globalCategories[1]?.id || 'cat-original', 
                                            userId: effectiveStoreId, 
                                            published: true 
                                        } as any);
                                        setScanResult(null);
                                    }}
                                    style={{ width: '100%', padding: '15px', borderRadius: '18px', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: 900, cursor: 'pointer' }}
                                >
                                    ✨ CREAR NUEVO PRODUCTO
                                </button>
                                <button 
                                    onClick={() => setIsManualAssignOpen(true)}
                                    style={{ width: '100%', padding: '15px', borderRadius: '18px', border: '1.5px solid #eee', background: 'white', fontWeight: 800, cursor: 'pointer' }}
                                >
                                    🔗 VINCULAR A EXISTENTE
                                </button>
                            </div>
                        )}

                        <button onClick={() => setScanResult(null)} style={{ marginTop: '20px', background: 'transparent', border: 'none', color: '#aaa', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
                    </div>
                </div>
            )}

            {/* MANUAL ASSIGN MODAL */}
            {isManualAssignOpen && scanResult && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', borderRadius: '35px', width: '100%', maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ padding: '25px', borderBottom: '1px solid #f0f0f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h3 style={{ margin: 0, fontWeight: 900 }}>Vincular SKU: {scanResult.code}</h3>
                                <button onClick={() => setIsManualAssignOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                            </div>
                            <input 
                                autoFocus
                                placeholder="🔍 Buscar producto por nombre..." 
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '15px', border: '1.5px solid #eee', outline: 'none' }}
                                onChange={(e) => setAssignSearch(e.target.value)}
                                value={assignSearch}
                            />
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
                            {storeProducts
                                .filter(p => p.title?.toLowerCase().includes(assignSearch.toLowerCase()))
                                .slice(0, 10)
                                .map(p => (
                                    <div 
                                        key={p.id} 
                                        onClick={async () => {
                                            await assignSKUToProduct(p.id, scanResult.code);
                                            setIsManualAssignOpen(false);
                                            setAssignSearch('');
                                            setScanResult({ ...scanResult, product: p });
                                            alert(`✅ Vinculado con éxito a "${p.title}"`);
                                        }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px', borderRadius: '18px', cursor: 'pointer', border: '1px solid transparent', transition: '0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <img src={p.image} style={{ width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover' }} alt={p.title} />
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: 0, fontWeight: 800, fontSize: '0.85rem' }}>{p.title}</p>
                                            <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.5 }}>{p.sku ? `SKU actual: ${p.sku}` : 'Sin SKU'}</p>
                                        </div>
                                        <span style={{ fontSize: '1.1rem' }}>🔗</span>
                                    </div>
                                ))
                            }
                        </div>
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
