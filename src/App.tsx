import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { products as initialProducts, CATEGORIES, type Product } from './data/products';
import { collection, doc, setDoc, onSnapshot, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth, googleProvider } from './firebase';
import { signInWithPopup } from 'firebase/auth';

// --- COMPONENTS & VIEWS ---
import HomeView from './views/HomeView';
import ShopView from './views/ShopView';
import ProductDetailView from './views/ProductDetailView';
import AdminDashboardView from './views/AdminDashboardView';
import ProductCard from './components/common/ProductCard';
import LoginModal from './components/modals/LoginModal';
import CartDrawer from './components/modals/CartDrawer';
import EditProductModal from './components/modals/EditProductModal';

// --- TYPES ---
export interface CartItem extends Product { quantity: number; selectedColor?: string; }
export interface User {
  id: string;
  name: string;
  role: 'admin' | 'colaborador' | 'customer';
  password?: string;
  initials: string;
  heardFrom?: string;
  email?: string;
  phone?: string;
  photoURL?: string;
  storeName?: string;
  storeBio?: string;
  storeLogo?: string;
  storeBanner?: string;
  themeId?: string;
  customPrimary?: string;
  customBg?: string;
  customSurface?: string;
}

export const STORE_THEMES = [
  { id: 'fashion-minimal', name: 'Fashion Minimal', primary: '#111111', bg: '#ffffff', surface: '#f9f9f9', font: 'Playfair Display', radius: '2px' },
  { id: 'organic-handmade', name: 'Organic Handmade', primary: '#6d4c41', bg: '#ffffff', surface: '#fffaf0', font: 'Montserrat', radius: '20px' },
  { id: 'fresh-food', name: 'Fresh Food', primary: '#2e7d32', bg: '#f1f8e9', surface: '#ffffff', font: 'Outfit', radius: '15px' },
  { id: 'luxury-jewelry', name: 'Luxury Jewelry', primary: '#c5a059', bg: '#fcfaf7', surface: '#ffffff', font: 'Cinzel', radius: '4px' },
  { id: 'soft-beauty', name: 'Soft Beauty', primary: '#d81b60', bg: '#fff5f8', surface: '#ffffff', font: 'Quicksand', radius: '30px' },
  { id: 'supermarket', name: '🛒 Supermercado Online', primary: '#00a651', bg: '#f5f5f5', surface: '#ffffff', font: 'Inter', radius: '4px' },
  { id: 'home-decor', name: '🛋️ Home Decor', primary: '#1b3a5c', bg: '#f9f9f7', surface: '#ffffff', font: 'Inter', radius: '6px' },
  { id: 'lux-gold', name: '✨ Luxury Gold', primary: '#8a6d3b', bg: '#0a0a0a', surface: '#1a1a1a', font: 'Prata', radius: '0px' },
  { id: 'tech-neon', name: '🎮 Tech Neon', primary: '#00ffcc', bg: '#050a10', surface: '#0d1621', font: 'Orbitron', radius: '12px' },
];

// --- SVG ICONS ---
const SOCIAL_ICONS: any = {
  ig: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.31.975.975 1.247 2.242 1.31 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.31 3.608-.975.975-2.242 1.247-3.608 1.31-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.31-.975-.975-1.247-2.242-1.31-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.334-2.633 1.31-3.608.975-.975 2.242-1.247 3.608-1.31 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.058-1.281.072-1.689.072-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.28-.058-1.689-.072-4.948-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>,
  tk: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.01.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a8.42 8.42 0 0 1-1.87-1.36v7.36c0 1.11-.23 2.19-.69 3.19a7.12 7.12 0 0 1-5.12 4.31 7.22 7.22 0 0 1-5.32-.42c-1.35-.74-2.41-1.87-3-3.26-.59-1.4-.59-2.96-.01-4.36.75-1.8 2.4-3.15 4.34-3.56.45-.1.9-.13 1.36-.12h1.12v4.01h-.59a3.2 3.2 0 0 0-2.6 1.4 3.23 3.23 0 0 0-.4 2.6 3.21 3.21 0 0 0 1.94 2.31 3.2 3.2 0 0 0 3.32-.41c.88-.8 1.28-1.99 1.18-3.16V0h.21z" /></svg>,
  fb: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>,
  yt: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>,
  x: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932L18.901 1.153zm-1.291 19.486h2.04L6.376 3.078h-2.19L17.61 20.639z" /></svg>
};

