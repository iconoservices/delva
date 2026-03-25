import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';

interface ConfigPanelProps {
    globalBrandName: string;
    setGlobalBrandName: (val: string) => void;
    globalWaNumber: string;
    setGlobalWaNumber: (val: string) => void;
    globalMetaDesc: string;
    setGlobalMetaDesc: (val: string) => void;
    globalCategories: { id: string, name: string }[];
    setGlobalCategories: (val: { id: string, name: string }[]) => void;
    saveSettings: () => void;
    products: any[];
    confirmAction: (title: string, msg: string, fn: () => void) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({
    globalBrandName, setGlobalBrandName,
    globalWaNumber, setGlobalWaNumber,
    globalMetaDesc, setGlobalMetaDesc,
    globalCategories, setGlobalCategories,
    saveSettings,
    products,
    confirmAction
}) => {
    const [tab, setTab] = useState<'general' | 'categories'>('general');
    const [newCatName, setNewCatName] = useState('');
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        saveSettings();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const addCategory = () => {
        if (!newCatName.trim()) return;
        const newId = newCatName.toLowerCase().replace(/\s+/g, '_');
        if (globalCategories.find(c => c.id === newId)) return;
        const updated = [...globalCategories, { id: newId, name: newCatName.trim() }];
        setGlobalCategories(updated);
        setNewCatName('');
        setDoc(doc(db, 'settings', 'categories'), { list: updated });
    };

    const removeCategory = (id: string) => {
        confirmAction('Eliminar categoría', `¿Estás seguro? Los productos con esta categoría quedarán sin clasificar.`, () => {
            const updated = globalCategories.filter(c => c.id !== id && c.id !== 'all');
            setGlobalCategories(updated);
            setDoc(doc(db, 'settings', 'categories'), { list: updated });
        });
    };

    const tabBtn = (id: typeof tab, label: string) => (
        <button
            onClick={() => setTab(id)}
            style={{
                flex: 1, padding: '12px', borderRadius: '15px', border: 'none',
                background: tab === id ? 'var(--primary)' : 'white',
                color: tab === id ? 'white' : '#555',
                fontWeight: 900, fontSize: '0.78rem', cursor: 'pointer',
                transition: 'var(--transition)'
            }}
        >{label}</button>
    );

    return (
        <div className="fade-in">
            {/* TABS */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', background: '#f5f5f5', padding: '6px', borderRadius: '20px' }}>
                {tabBtn('general', '⚙️ General')}
                {tabBtn('categories', '🏷️ Categorías')}
            </div>

            {/* ── GENERAL ── */}
            {tab === 'general' && (
                <div style={{ background: 'white', borderRadius: '30px', padding: '35px', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '30px' }}>Configuración General del Marketplace</h3>
                    <div style={{ display: 'grid', gap: '25px' }}>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 900, color: '#666', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>Nombre del Marketplace</label>
                            <input value={globalBrandName} onChange={e => setGlobalBrandName(e.target.value)}
                                style={{ width: '100%', padding: '14px 18px', borderRadius: '15px', border: '1.5px solid #eee', fontSize: '1rem', fontWeight: 700, fontFamily: '"Outfit", sans-serif', outline: 'none' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 900, color: '#666', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>WhatsApp (con código de país)</label>
                            <input value={globalWaNumber} onChange={e => setGlobalWaNumber(e.target.value)} placeholder="ej: 51987654321"
                                style={{ width: '100%', padding: '14px 18px', borderRadius: '15px', border: '1.5px solid #eee', fontSize: '0.95rem', fontFamily: '"Outfit", sans-serif', outline: 'none' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 900, color: '#666', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>Descripción SEO</label>
                            <textarea value={globalMetaDesc} onChange={e => setGlobalMetaDesc(e.target.value)} rows={3}
                                style={{ width: '100%', padding: '14px 18px', borderRadius: '15px', border: '1.5px solid #eee', fontSize: '0.9rem', fontFamily: '"Outfit", sans-serif', resize: 'vertical', outline: 'none' }} />
                        </div>
                    </div>
                    <button onClick={handleSave} style={{
                        marginTop: '30px', width: '100%', padding: '18px',
                        background: saved ? '#52c41a' : 'var(--primary)',
                        color: 'white', border: 'none', borderRadius: '50px',
                        fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', transition: 'var(--transition)'
                    }}>
                        {saved ? '✅ CAMBIOS GUARDADOS' : 'GUARDAR CAMBIOS'}
                    </button>
                </div>
            )}

            {/* ── CATEGORIES ── */}
            {tab === 'categories' && (
                <div style={{ background: 'white', borderRadius: '30px', padding: '35px', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '8px' }}>Categorías Globales</h3>
                    <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '30px' }}>Aparecen en el marketplace y al crear productos.</p>

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '30px' }}>
                        <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addCategory()}
                            placeholder="Nueva categoría (ej: Joyería)"
                            style={{ flex: 1, padding: '14px 18px', borderRadius: '15px', border: '1.5px solid #eee', fontSize: '0.95rem', fontFamily: '"Outfit", sans-serif', outline: 'none' }} />
                        <button onClick={addCategory}
                            style={{ padding: '14px 25px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 900, cursor: 'pointer' }}>
                            + AÑADIR
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {globalCategories.filter(c => c.id !== 'all').map(cat => (
                            <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: '#fafafa', borderRadius: '15px', border: '1px solid #f0f0f0' }}>
                                <div>
                                    <p style={{ margin: 0, fontWeight: 800 }}>{cat.name}</p>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#aaa' }}>id: {cat.id} · {products.filter(p => p.categoryId === cat.id).length} productos</p>
                                </div>
                                <button onClick={() => removeCategory(cat.id)}
                                    style={{ background: '#FFF1F0', color: '#CF1322', border: '1px solid #FFA39E', padding: '7px 16px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 900, cursor: 'pointer' }}>
                                    ELIMINAR
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConfigPanel;
