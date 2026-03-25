import { useState, useEffect, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { CATEGORIES, type Product } from './data/products';
import { collection, doc, setDoc, onSnapshot, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, auth, googleProvider, storage } from './firebase';
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
import SmartFab from './components/home/SmartFab';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import { useUserPreferences } from './utils/useUserPreferences';

// --- TYPES ---
export interface CartItem extends Product { quantity: number; selectedColor?: string; }
export interface User {
  id: string;
  name: string;
  role: 'master' | 'socio' | 'colaborador' | 'customer';
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
  storeCategories?: { id: string; name: string }[];
  storeTags?: string[];
  disabledDefaultCategories?: string[];
  isPremium?: boolean;
  parentStoreId?: string;
  status?: 'active' | 'blocked';
}

export const STORE_THEMES = [
  { id: 'fashion-minimal', name: '👗 Moda & Estilo', primary: '#111111', bg: '#ffffff', surface: '#f9f9f9', font: 'Playfair Display', radius: '2px' },
  { id: 'organic-handmade', name: '🌿 Artesanal & Natural', primary: '#6d4c41', bg: '#ffffff', surface: '#fffaf0', font: 'Montserrat', radius: '20px' },
  { id: 'fresh-food', name: '🥗 Alimentos Frescos', primary: '#2e7d32', bg: '#f1f8e9', surface: '#ffffff', font: 'Outfit', radius: '15px' },
  { id: 'luxury-jewelry', name: '💎 Joyería & Lujo', primary: '#c5a059', bg: '#fcfaf7', surface: '#ffffff', font: 'Cinzel', radius: '4px' },
  { id: 'soft-beauty', name: '💄 Belleza & Cuidado', primary: '#d81b60', bg: '#fff5f8', surface: '#ffffff', font: 'Quicksand', radius: '30px' },
  { id: 'supermarket', name: '🛒 Supermercado Online', primary: '#00a651', bg: '#f5f5f5', surface: '#ffffff', font: 'Inter', radius: '4px' },
  { id: 'home-decor', name: '🛋️ Hogar & Decoración', primary: '#1b3a5c', bg: '#f9f9f7', surface: '#ffffff', font: 'Inter', radius: '6px' },
  { id: 'lux-gold', name: '✨ Boutique Exclusiva', primary: '#8a6d3b', bg: '#0a0a0a', surface: '#1a1a1a', font: 'Prata', radius: '0px' },
  { id: 'tech-neon', name: '🎮 Tecnología & Gaming', primary: '#00ffcc', bg: '#050a10', surface: '#0d1621', font: 'Orbitron', radius: '12px' },
  { id: 'fast-food', name: '🍗 Broaster & Grill', primary: '#ff5722', bg: '#fff8f1', surface: '#ffffff', font: 'Outfit', radius: '12px' },
];

// Default categories and tags suggested per theme
export const THEME_DEFAULTS: Record<string, { categories: { id: string, name: string }[], tags: string[] }> = {
  'fashion-minimal': {
    categories: [{ id: 'mujer', name: 'Mujer' }, { id: 'hombre', name: 'Hombre' }, { id: 'accesorios', name: 'Accesorios' }, { id: 'calzado', name: 'Calzado' }, { id: 'bolsos', name: 'Bolsos' }],
    tags: ['nuevo', 'oferta', 'tendencia', 'exclusivo', 'temporada', 'outlet'],
  },
  'organic-handmade': {
    categories: [{ id: 'artesania', name: 'Artesanías' }, { id: 'natural', name: 'Natural' }, { id: 'plantas', name: 'Plantas' }, { id: 'textiles', name: 'Textiles' }],
    tags: ['hecho-a-mano', 'orgánico', 'natural', 'ecológico', 'limited'],
  },
  'fresh-food': {
    categories: [{ id: 'frutas', name: 'Frutas' }, { id: 'verduras', name: 'Verduras' }, { id: 'carnes', name: 'Carnes' }, { id: 'lacteos', name: 'Lácteos' }, { id: 'bebidas', name: 'Bebidas' }, { id: 'panaderia', name: 'Panadería' }, { id: 'snacks', name: 'Snacks' }],
    tags: ['fresco', 'orgánico', 'oferta', 'del-día', 'sin-gluten', 'vegano'],
  },
  'luxury-jewelry': {
    categories: [{ id: 'collares', name: 'Collares' }, { id: 'anillos', name: 'Anillos' }, { id: 'pulseras', name: 'Pulseras' }, { id: 'aretes', name: 'Aretes' }, { id: 'relojes', name: 'Relojes' }],
    tags: ['oro', 'plata', 'diamante', 'exclusivo', 'edición-limitada', 'personalizable'],
  },
  'soft-beauty': {
    categories: [{ id: 'maquillaje', name: 'Maquillaje' }, { id: 'skincare', name: 'Skincare' }, { id: 'cabello', name: 'Cabello' }, { id: 'unas', name: 'Uñas' }, { id: 'perfumes', name: 'Perfumes' }],
    tags: ['cruelty-free', 'vegano', 'natural', 'hidratante', 'profesional', 'novedad'],
  },
  'supermarket': {
    categories: [{ id: 'frutas-verduras', name: 'Frutas y Verduras' }, { id: 'carnes-pescado', name: 'Carnes y Pescado' }, { id: 'lacteos-huevos', name: 'Lácteos y Huevos' }, { id: 'bebidas', name: 'Bebidas' }, { id: 'snacks-dulces', name: 'Snacks y Dulces' }, { id: 'limpieza', name: 'Limpieza' }],
    tags: ['oferta', '2x1', 'fresco', 'importado', 'sin-gluten', 'orgánico'],
  },
  'home-decor': {
    categories: [{ id: 'sala', name: 'Sala' }, { id: 'dormitorio', name: 'Dormitorio' }, { id: 'cocina', name: 'Cocina' }, { id: 'bano', name: 'Baño' }, { id: 'exterior', name: 'Exterior' }, { id: 'iluminacion', name: 'Iluminación' }],
    tags: ['nuevo-diseño', 'oferta', 'exclusivo', 'importado', 'hecho-a-mano', 'madera'],
  },
  'lux-gold': {
    categories: [{ id: 'coleccion', name: 'Colección' }, { id: 'edicion-limitada', name: 'Edición Limitada' }, { id: 'accesorios', name: 'Accesorios' }, { id: 'exclusivo', name: 'Exclusivo' }],
    tags: ['luxury', 'premium', 'exclusivo', 'colección', 'artesanal', 'oro'],
  },
  'tech-neon': {
    categories: [{ id: 'perifericos', name: 'Periféricos' }, { id: 'pc-gaming', name: 'PC Gaming' }, { id: 'consolas', name: 'Consolas' }, { id: 'accesorios-tech', name: 'Accesorios' }, { id: 'audio', name: 'Audio' }],
    tags: ['gaming', 'nuevo', 'oferta', 'edición-limitada', 'rgb', 'inalámbrico'],
  },
  'fast-food': {
    categories: [{ id: 'combos', name: 'Combos' }, { id: 'pollo-broaster', name: 'Pollo Broaster' }, { id: 'salchipapas', name: 'Salchipapas' }, { id: 'hamburguesas', name: 'Hamburguesas' }, { id: 'bebidas', name: 'Bebidas' }, { id: 'extras', name: 'Extras' }],
    tags: ['picante', 'combo-familiar', 'oferta-dia', 'delivery-gratis', 'calentito', 'crunchy'],
  },
};

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

  // --- FB REALTIME SYNC ---
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Product));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      if (snapshot.empty) {
        const initialLoad = [{ id: 'master', name: 'DELVA PRO', role: 'master' as const, initials: 'DP', password: 'delva2026' }];
        setUsers(initialLoad);
        initialLoad.forEach((u) => setDoc(doc(db, 'users', u.id), u));
      } else {
        const allUsers = snapshot.docs.map(d => {
          const data = d.data() as User;
          const userWithId = { ...data, id: d.id };
          return userWithId;
        });
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
      setBanners(snapshot.docs.map(d => d.data() as any));
    });

    return () => { unsubProducts(); unsubUsers(); unsubSettings(); unsubBanners(); };
  }, []);

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
      const prodId = path.split('/').pop();
      const prod = products.find(p => p.id === prodId);
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

    // Sync activeCategory with URL
    const catParam = searchParams.get('cat') || 'all';
    if (path === '/') {
      if (activeCategory !== 'all') setActiveCategory('all');
    } else if (activeCategory !== catParam) {
      setActiveCategory(catParam);
    }

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
    const qtyStr = prompt(`Registrar venta de: ${product.title}\n¿Cuántas unidades se vendieron?`, "1");
    if (qtyStr === null) return;
    const qty = parseInt(qtyStr);
    if (isNaN(qty) || qty <= 0) return alertAction("Error", "Cantidad inválida.");

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
                  className="nav-icon-btn btn-install-pulse"
                  onClick={handleInstallClick}
                  style={{
                    background: 'rgba(255,87,34,0.1)',
                    color: '#ff5722',
                    borderRadius: '12px',
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.7rem',
                    fontWeight: 900
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>📲</span>
                  <span className="desktop-only">APP</span>
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

      <main style={{ marginTop: isProductPage ? '0' : '75px', paddingBottom: '100px', flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomeView
            banners={banners}
            globalBrandName={globalBrandName}
            products={products}
            users={users}
            ProductCard={ProductCard}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            globalCategories={globalCategories}
            addToCart={addToCart}
            currentUser={currentUser}
            onRecordSale={recordSale}
          />} />
          <Route path="/tienda" element={<ShopView
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            globalCategories={globalCategories}
            products={products}
            users={users}
            ProductCard={ProductCard}
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
          />} />
          <Route path="/producto/:id" element={<ProductDetailView products={products} users={users} addToCart={addToCart} getWhatsAppLink={getWhatsAppLink} cartCount={cart.length} currentUser={currentUser} onRecordSale={recordSale} />} />
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
                saveSettings={saveSettings} compressImage={compressImage} setEditingProduct={setEditingProduct}
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
            const finalP = { ...data, id: pid, userId: data.userId || storeOwnerId, image: finalImageUrl, gallery: finalGallery };
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
