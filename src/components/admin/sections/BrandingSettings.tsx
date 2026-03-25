import React from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import type { User } from '../../../App';
import LockedSection from './LockedSection';

interface BrandingSettingsProps {
    effectiveStoreId: string;
    users: User[];
    isSocio: boolean;
    isMaster: boolean;
    isColaborador: boolean;
    compressImage: (file: File) => Promise<string>;
    // Optional — kept for compatibility with props spread from AdminDashboardView
    [key: string]: any;
}

const BrandingSettings: React.FC<BrandingSettingsProps> = ({
    effectiveStoreId,
    users,
    isColaborador,
    compressImage,
}) => {
    const store = users.find(u => u.id === effectiveStoreId);

    const uploadImage = async (field: string) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
            if (e.target.files[0]) {
                const compressed = await compressImage(e.target.files[0]);
                await setDoc(doc(db, 'users', effectiveStoreId), { [field]: compressed }, { merge: true });
            }
        };
        input.click();
    };

    const saveField = async (field: string, value: string) => {
        await setDoc(doc(db, 'users', effectiveStoreId), { [field]: value }, { merge: true });
    };

    return (
        <div className="fade-in" style={{ display: 'grid', gap: '20px' }}>

            {/* ── IDENTIDAD VISUAL ── */}
            <LockedSection title="🎨 Identidad de Tienda" isLocked={isColaborador}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Banner */}
                    <div>
                        <label style={labelStyle}>BANNER DE PORTADA</label>
                        <div
                            onClick={() => uploadImage('storeBanner')}
                            style={{
                                width: '100%', height: '120px', borderRadius: '16px',
                                background: store?.storeBanner ? `url(${store.storeBanner}) center/cover` : '#f5f5f5',
                                border: '2px dashed #ddd', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                position: 'relative', overflow: 'hidden'
                            }}>
                            {!store?.storeBanner && (
                                <span style={{ color: '#bbb', fontSize: '0.85rem', fontWeight: 700 }}>+ Subir banner (1500×400px)</span>
                            )}
                            {store?.storeBanner && (
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ color: 'white', fontWeight: 800, fontSize: '0.8rem' }}>✏️ Cambiar banner</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Logo + Foto de Perfil */}
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        {/* Logo */}
                        <div style={{ flex: 1, minWidth: '140px' }}>
                            <label style={labelStyle}>LOGO DE TIENDA</label>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <div style={{ width: '70px', height: '70px', borderRadius: '16px', background: '#f5f5f5', overflow: 'hidden', border: '1px solid #eee', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {store?.storeLogo
                                        ? <img src={store.storeLogo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="logo" />
                                        : <span style={{ fontSize: '1.8rem', opacity: 0.2 }}>🏪</span>
                                    }
                                </div>
                                <button onClick={() => uploadImage('storeLogo')}
                                    style={uploadBtn}>Subir logo</button>
                            </div>
                        </div>

                        {/* Foto de perfil */}
                        <div style={{ flex: 1, minWidth: '140px' }}>
                            <label style={labelStyle}>FOTO DE PERFIL</label>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#f5f5f5', overflow: 'hidden', border: '1px solid #eee', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {store?.photoURL
                                        ? <img src={store.photoURL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="perfil" />
                                        : <span style={{ fontSize: '1.8rem', opacity: 0.2 }}>👤</span>
                                    }
                                </div>
                                <button onClick={() => uploadImage('photoURL')}
                                    style={uploadBtn}>Subir foto</button>
                            </div>
                        </div>
                    </div>

                    {/* DISEÑO DE TIENDA (THEME SELECTOR) */}
                    <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '16px', border: '1px solid #eee' }}>
                        <label style={labelStyle}>🎨 DISEÑO / TEMA DE TIENDA</label>
                        <select 
                            value={store?.themeId || 'organic-handmade'}
                            onChange={e => saveField('themeId', e.target.value)}
                            style={{ ...inputStyle, background: 'white', fontWeight: 800 }}
                        >
                            {/* STORE_THEMES is imported from App */}
                            <option value="selva-elegante">✨ Selva Elegante (Premium)</option>
                            <option value="fashion-minimal">👗 Moda & Estilo</option>
                            <option value="organic-handmade">🌿 Artesanal & Natural</option>
                            <option value="fresh-food">🥗 Alimentos Frescos</option>
                            <option value="luxury-jewelry">💎 Joyería & Lujo</option>
                            <option value="soft-beauty">💄 Belleza & Cuidado</option>
                            <option value="supermarket">🛒 Supermercado Online</option>
                            <option value="home-decor">🛋️ Hogar & Decoración</option>
                            <option value="lux-gold">✨ Boutique Exclusiva</option>
                            <option value="tech-neon">🎮 Tecnología & Gaming</option>
                            <option value="fast-food">🍗 Broaster & Grill</option>
                        </select>
                        <p style={{ fontSize: '0.65rem', color: '#999', marginTop: '8px', fontWeight: 600 }}>
                            Tip: Cambia el diseño para que tu tienda tenga una identidad única.
                        </p>
                    </div>
                </div>
            </LockedSection>

            {/* ── INFO DE TIENDA ── */}
            <LockedSection title="📋 Información de Tienda" isLocked={isColaborador}>
                <div style={{ display: 'grid', gap: '18px' }}>
                    <div>
                        <label style={labelStyle}>NOMBRE DE TIENDA</label>
                        <input
                            type="text"
                            defaultValue={store?.storeName || ''}
                            onBlur={e => saveField('storeName', e.target.value)}
                            placeholder="Nombre de tu tienda"
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>DESCRIPCIÓN / BIO</label>
                        <textarea
                            defaultValue={store?.storeBio || ''}
                            onBlur={e => saveField('storeBio', e.target.value)}
                            placeholder="Cuéntale a los clientes quién eres y qué ofreces..."
                            rows={3}
                            style={{ ...inputStyle, resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <div>
                            <label style={labelStyle}>CIUDAD / UBICACIÓN</label>
                            <input
                                type="text"
                                defaultValue={(store as any)?.city || ''}
                                onBlur={e => saveField('city', e.target.value)}
                                placeholder="Ej: Tarapoto, San Martín"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>WHATSAPP</label>
                            <input
                                type="text"
                                defaultValue={(store as any)?.waNumber || ''}
                                onBlur={e => saveField('waNumber', e.target.value)}
                                placeholder="51987654321"
                                style={inputStyle}
                            />
                        </div>
                    </div>
                </div>
            </LockedSection>

            {/* ── REDES SOCIALES ── */}
            <LockedSection title="🔗 Redes Sociales" isLocked={isColaborador}>
                <div style={{ display: 'grid', gap: '14px' }}>
                    {[
                        { key: 'instagram', icon: '📸', label: 'INSTAGRAM', placeholder: '@tutienda' },
                        { key: 'tiktok', icon: '🎵', label: 'TIKTOK', placeholder: '@tutienda' },
                        { key: 'facebook', icon: '👍', label: 'FACEBOOK', placeholder: 'facebook.com/tutienda' },
                    ].map(r => (
                        <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{r.icon}</span>
                            <div style={{ flex: 1 }}>
                                <label style={{ ...labelStyle, marginBottom: '5px' }}>{r.label}</label>
                                <input
                                    type="text"
                                    defaultValue={(store as any)?.[r.key] || ''}
                                    onBlur={e => saveField(r.key, e.target.value)}
                                    placeholder={r.placeholder}
                                    style={inputStyle}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </LockedSection>

            <p style={{ fontSize: '0.75rem', color: '#bbb', textAlign: 'center', margin: '5px 0 0', lineHeight: 1.5 }}>
                💡 Los cambios se guardan automáticamente al salir de cada campo.
            </p>
        </div>
    );
};

// Shared styles
const labelStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 900,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    display: 'block',
    marginBottom: '7px'
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 15px',
    borderRadius: '13px',
    border: '1.5px solid #eee',
    fontFamily: '"Outfit", sans-serif',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box'
};

const uploadBtn: React.CSSProperties = {
    background: 'var(--primary)',
    color: 'white',
    padding: '9px 18px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 800,
    border: 'none',
    cursor: 'pointer'
};

export default BrandingSettings;