export default function App() {
  return <AppContent />;
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- STATE ---
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [globalWaNumber, setGlobalWaNumber] = useState<string>('51900000000');
  const [globalBrandName, setGlobalBrandName] = useState<string>('');
  const [globalPrimaryColor, setGlobalPrimaryColor] = useState<string>('#1A3C34');
  const [globalSocialLinks, setGlobalSocialLinks] = useState<any>({ ig: '', tk: '', fb: '', yt: '', x: '' });
  const [globalLogo, setGlobalLogo] = useState<string>('');
  const [globalFavicon, setGlobalFavicon] = useState<string>('');
  const [globalMetaDesc, setGlobalMetaDesc] = useState<string>('DELVA - La esencia de la selva. Moda, café premium y artesanías inspiradas en el Amazonas.');
  const [globalKeywords, setGlobalKeywords] = useState<string>('delva, selva, moda, cafe, amazonas, pucallpa');
  const [globalFont, setGlobalFont] = useState<string>('Montserrat');
  const [globalGridCols, setGlobalGridCols] = useState<number>(2);
  const [globalTags, setGlobalTags] = useState<string[]>([]);
  const [globalCategories, setGlobalCategories] = useState<{ id: string, name: string }[]>(CATEGORIES);

  const [banners, setBanners] = useState<{ id: string, image: string, title?: string }[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('delva_sesion_v6_5');
    return saved ? JSON.parse(saved) : null;
  });

  // Capture invite code from URL immediately
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get('invite');
    if (inviteCode) {
      sessionStorage.setItem('delva_pending_invite', inviteCode);
      // Clean URL without reload
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // UI States
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [referralCode, setReferralCode] = useState('');
  const [viewMode, setViewMode] = useState<'shop' | 'social'>('social');

  // Modals
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedProfileForLogin, setSelectedProfileForLogin] = useState<User | null>(null);
  const [loginPassword, setLoginPassword] = useState('');
  const [activeLoginTab, setActiveLoginTab] = useState<'login' | 'register'>('login');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regHeardFrom, setRegHeardFrom] = useState('');
  const [regPass, setRegPass] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newColorInput, setNewColorInput] = useState('#000000');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // --- FB REALTIME SYNC ---
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      if (snapshot.docs.length < 5) { // Force update if less than 5 products to sync mock data
        setProducts(initialProducts);
        initialProducts.forEach((p: Product) => setDoc(doc(db, 'products', p.id), p));
      } else {
        setProducts(snapshot.docs.map(d => d.data() as Product));
      }
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      if (snapshot.empty) {
        const initialLoad = [{ id: 'master', name: 'DELVA PRO', role: 'admin' as const, initials: 'DP', password: 'delva2026' }];
        setUsers(initialLoad);
        initialLoad.forEach((u) => setDoc(doc(db, 'users', u.id), u));
      } else {
        const allUsers = snapshot.docs.map(d => d.data() as User);
        setUsers(allUsers);
        // Refresh current user data if they are logged in and in the fetched list
        setCurrentUser(prev => {
          if (!prev) return null;
          const updated = allUsers.find(u => u.id === prev.id);
          return updated ? { ...prev, ...updated } : prev;
        });
      }
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGlobalWaNumber(data.waNumber || '51900000000');
        setGlobalBrandName(data.brandName || 'DELVA');
        setGlobalPrimaryColor(data.primaryColor || '#1A3C34');
        setGlobalSocialLinks(data.socialLinks || { ig: '', tk: '', fb: '', yt: '', x: '' });
        setGlobalLogo(data.logo || '');
        setGlobalFavicon(data.favicon || '');
        setGlobalMetaDesc(data.metaDesc || '');
        setGlobalKeywords(data.keywords || '');
        setGlobalFont(data.font || 'Montserrat');
        setGlobalGridCols(data.gridCols || 2);
        setGlobalTags(data.tags || []);
        setGlobalCategories(data.categories || CATEGORIES);

        document.documentElement.style.setProperty('--primary', data.primaryColor || '#1A3C34');
        document.documentElement.style.setProperty('--font-main', `"${data.font || 'Montserrat'}", sans-serif`);
      }
    });

    const unsubBanners = onSnapshot(collection(db, 'banners'), (snapshot) => {
      if (!snapshot.empty) {
        setBanners(snapshot.docs.map(d => d.data() as any));
      } else {
        setBanners([{ id: '1', image: 'https://images.unsplash.com/photo-1447078806655-40579c2520d6?q=80&w=1200', title: 'La esencia de la selva' }]);
      }
    });

    return () => { unsubProducts(); unsubUsers(); unsubSettings(); unsubBanners(); };
  }, []);

  // --- AUTOMATIC BANNER ---
  useEffect(() => {
    if (banners.length <= 1) return;
    const itv = setInterval(() => {
      setCurrentBannerIndex(p => (p + 1) % banners.length);
    }, 5000);
    return () => clearInterval(itv);
  }, [banners]);

  // --- PERSISTENCE ---
  useEffect(() => {
    if (currentUser) localStorage.setItem('delva_sesion_v6_5', JSON.stringify(currentUser));
    else localStorage.removeItem('delva_sesion_v6_5');
  }, [currentUser]);

  // --- LOGIC ---
  const addToCart = (product: Product, color?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedColor === color);
      if (existing) return prev.map(item => (item.id === product.id && item.selectedColor === color) ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1, selectedColor: color }];
    });
    // Forzado de apertura para asegurar renderizado
    setTimeout(() => setIsCartOpen(true), 50);
  };

  const updateCartQty = (id: string, color: string | undefined, delta: number) => {
    setCart(prev => prev.map(item => (item.id === id && item.selectedColor === color) ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const removeCartItem = (id: string, color: string | undefined) => {
    setCart(prev => prev.filter(i => !(i.id === id && i.selectedColor === color)));
  };

  const getWhatsAppLink = (p: Product, color?: string) => {
    const targetNumber = p.waNumber?.trim() || globalWaNumber;
    let msg = `¡Hola DELVA! Me interesa: *${p.title}*`;
    if (color) msg += ` (Color: ${color})`;
    msg += ` - Precio: S/ ${p.price.toFixed(2)}`;
    return `https://wa.me/${targetNumber}?text=${encodeURIComponent(msg)}`;
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 800;
          let w = img.width, h = img.height;
          if (w > h && w > MAX) { h *= MAX / w; w = MAX; }
          else if (h > MAX) { w *= MAX / h; h = MAX; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const initials = user.displayName?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'G';

      // Check for pending invite code
      const pendingInvite = sessionStorage.getItem('delva_pending_invite');
      let role: User['role'] = 'customer';
      if (pendingInvite) {
        const inviteDoc = await getDoc(doc(db, 'invites', pendingInvite));
        if (inviteDoc.exists()) {
          role = 'colaborador';
          // Consume the invite (delete it so it can't be reused)
          await deleteDoc(doc(db, 'invites', pendingInvite));
          sessionStorage.removeItem('delva_pending_invite');
        }
      }

      // Check if user already exists in DB (preserve existing role)
      const existingUserDoc = await getDoc(doc(db, 'users', user.uid));
      if (existingUserDoc.exists()) {
        const existingData = existingUserDoc.data() as User;
        // Only upgrade role, never downgrade
        const finalRole = (role === 'colaborador') ? 'colaborador' : existingData.role;
        const updatedUser = { ...existingData, role: finalRole, photoURL: user.photoURL || existingData.photoURL };
        await setDoc(doc(db, 'users', user.uid), updatedUser, { merge: true });
        setCurrentUser(updatedUser);
      } else {
        const userData: User = { id: user.uid, name: user.displayName || 'Usuario Google', role, initials, email: user.email || '', photoURL: user.photoURL || '' };
        await setDoc(doc(db, 'users', user.uid), userData);
        setCurrentUser(userData);
      }

      if (role === 'colaborador') {
        alert('¡Bienvenido al equipo DELVA! 🌿 Ya tienes acceso como Socio.');
      }
      setShowLogin(false);
    } catch (e) { console.error(e); alert('Error Google Login'); }
    finally { setIsLoggingIn(false); }
  };

  const attemptLogin = async () => {
    setIsLoggingIn(true);
    await new Promise(r => setTimeout(r, 500));
    const found = users.find(u => (u.phone === loginIdentifier || u.email === loginIdentifier || u.id === loginIdentifier || u.name === loginIdentifier) && u.password === loginPassword);
    if (found) { setCurrentUser(found); setShowLogin(false); }
    else if (selectedProfileForLogin && selectedProfileForLogin.password === loginPassword) { setCurrentUser(selectedProfileForLogin); setShowLogin(false); }
    else alert('Credenciales incorrectas');
    setIsLoggingIn(false);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('delva_sesion_v6_5');
    navigate('/');
  };

  const exportDB = async () => {
    const html = `<html><body><h1>Backup DELVA</h1><pre>${JSON.stringify({ products, users }, null, 2)}</pre></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'backup.html'; a.click();
  };

  const saveSettings = async () => {
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        waNumber: globalWaNumber, brandName: globalBrandName, primaryColor: globalPrimaryColor,
        logo: globalLogo, favicon: globalFavicon, metaDesc: globalMetaDesc, keywords: globalKeywords,
        font: globalFont, gridCols: globalGridCols, socialLinks: globalSocialLinks, tags: globalTags, categories: globalCategories
      });
      alert('Configuración guardada ✅');
    } catch (e) { alert('Error al guardar'); }
  };


  // --- THEME LOGIC ---
  const query = new URLSearchParams(location.search);
  const isShopRoute = location.pathname.startsWith('/tienda') || location.pathname.startsWith('/producto');
  const shopId = query.get('u') || currentUser?.id || 'master';
  const storeOwner = users.find(u => u.id === shopId) || users.find(u => u.id === 'master');

  const defaultHubTheme = {
    id: 'delva-hub', name: 'DELVA HUB', primary: '#0F3025', bg: '#ffffff', surface: '#F9F9F9', font: 'Montserrat', radius: '20px'
  };

  const baseTheme = isShopRoute ? (STORE_THEMES.find(t => t.id === storeOwner?.themeId) || STORE_THEMES[2]) : defaultHubTheme;
  const activeTheme = users.length === 0 ? defaultHubTheme : {
    ...baseTheme,
    primary: (isShopRoute && storeOwner?.customPrimary) ? storeOwner.customPrimary : baseTheme.primary,
    bg: (isShopRoute && storeOwner?.customBg) ? storeOwner.customBg : baseTheme.bg,
    surface: (isShopRoute && storeOwner?.customSurface) ? storeOwner.customSurface : baseTheme.surface,
  };

  // --- RENDER ---
  return (
    <div className="app-layout" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      '--primary': activeTheme.primary,
      '--bg': activeTheme.bg,
      '--surface': activeTheme.surface,
      '--radius-md': activeTheme.radius,
      '--radius-lg': activeTheme.radius,
      '--font-main': `"${activeTheme.font}", sans-serif`,
      background: 'var(--bg)',
      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
    } as any}>
      <nav className="navbar">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
          {/* LEFT: LOGO */}
          <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer', flex: 1, display: 'flex' }}>
            {globalLogo ? (
              <img src={globalLogo} style={{ height: '30px' }} />
            ) : (
              <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>{globalBrandName[0]}</span>
            )}
          </div>

          {/* CENTER: TOGGLE (SOCIOS ONLY) */}
          <div style={{ flex: 2, display: 'flex', justifyContent: 'center' }}>
            {currentUser && currentUser.role !== 'customer' && (
              <div className="betsson-toggle">
                <button
                  onClick={() => navigate('/')}
                  className={`toggle-btn ${location.pathname === '/' ? 'active' : ''}`}
                  style={{ background: location.pathname === '/' ? 'var(--primary)' : 'transparent' }}
                >
                  <span className="toggle-icon">🌿</span>
                  <span className="toggle-label">HUB</span>
                </button>
                <button
                  onClick={() => navigate('/tienda')}
                  className={`toggle-btn ${location.pathname === '/tienda' ? 'active' : ''}`}
                  style={{ background: location.pathname === '/tienda' ? 'var(--primary)' : 'transparent' }}
                >
                  <span className="toggle-icon">🏪</span>
                  <span className="toggle-label">TIENDA</span>
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: ACTIONS */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '15px', alignItems: 'center' }}>
            <button className="nav-icon-btn" onClick={() => setIsCartOpen(true)} style={{ position: 'relative' }}>
              <span style={{ fontSize: '1.4rem' }}>🛒</span>
              {cart.length > 0 && <span className="nav-badge">{cart.length}</span>}
            </button>
            <button
              className="nav-icon-btn"
              onClick={() => {
                if (currentUser) {
                  navigate('/admin');
                } else {
                  setShowLogin(true);
                }
              }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', overflow: 'hidden', border: '2px solid white', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                {currentUser ? (
                  currentUser.photoURL ? <img src={currentUser.photoURL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : currentUser.initials
                ) : '👤'}
              </div>
            </button>
          </div>
        </div>
      </nav>

      <main style={{ marginTop: '75px', paddingBottom: '100px', flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomeView
            banners={banners}
            currentBannerIndex={currentBannerIndex}
            globalBrandName={globalBrandName}
            products={products}
            users={users}
            ProductCard={(props) => <ProductCard {...props} onQuickAdd={(p) => { addToCart(p); setIsCartOpen(true); }} />}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            globalCategories={globalCategories}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />} />
          <Route path="/tienda" element={<ShopView
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            globalCategories={globalCategories}
            products={products} // Added products prop as per instruction
            users={users} // Added users prop as per instruction
            ProductCard={(props) => <ProductCard {...props} onQuickAdd={(p) => { addToCart(p); setIsCartOpen(true); }} />}
            currentUser={currentUser}
            setEditingProduct={setEditingProduct}
            globalSocialLinks={globalSocialLinks}
            SOCIAL_ICONS={SOCIAL_ICONS}
            compressImage={compressImage}
          />} />
          <Route path="/producto/:id" element={<ProductDetailView products={products} addToCart={addToCart} getWhatsAppLink={getWhatsAppLink} selectedColor={selectedColor} setSelectedColor={setSelectedColor} />} />
          <Route path="/admin" element={<AdminDashboardView
            currentUser={currentUser} products={products} users={users} banners={banners} exportDB={exportDB}
            globalBrandName={globalBrandName} setGlobalBrandName={setGlobalBrandName} globalPrimaryColor={globalPrimaryColor} setGlobalPrimaryColor={setGlobalPrimaryColor}
            globalFont={globalFont} setGlobalFont={setGlobalFont} globalWaNumber={globalWaNumber} setGlobalWaNumber={setGlobalWaNumber} globalGridCols={globalGridCols} setGlobalGridCols={setGlobalGridCols}
            globalLogo={globalLogo} setGlobalLogo={setGlobalLogo} globalFavicon={globalFavicon} setGlobalFavicon={setGlobalFavicon} globalMetaDesc={globalMetaDesc} setGlobalMetaDesc={setGlobalMetaDesc}
            globalKeywords={globalKeywords} setGlobalKeywords={setGlobalKeywords} globalSocialLinks={globalSocialLinks} setGlobalSocialLinks={setGlobalSocialLinks}
            globalTags={globalTags} setGlobalTags={setGlobalTags} globalCategories={globalCategories} setGlobalCategories={setGlobalCategories}
            handleLogoUpload={(e) => { const f = e.target.files?.[0]; if (f) compressImage(f).then(setGlobalLogo); }}
            handleFaviconUpload={(e) => { const f = e.target.files?.[0]; if (f) compressImage(f).then(setGlobalFavicon); }}
            saveSettings={saveSettings} compressImage={compressImage} setEditingProduct={setEditingProduct}
            SOCIAL_ICONS={SOCIAL_ICONS} logout={logout}
          />} />
          <Route path="*" element={<div className="container" style={{ padding: '100px 0', textAlign: 'center' }}><h2>404 - Ruta no encontrada</h2><button onClick={() => navigate('/')}>Volver al inicio</button></div>} />
        </Routes>
      </main>



      {showLogin && <LoginModal showLogin={showLogin} setShowLogin={setShowLogin} users={users} currentUser={currentUser} setCurrentUser={setCurrentUser} setSelectedProfileForLogin={setSelectedProfileForLogin} loginPassword={loginPassword} setLoginPassword={setLoginPassword} activeLoginTab={activeLoginTab} setActiveLoginTab={setActiveLoginTab} regName={regName} setRegName={setRegName} regPhone={regPhone} setRegPhone={setRegPhone} regHeardFrom={regHeardFrom} setRegHeardFrom={setRegHeardFrom} regPass={regPass} setRegPass={setRegPass} loginIdentifier={loginIdentifier} setLoginIdentifier={setLoginIdentifier} isLoggingIn={isLoggingIn} handleGoogleLogin={handleGoogleLogin} attemptLogin={attemptLogin} />}
      <CartDrawer isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} cart={cart} updateCartQty={updateCartQty} removeCartItem={removeCartItem} referralCode={referralCode} setReferralCode={setReferralCode} globalWaNumber={globalWaNumber} />
      {editingProduct && <EditProductModal editingProduct={editingProduct} setEditingProduct={setEditingProduct} globalCategories={globalCategories} globalTags={globalTags}
        handleImageUpload={(e) => { const f = e.target.files?.[0]; if (f) compressImage(f).then(img => setEditingProduct({ ...editingProduct, image: img })); }}
        handleGalleryUpload={(e) => { const fs = e.target.files; if (fs) Promise.all(Array.from(fs).map(compressImage)).then(imgs => setEditingProduct({ ...editingProduct, gallery: [...(editingProduct.gallery || []), ...imgs] })); }}
        removeGalleryImage={(idx) => { const g = [...editingProduct.gallery]; g.splice(idx, 1); setEditingProduct({ ...editingProduct, gallery: g }); }}
        handleAddColor={() => setEditingProduct({ ...editingProduct, colors: [...(editingProduct.colors || []), newColorInput] })}
        removeColor={(idx) => { const c = [...editingProduct.colors]; c.splice(idx, 1); setEditingProduct({ ...editingProduct, colors: c }); }}
        newColorInput={newColorInput} setNewColorInput={setNewColorInput} isSaving={isSaving}
        saveProduct={async (data) => {
          setIsSaving(true);
          try {
            const pid = data.id || Date.now().toString();
            const finalP = { ...data, id: pid, userId: data.userId || currentUser?.id || 'master' };
            await setDoc(doc(db, 'products', pid), finalP);
            setEditingProduct(null);
          } catch (e) { alert('Error al guardar'); } finally { setIsSaving(false); }
        }}
        fileInputRef={fileInputRef} galleryInputRef={galleryInputRef}
      />}

      <footer style={{ background: '#f9f9f9', padding: '40px 0', marginTop: 'auto' }}>
        <div className="container" style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>
          © 2026 {globalBrandName}. Hecho con 🌿 en la Selva.
        </div>
      </footer>
    </div>
  );
}
