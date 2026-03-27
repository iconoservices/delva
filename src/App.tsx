import { Suspense, lazy, useState, useEffect, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { CATEGORIES, type Product } from './data/products';
import { collection, doc, setDoc, onSnapshot, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, auth, googleProvider, storage } from './firebase';
import { signInWithPopup } from 'firebase/auth';
import { SOCIAL_ICONS } from './assets/icons';

// --- COMPONENTS & VIEWS (Lazy Loaded) ---
const HomeView = lazy(() => import('./views/HomeView'));
const ShopView = lazy(() => import('./views/ShopView'));
const ProductDetailView = lazy(() => import('./views/ProductDetailView'));
const AdminDashboardView = lazy(() => import('./views/AdminDashboardView'));

// --- MODALS & COMMON ---
import LoginModal from './components/modals/LoginModal';
import CartDrawer from './components/modals/CartDrawer';
import EditProductModal from './components/modals/EditProductModal';
import SmartFab from './components/home/SmartFab';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import { useUserPreferences } from './utils/useUserPreferences';

// --- TYPES ---
import type { User, CartItem } from './types';

export default function App() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '40px', textAlign: 'center' }}>Cargando aplicación...</div>}>
      <AppContent />
    </Suspense>
  );
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
  const [globalMetaDesc, setGlobalMetaDesc] = useState<string>('DELVA | De la selva, su marketplace. Tu marketplace amazónico de confianza.');
  const [globalKeywords, setGlobalKeywords] = useState<string>('delva, selva, moda, cafe, amazonas, pucallpa');
  const [globalFont, setGlobalFont] = useState<string>('Montserrat');
  const [globalGridCols, setGlobalGridCols] = useState<number>(2);
  const [globalTags, setGlobalTags] = useState<string[]>([]);
  const [globalCategories, setGlobalCategories] = useState<{ id: string, name: string, subCategories?: any[] }[]>(CATEGORIES);
  const [banners, setBanners] = useState<{ id: string, image: string, title?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);



  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('delva_sesion_v6_5');
    return saved ? JSON.parse(saved) : null;
  });

  const [modalConfig, setModalConfig] = useState<{ show: boolean; title: string; message: string; onConfirm: (() => void) | null; confirmText?: string; cancelText?: string; isAlert?: boolean }>({ show: false, title: '', message: '', onConfirm: null });

  // --- CUSTOM DIALOGS ---
  const confirmAction = (title: string, message: string, onConfirm: () => void, confirmText = 'Aceptar', cancelText = 'Cancelar') => {
    setModalConfig({ show: true, title, message, onConfirm, confirmText, cancelText, isAlert: false });
  };
  const alertAction = (title: string, message: string) => {
    setModalConfig({ show: true, title, message, onConfirm: null, isAlert: true });
  };
  const closeStoreModal = () => setModalConfig({ ...modalConfig, show: false });

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

  // Modals
  const [showLogin, setShowLogin] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
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

  // 🚀 HOOK PREFERENCIAS HÍBRIDAS (70/30) 🚀
  const { syncPreferences } = useUserPreferences(currentUser);

  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const checkPWA = () => {
      setIsPWA(window.matchMedia('(display-mode: standalone)').matches);
    };
    checkPWA();

    window.addEventListener('appinstalled', () => setInstallPrompt(null));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // --- SLUG MIGRATION (Ensure SEO-friendly URLs) ---
  const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 40) || 'item';

  // --- FB REALTIME SYNC ---
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const updatedProducts = snapshot.docs.map(d => {
        const data = d.data() as Product;
        const slug = data.slug || slugify(data.title || '');
        
        // Auto-persist slug if missing in DB
        if (!data.slug && data.title) {
          console.log(`Persistiendo slug para: ${data.title}`);
          setDoc(doc(db, 'products', d.id), { slug }, { merge: true })
            .catch(err => console.error("Error persistiendo slug:", err));
        }

        return {
           ...data,
           id: d.id,
           slug
        };
      });
      setProducts(updatedProducts);
      setIsLoading(false);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      if (snapshot.empty) {
        setUsers([{ id: 'master', name: 'DELVA PRO', role: 'master' as const, initials: 'DP', password: 'delva2026' }]);
      } else {
        const allUsers = snapshot.docs.map(d => ({ ...(d.data() as User), id: d.id }));
        setUsers(allUsers);
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
        setGlobalCategories(data.categories ?? CATEGORIES);

        document.documentElement.style.setProperty('--primary', data.primaryColor || '#1A3C34');
        document.documentElement.style.setProperty('--font-main', `"${data.font || 'Montserrat'}", sans-serif`);
      }
    });

    const unsubBanners = onSnapshot(collection(db, 'banners'), (snapshot) => {
      setBanners(snapshot.docs.map(d => d.data() as any));
    });

    return () => { unsubProducts(); unsubUsers(); unsubSettings(); unsubBanners(); };
  }, []);

  // --- SLUG MIGRATION (Ensure SEO-friendly URLs) ---
  // (slugify moved above)
  useEffect(() => {
    if (globalCategories.length > 0) {
      let needsUpdate = false;
      const migrate = (list: any[]): any[] => {
        return list.map(cat => {
          let updatedCat = { ...cat };
          if (!cat.slug && cat.id !== 'all') {
            updatedCat.slug = slugify(cat.name);
            needsUpdate = true;
          }
          if (cat.subCategories && cat.subCategories.length > 0) {
            const migratedSubs = migrate(cat.subCategories);
            if (JSON.stringify(migratedSubs) !== JSON.stringify(cat.subCategories)) {
              updatedCat.subCategories = migratedSubs;
              needsUpdate = true;
            }
          }
          return updatedCat;
        });
      };

      const migrated = migrate(globalCategories);
      if (needsUpdate) {
        console.log("Migrando categorías para incluir Slugs SEO...");
        saveGlobalCategories(migrated);
      }
    }
  }, [globalCategories.length]);

  // --- PERSISTENCE & SEO ---
  useEffect(() => {
    if (currentUser) localStorage.setItem('delva_sesion_v6_5', JSON.stringify(currentUser));
    else localStorage.removeItem('delva_sesion_v6_5');

    // SEO Dynamic Update
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const userId = searchParams.get('u');

    let title = globalBrandName;
    let desc = globalMetaDesc;

    if (path.includes('/tienda') && userId) {
      const store = users.find(u => u.id === userId);
      if (store?.storeName) {
        title = `${store.storeName} | ${globalBrandName}`;
        desc = `Visita la tienda oficial de ${store.storeName} en DELVA. Encuentra los mejores productos locales.`;
      }
    } else if (path.includes('/producto/')) {
      const prodSlug = path.split('/').pop();
      const prod = products.find(p => p.slug === prodSlug || p.id === prodSlug);
      if (prod) {
        title = `${prod.title} - ${globalBrandName}`;
        desc = `Compra ${prod.title} por S/ ${prod.price}. Calidad garantizada en la Selva.`;
      }
    } else {
      title = `${globalBrandName} Hub | Social Marketplace`;
    }

    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);


  }, [currentUser, location.pathname, location.search, products, users, globalBrandName, globalMetaDesc, activeCategory]);

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
    msg += ` - Precio: S/ ${Number(p.price || 0).toFixed(2)}`;
    return `https://wa.me/${targetNumber}?text=${encodeURIComponent(msg)}`;
  };

  const compressImage = async (file: File): Promise<string> => {
    // Validar tamaño inicial (límite de seguridad de 10MB antes de intentar comprimir para evitar colapso de RAM)
    if (file.size > 10 * 1024 * 1024) {
      alertAction('Archivo muy grande', 'La imagen original supera los 10MB. Por favor, usa una imagen más ligera.');
      throw new Error('File too large');
    }

    const options = {
      maxSizeMB: 0.5, // Máximo 500KB
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      initialQuality: 0.8
    };

    try {
      console.log(`Comprimiendo imagen: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      const compressedFile = await imageCompression(file, options);
      console.log(`Imagen comprimida: ${(compressedFile.size / 1024).toFixed(2)} KB`);

      // Validación final post-compresión (Blindaje contra archivos corruptos o fallos de compresión)
      if (compressedFile.size > 1024 * 1024) {
        alertAction('Imagen muy pesada', 'Incluso comprimida, la imagen supera 1MB. Por favor, elige una de menor tamaño.');
        throw new Error('Compressed file still too large');
      }

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressedFile);
      });
    } catch (error) {
      console.error('Error comprimiendo imagen:', error);
      alertAction('Error de Imagen', 'No se pudo procesar la imagen. Intenta con otro archivo.');
      throw error;
    }
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
      let parentStoreId = '';
      let parentStoreName = '';

      if (pendingInvite) {
        const inviteDoc = await getDoc(doc(db, 'invites', pendingInvite));
        if (inviteDoc.exists()) {
          const invData = inviteDoc.data();
          role = (invData.role || 'colaborador').toLowerCase().trim() as any;
          parentStoreId = invData.parentStoreId || '';
          parentStoreName = invData.parentStoreName || '';
          // Consume the invite
          await deleteDoc(doc(db, 'invites', pendingInvite));
          sessionStorage.removeItem('delva_pending_invite');
        }
      }

      // Check if user already exists
      const existingUserDoc = await getDoc(doc(db, 'users', user.uid));
      if (existingUserDoc.exists()) {
        const existingData = existingUserDoc.data() as User;

        // CHECK FOR BLOCKED STATUS
        if (existingData.status === 'blocked') {
          alert('🚫 Tu cuenta ha sido suspendida. Contacta con soporte.');
          setIsLoggingIn(false);
          return;
        }

        // Only upgrade role if invite is for higher role
        const isUpgrade = (role === 'socio' || role === 'master' || (role === 'colaborador' && existingData.role === 'customer'));
        const finalRole = isUpgrade ? role : existingData.role;
        const finalParent = isUpgrade ? parentStoreId : (existingData.parentStoreId || '');

        const updatedUser = {
          ...existingData,
          role: finalRole,
          parentStoreId: finalParent,
          photoURL: user.photoURL || existingData.photoURL
        };
        await setDoc(doc(db, 'users', user.uid), updatedUser, { merge: true });
        setCurrentUser(updatedUser);
      } else {
        const userData: User = {
          id: user.uid,
          name: user.displayName || 'Usuario Google',
          role: 'customer', // Everyone starts as customer by default
          initials,
          email: user.email || '',
          photoURL: user.photoURL || '',
          parentStoreId: '',
          storeName: '',
          storeLogo: ''
        };
        await setDoc(doc(db, 'users', user.uid), userData);
        setCurrentUser(userData);
      }

      // 🚀 SINCRONIZACIÓN DE PREFERENCIAS TRAS LOGIN 🚀
      await syncPreferences(user.uid);

      if (parentStoreId) {
        alertAction('Bienvenido', `¡Bienvenido al equipo de ${parentStoreName}! 🌿 Ya tienes acceso.`);
      }
      setShowLogin(false);
    } catch (e) { console.error(e); alertAction('Error', 'Google Login Error'); }
    finally { setIsLoggingIn(false); }
  };

  const attemptLogin = async (overrideUser?: User) => {
    setIsLoggingIn(true);
    await new Promise(r => setTimeout(r, 500));
    
    let userToLogin = overrideUser;
    if (!userToLogin) {
      userToLogin = users.find(u => (u.phone === loginIdentifier || u.email === loginIdentifier || u.id === loginIdentifier || u.name === loginIdentifier) && u.password === loginPassword);
    }
    
    if (!userToLogin && selectedProfileForLogin && selectedProfileForLogin.password === loginPassword) {
        userToLogin = selectedProfileForLogin;
    }

    if (userToLogin) {
      if (userToLogin.status === 'blocked') {
        alertAction('Acceso Denegado', '🚫 Tu cuenta ha sido suspendida.');
        setIsLoggingIn(false);
        return;
      }
      setCurrentUser(userToLogin);
      setShowLogin(false);
      // 🚀 SINCRONIZACIÓN DE PREFERENCIAS TRAS LOGIN 🚀
      await syncPreferences(userToLogin.id);
    } else {
      alertAction('Error', 'Credenciales incorrectas');
    }
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
      alertAction('Guardado', 'Configuración guardada ✅');
    } catch (e) { alertAction('Error', 'Error al guardar'); }
  };

  const saveGlobalCategories = async (newCats: any[]) => {
    try {
      setGlobalCategories(newCats);
      await setDoc(doc(db, 'settings', 'global'), { categories: newCats }, { merge: true });
      console.log("Categorías globales guardadas con éxito");
    } catch (e) {
      console.error("Error al guardar categorías:", e);
      alertAction('Error', 'No se pudieron guardar las categorías');
    }
  };


  const activeTheme = {
    id: 'delva-hub',
    name: 'DELVA',
    primary: globalPrimaryColor,
    bg: '#ffffff',
    surface: '#F9F9F9',
    font: globalFont,
    radius: '20px'
  };

  const recordSale = async (product: Product) => {
    if (!currentUser) return;
    // const qtyStr = prompt(`Registrar venta de: ${product.title}\n¿Cuántas unidades se vendieron?`, "1");
    const qty = 1; // Simplified to avoid blocking
    // if (qtyStr === null) return;
    // const qty = parseInt(qtyStr);
    // if (isNaN(qty) || qty <= 0) return alertAction("Error", "Cantidad inválida.");

    try {
      const priceNum = Number(product.price || 0);
      // 1. Save to Sales Collection
      const saleId = `sale-${Date.now()}`;
      await setDoc(doc(db, 'sales', saleId), {
        id: saleId,
        productId: product.id,
        productTitle: product.title,
        price: priceNum,
        quantity: qty,
        total: priceNum * qty,
        timestamp: new Date().toISOString(),
        sellerId: currentUser.id
      });

      // 2. Subtract from Inventory
      const newStock = Math.max(0, (product.stock || 0) - qty);
      await setDoc(doc(db, 'products', product.id), { stock: newStock }, { merge: true });

      alertAction("¡Venta Registrada!", `Se han descontado ${qty} unidades del stock.`);
    } catch (err) {
      console.error(err);
      alertAction("Error", "No se pudo registrar la venta.");
    }
  };

  // 🕵️ LÓGICA DE AISLAMIENTO: Detectamos si estamos en la vista de producto
  const isProductPage = location.pathname.startsWith('/producto');

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
      {!isProductPage && (
        <nav className="navbar fade-in">
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
            {/* LEFT: LOGO */}
            <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer', flex: 1, display: 'flex' }}>
              {globalLogo ? (
                <img src={globalLogo} style={{ height: '30px' }} />
              ) : (
                <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>{globalBrandName[0]}</span>
              )}
            </div>

            {/* CENTER: LOGO OR EMPTY SPACE */}
            <div style={{ flex: 2, display: 'flex', justifyContent: 'center' }}>
            </div>

            {/* RIGHT: ACTIONS */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '15px', alignItems: 'center' }}>
              {installPrompt && !isPWA && (
                <button
                  className="premium-install-btn fade-in"
                  onClick={handleInstallClick}
                >
                  <span>📲</span>
                  <span className="desktop-only text-uppercase">Instalar App</span>
                </button>
              )}
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
      )}

      <main style={{ marginTop: isProductPage ? '0' : '58px', paddingBottom: '100px', flex: 1 }}>
        <Suspense fallback={<div className="container" style={{ padding: '60px 20px', textAlign: 'center', color: '#888' }}><div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>Cargando vista...</div>}>
          <Routes>
            <Route path="/" element={<HomeView
              banners={banners}
              isLoading={isLoading}
              products={products}
              users={users}
              globalBrandName={globalBrandName}
              globalCategories={globalCategories}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              addToCart={addToCart}
              currentUser={currentUser}
              onRecordSale={recordSale}
            />} />
            <Route path="/categoria/:categoryId" element={<HomeView
              banners={banners}
              isLoading={isLoading}
              products={products}
              users={users}
              globalBrandName={globalBrandName}
              globalCategories={globalCategories}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              addToCart={addToCart}
              currentUser={currentUser}
              onRecordSale={recordSale}
            />} />
            <Route path="/categoria/:categoryId/:subCategoryId" element={<HomeView
              banners={banners}
              isLoading={isLoading}
              products={products}
              users={users}
              globalBrandName={globalBrandName}
              globalCategories={globalCategories}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              addToCart={addToCart}
              currentUser={currentUser}
              onRecordSale={recordSale}
            />} />
            <Route path="/tienda" element={
              !new URLSearchParams(window.location.search).get('u') || new URLSearchParams(window.location.search).get('u') === 'master' 
              ? <Navigate to="/" replace /> 
              : <ShopView
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  activeCategory={activeCategory}
                  setActiveCategory={setActiveCategory}
                  globalCategories={globalCategories}
                  products={products}
                  users={users}
                  currentUser={currentUser}
                  onRecordSale={recordSale}
                  setEditingProduct={setEditingProduct}
                  globalSocialLinks={globalSocialLinks}
                  SOCIAL_ICONS={SOCIAL_ICONS}
                  compressImage={compressImage}
                  confirmAction={confirmAction}
                  alertAction={alertAction}
                  addToCart={addToCart}
                  globalBrandName={globalBrandName}
                  getWhatsAppLink={getWhatsAppLink}
                />
            } />
            <Route path="/producto/:slug" element={<ProductDetailView isLoading={isLoading} products={products} users={users} addToCart={addToCart} getWhatsAppLink={getWhatsAppLink} cartCount={cart.length} currentUser={currentUser} onRecordSale={recordSale} />} />
            <Route path="/admin" element={
              currentUser ? (
                <AdminDashboardView
                  currentUser={currentUser} products={products} users={users} exportDB={exportDB}
                  globalBrandName={globalBrandName} setGlobalBrandName={setGlobalBrandName} globalPrimaryColor={globalPrimaryColor} setGlobalPrimaryColor={setGlobalPrimaryColor}
                  globalFont={globalFont} setGlobalFont={setGlobalFont} globalWaNumber={globalWaNumber} setGlobalWaNumber={setGlobalWaNumber} globalGridCols={globalGridCols} setGlobalGridCols={setGlobalGridCols}
                  globalLogo={globalLogo} setGlobalLogo={setGlobalLogo} globalFavicon={globalFavicon} setGlobalFavicon={setGlobalFavicon} globalMetaDesc={globalMetaDesc} setGlobalMetaDesc={setGlobalMetaDesc}
                  globalKeywords={globalKeywords} setGlobalKeywords={setGlobalKeywords} globalSocialLinks={globalSocialLinks} setGlobalSocialLinks={setGlobalSocialLinks}
                  globalTags={globalTags} setGlobalTags={setGlobalTags} globalCategories={globalCategories} setGlobalCategories={setGlobalCategories}
                  handleLogoUpload={(e) => { const f = e.target.files?.[0]; if (f) compressImage(f).then(setGlobalLogo); }}
                  handleFaviconUpload={(e) => { const f = e.target.files?.[0]; if (f) compressImage(f).then(setGlobalFavicon); }}
                  saveSettings={saveSettings} saveGlobalCategories={saveGlobalCategories} compressImage={compressImage} setEditingProduct={setEditingProduct}
                  SOCIAL_ICONS={SOCIAL_ICONS} logout={logout} confirmAction={confirmAction} alertAction={alertAction}
                  onRecordSale={recordSale}
                  banners={banners}
                />
              ) : (
                <Navigate to="/" replace />
              )
            } />
            <Route path="*" element={<div className="container" style={{ padding: '100px 0', textAlign: 'center' }}><h2>404 - Ruta no encontrada</h2><button onClick={() => navigate('/')} className="btn-cart">Volver al inicio</button></div>} />
          </Routes>
        </Suspense>
      </main>

      {showLogin && <LoginModal showLogin={showLogin} setShowLogin={setShowLogin} users={users} currentUser={currentUser} setCurrentUser={setCurrentUser} setSelectedProfileForLogin={setSelectedProfileForLogin} loginPassword={loginPassword} setLoginPassword={setLoginPassword} activeLoginTab={activeLoginTab} setActiveLoginTab={setActiveLoginTab} regName={regName} setRegName={setRegName} regPhone={regPhone} setRegPhone={setRegPhone} regHeardFrom={regHeardFrom} setRegHeardFrom={setRegHeardFrom} regPass={regPass} setRegPass={setRegPass} loginIdentifier={loginIdentifier} setLoginIdentifier={setLoginIdentifier} isLoggingIn={isLoggingIn} handleGoogleLogin={handleGoogleLogin} attemptLogin={attemptLogin} />}
      <CartDrawer isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} cart={cart} updateCartQty={updateCartQty} removeCartItem={removeCartItem} referralCode={referralCode} setReferralCode={setReferralCode} globalWaNumber={globalWaNumber} />
      {editingProduct && <EditProductModal editingProduct={editingProduct} setEditingProduct={setEditingProduct} globalCategories={globalCategories} globalTags={globalTags}
        handleImageUpload={(e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) compressImage(f).then(img => setEditingProduct({ ...editingProduct, image: img })); }}
        handleGalleryUpload={(e: React.ChangeEvent<HTMLInputElement>) => { const fs = e.target.files; if (fs) Promise.all(Array.from(fs).map(compressImage)).then(imgs => setEditingProduct({ ...editingProduct, gallery: [...(editingProduct.gallery || []), ...imgs] })); }}
        removeGalleryImage={(idx: number) => { const g = [...editingProduct.gallery]; g.splice(idx, 1); setEditingProduct({ ...editingProduct, gallery: g }); }}
        isSaving={isSaving}
        fileInputRef={fileInputRef} galleryInputRef={galleryInputRef}
        saveProduct={async (data) => {
          setIsSaving(true);
          console.log("Iniciando subida de producto...", data.title);
          try {
            const pid = data.id || Date.now().toString();
            const storeOwnerId = currentUser?.parentStoreId || currentUser?.id || 'master';

            let finalImageUrl = data.image;
            let finalGallery = data.gallery || [];

            // 0. Sync Global Tags
            if (data.tags && data.tags.length > 0) {
              const newGlobalTags = [...new Set([...globalTags, ...data.tags])];
              if (newGlobalTags.length !== globalTags.length) {
                setGlobalTags(newGlobalTags);
                await setDoc(doc(db, 'settings', 'global'), { tags: newGlobalTags }, { merge: true });
              }
            }

            // 1. Manejo de Imagen Principal (Si es Base64, subir a Storage)
            if (data.image && data.image.startsWith('data:image')) {
              try {
                console.log("Subiendo imagen principal a Storage...");
                const storageRef = ref(storage, `products/${pid}/main.jpg`);
                await uploadString(storageRef, data.image, 'data_url');
                finalImageUrl = await getDownloadURL(storageRef);
                console.log("Imagen principal subida con éxito:", finalImageUrl);
              } catch (storageErr: any) {
                console.error("Error en Storage (Imagen Principal):", storageErr);
                throw new Error(`Error al subir imagen a Storage: ${storageErr.code || storageErr.message}. ¿Configuraste el CORS?`);
              }
            }

            // 2. Manejo de Galería (Si hay Base64, subir)
            const galleryUploads = await Promise.all((data.gallery || []).map(async (img: string, idx: number) => {
              if (img.startsWith('data:image')) {
                const gRef = ref(storage, `products/${pid}/gallery_${idx}.jpg`);
                await uploadString(gRef, img, 'data_url');
                return await getDownloadURL(gRef);
              }
              return img;
            }));
            finalGallery = galleryUploads;

            // 3. Guardar en Firestore
            const finalP = { ...data, id: pid, slug: slugify(data.title || ''), userId: data.userId || storeOwnerId, image: finalImageUrl, gallery: finalGallery };
            console.log("Guardando documento en Firestore...");
            await setDoc(doc(db, 'products', pid), finalP);

            console.log("Producto guardado con éxito ✨");
            setEditingProduct(null);
            alertAction('¡Éxito!', 'Producto guardado correctamente en la base de datos.');
          } catch (e: any) {
            console.error('--- ERROR CRÍTICO EN SUBIDA ---');
            console.error('Código:', e.code);
            console.error('Mensaje:', e.message);
            console.error('Stack:', e.stack);

            let userMsg = `No se pudo subir el producto. Error: ${e.message}`;
            if (e.message.includes('CORS')) {
              userMsg += "\n\nTip: Parece un problema de CORS en Firebase Storage.";
            } else if (e.code === 'permission-denied') {
              userMsg += "\n\nTip: Revisa tus reglas de seguridad de Firebase.";
            }

            alertAction('Detalle del Error', userMsg);
          } finally {
            setIsSaving(false);
          }
        }}
      />}

      <PWAInstallPrompt />

      {/* 🚀 SMART FAB LOGIC 🚀 */}
      {location.pathname === '/admin' ? (
        <SmartFab
          isOpen={!!editingProduct}
          onClick={() => {
            if (editingProduct) {
              setEditingProduct(null);
            } else {
              if (currentUser && (currentUser.role === 'master' || currentUser.role === 'socio' || currentUser.role === 'colaborador')) {
                setEditingProduct({
                  title: '',
                  price: '',
                  categoryId: globalCategories[0]?.id || 'varios',
                  image: '',
                  gallery: [],
                  colors: [],
                  tags: [],
                  userId: currentUser.parentStoreId || currentUser.id,
                  stock: 0,
                  createdAt: new Date().toISOString()
                });
              } else {
                navigate('/admin');
              }
            }
          }}
        />
      ) : (
        (currentUser?.role === 'master' || currentUser?.role === 'socio') && (
          <SmartFab onClick={() => navigate('/admin')} />
        )
      )}

      {!isProductPage && (
        <footer style={{ background: '#f9f9f9', padding: '40px 0', marginTop: 'auto' }}>
          <div className="container" style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>
            © 2026 {globalBrandName}. Hecho con 🌿 en la Selva.
          </div>
        </footer>
      )}
      {modalConfig.show && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '30px', padding: '40px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '15px', color: 'var(--primary)' }}>{modalConfig.title}</h2>
            <p style={{ fontSize: '1rem', opacity: 0.7, lineHeight: 1.5, marginBottom: '30px' }}>{modalConfig.message}</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              {!modalConfig.isAlert && (
                <button onClick={closeStoreModal} style={{ flex: 1, padding: '15px', borderRadius: '20px', border: '1px solid #eee', background: 'none', fontWeight: 800, cursor: 'pointer' }}>{modalConfig.cancelText}</button>
              )}
              <button
                onClick={() => {
                  if (modalConfig.onConfirm) modalConfig.onConfirm();
                  closeStoreModal();
                }}
                style={{ flex: 1, padding: '15px', borderRadius: '20px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 800, cursor: 'pointer' }}
              >
                {modalConfig.isAlert ? 'Entendido' : modalConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes popIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
