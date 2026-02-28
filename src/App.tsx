import { useState, useEffect, useMemo, useRef } from 'react';
import { products as initialProducts, CATEGORIES, type Product } from './data/products';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, getDoc } from 'firebase/firestore';
import { db, auth, googleProvider } from './firebase';
import { signInWithPopup } from 'firebase/auth';

// --- TYPES ---
interface CartItem extends Product { quantity: number; selectedColor?: string; }
interface User { id: string; name: string; role: 'admin' | 'colaborador' | 'customer'; password?: string; initials: string; heardFrom?: string; email?: string; phone?: string; }

// --- SVG ICONS ---
const SOCIAL_ICONS: any = {
  ig: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.31.975.975 1.247 2.242 1.31 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.31 3.608-.975.975-2.242 1.247-3.608 1.31-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.31-.975-.975-1.247-2.242-1.31-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.334-2.633 1.31-3.608.975-.975 2.242-1.247 3.608-1.31 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.058-1.281.072-1.689.072-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.28-.058-1.689-.072-4.948-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>,
  tk: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.01.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a8.42 8.42 0 0 1-1.87-1.36v7.36c0 1.11-.23 2.19-.69 3.19a7.12 7.12 0 0 1-5.12 4.31 7.22 7.22 0 0 1-5.32-.42c-1.35-.74-2.41-1.87-3-3.26-.59-1.4-.59-2.96-.01-4.36.75-1.8 2.4-3.15 4.34-3.56.45-.1.9-.13 1.36-.12h1.12v4.01h-.59a3.2 3.2 0 0 0-2.6 1.4 3.23 3.23 0 0 0-.4 2.6 3.21 3.21 0 0 0 1.94 2.31 3.2 3.2 0 0 0 3.32-.41c.88-.8 1.28-1.99 1.18-3.16V0h.21z" /></svg>,
  fb: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>,
  yt: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>,
  x: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932L18.901 1.153zm-1.291 19.486h2.04L6.376 3.078h-2.19L17.61 20.639z" /></svg>
};

export default function App() {
  // --- STATE ---
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [globalWaNumber, setGlobalWaNumber] = useState<string>('51900000000');
  const [globalBrandName, setGlobalBrandName] = useState<string>('');
  const [globalPrimaryColor, setGlobalPrimaryColor] = useState<string>('#1A3C34');
  const [globalSocialLinks, setGlobalSocialLinks] = useState<any>({ ig: '', tk: '', fb: '', yt: '', x: '' });
  const [globalLogo, setGlobalLogo] = useState<string>('');
  const [globalFont, setGlobalFont] = useState<string>('Montserrat');
  const [globalGridCols, setGlobalGridCols] = useState<number>(2);

  const [banners, setBanners] = useState<{ id: string, image: string, title?: string }[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('delva_sesion_v6_5');
    return saved ? JSON.parse(saved) : null;
  });

  // UI States
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [referralCode, setReferralCode] = useState('');

  // Modals
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [colorSelectProduct, setColorSelectProduct] = useState<Product | null>(null); // For immediate adding to cart
  const [selectedColor, setSelectedColor] = useState<string>(''); // For customer choosing a color in detail modal

  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedProfileForLogin, setSelectedProfileForLogin] = useState<User | null>(null);
  const [loginPassword, setLoginPassword] = useState('');
  const [activeLoginTab, setActiveLoginTab] = useState<'login' | 'register'>('login');

  // Registration State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regHeardFrom, setRegHeardFrom] = useState('');
  const [regPass, setRegPass] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [showBranding, setShowBranding] = useState(false);

  const [newColorInput, setNewColorInput] = useState('#000000'); // Admin adding color

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // --- FB REALTIME SYNC ---
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      if (snapshot.empty) {
        const localSaved = localStorage.getItem('delva_productos_v6_5');
        const initialLoad = localSaved ? JSON.parse(localSaved) : initialProducts;
        setProducts(initialLoad);
        initialLoad.forEach((p: Product) => setDoc(doc(db, 'products', p.id), p));
      } else {
        setProducts(snapshot.docs.map(d => d.data() as Product));
      }
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      if (snapshot.empty) {
        const localSaved = localStorage.getItem('delva_users_v6_5');
        const initialLoad = localSaved ? JSON.parse(localSaved) : [
          { id: 'master', name: 'DELVA PRO', role: 'admin', initials: 'DP', password: 'delva2026' }
        ];
        setUsers(initialLoad);
        initialLoad.forEach((u: User) => setDoc(doc(db, 'users', u.id), u));
      } else {
        setUsers(snapshot.docs.map(d => d.data() as User));
      }
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGlobalWaNumber(data.waNumber || '51900000000');
        setGlobalBrandName(data.brandName || '');
        setGlobalPrimaryColor(data.primaryColor || '#1A3C34');
        setGlobalSocialLinks(data.socialLinks || { ig: '', tk: '', fb: '', yt: '', x: '' });
        setGlobalLogo(data.logo || '');
        setGlobalFont(data.font || 'Montserrat');
        setGlobalGridCols(data.gridCols || 2);

        document.documentElement.style.setProperty('--primary', data.primaryColor || '#1A3C34');
        document.documentElement.style.setProperty('--font-main', `"${data.font || 'Montserrat'}", sans-serif`);
        document.documentElement.style.setProperty('--font-title', `"${data.font || 'Playfair Display'}", serif`);
        document.documentElement.style.setProperty('--grid-cols', String(data.gridCols || 2));
      } else {
        const localSaved = localStorage.getItem('delva_wa_number_v6_5');
        const val = localSaved || '51900000000';
        setGlobalWaNumber(val);
        setDoc(doc(db, 'settings', 'global'), {
          waNumber: val,
          brandName: '',
          primaryColor: '#1A3C34',
          logo: '',
          font: 'Montserrat',
          gridCols: 2,
          socialLinks: { ig: '', tk: '', fb: '', yt: '', x: '' }
        });
      }
    });

    const unsubBanners = onSnapshot(collection(db, 'banners'), (snapshot) => {
      if (snapshot.empty) {
        setBanners([
          { id: '1', image: 'https://images.unsplash.com/photo-1447078806655-40579c2520d6?auto=format&fit=crop&q=80&w=1200', title: 'La esencia de la selva' }
        ]);
      } else {
        setBanners(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any)));
      }
    });

    return () => { unsubProducts(); unsubUsers(); unsubSettings(); unsubBanners(); }
  }, []);

  // --- AUTO BANNER SLIDE ---
  useEffect(() => {
    if (banners.length <= 1) return;
    const itv = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(itv);
  }, [banners]);

  // --- PERSISTENCE (Solo Sesión de Usuario) ---
  useEffect(() => {
    if (currentUser) localStorage.setItem('delva_sesion_v6_5', JSON.stringify(currentUser));
    else localStorage.removeItem('delva_sesion_v6_5');
  }, [currentUser]);

  // --- LOGIC: CART ---
  const addToCart = (product: Product, color?: string) => {
    setCart(prev => {
      // Find exact same product + color combination
      const existing = prev.find(item => item.id === product.id && item.selectedColor === color);
      if (existing) return prev.map(item => (item.id === product.id && item.selectedColor === color) ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1, selectedColor: color }];
    });
    setViewingProduct(null);
    setIsCartOpen(true);
  };

  const updateCartQty = (id: string, color: string | undefined, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id && item.selectedColor === color) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeCartItem = (id: string, color: string | undefined) => {
    setCart(prev => prev.filter(i => !(i.id === id && i.selectedColor === color)));
  };

  // --- LOGIC: WHATSAPP ---
  const getWhatsAppLink = (p: Product, color?: string) => {
    const targetNumber = p.waNumber && p.waNumber.trim() !== '' ? p.waNumber : globalWaNumber;
    let msg = `¡Hola DELVA! Me interesa este producto: *${p.title}*`;
    if (color) msg += ` (Color: ${color})`;
    msg += ` - Precio: S/ ${p.price.toFixed(2)}. ¿Me dan más info?`;
    return `https://wa.me/${targetNumber}?text=${encodeURIComponent(msg)}`;
  };

  // --- LOGIC: AUTH ---
  // --- AUTH LOGIC ---
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const initials = user.displayName?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'G';
      const newUser: User = {
        id: user.uid,
        name: user.displayName || 'Usuario Google',
        role: 'customer',
        initials,
        email: user.email || ''
      };

      // Check if user already exists to preserve role
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      let finalUserData = newUser;
      if (userSnap.exists()) {
        const existingData = userSnap.data() as User;
        finalUserData = { ...newUser, role: existingData.role || 'customer' };
      }

      await setDoc(userRef, finalUserData, { merge: true });
      setCurrentUser(finalUserData);
      setShowLogin(false);
      alert(`¡Bienvenido ${user.displayName}!`);
    } catch (error) {
      console.error(error);
      alert('Error al iniciar sesión con Google');
    }
  };

  const attemptLogin = () => {
    if (selectedProfileForLogin) {
      if (selectedProfileForLogin.password === loginPassword) {
        setCurrentUser(selectedProfileForLogin);
        setShowLogin(false);
        setLoginPassword('');
        setSelectedProfileForLogin(null);
      } else {
        alert('Contraseña incorrecta');
      }
      return;
    }

    if (!loginIdentifier || !loginPassword) return alert('Ingresa tu identificador y contraseña');

    // Search in users state (clients or staff)
    const found = users.find(u =>
      (u.phone === loginIdentifier || u.email === loginIdentifier || u.id === loginIdentifier) &&
      u.password === loginPassword
    );

    if (found) {
      setCurrentUser(found);
      setShowLogin(false);
      setLoginIdentifier('');
      setLoginPassword('');
    } else {
      alert('Usuario no encontrado o contraseña incorrecta');
    }
  };

  // --- EXPORT DATABASE (AS HTML RECEIPT) ---
  const exportDB = async () => {
    try {
      const pSnap = await getDocs(collection(db, 'products'));
      const uSnap = await getDocs(collection(db, 'users'));

      const productsData = pSnap.docs.map(d => d.data());
      const usersData = uSnap.docs.map(d => d.data());

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Backup DELVA</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 40px 20px; color: #333; }
            .ticket { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
            .header { text-align: center; border-bottom: 2px dashed #ddd; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 24px; color: #1A3C34; text-transform: uppercase; letter-spacing: 2px; }
            .header p { margin: 10px 0 0 0; color: #666; font-size: 14px; }
            h2 { font-size: 18px; color: #1A3C34; margin-top: 40px; border-left: 4px solid #1A3C34; padding-left: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px; }
            th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #eee; }
            th { background-color: #fcfcfc; font-weight: 600; color: #555; text-transform: uppercase; font-size: 12px; }
            tr:hover { background-color: #f9f9f9; }
            .badge { background: #eee; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
            .badge.admin { background: #1A3C34; color: white; }
            .badge.colaborador { background: #2C3E50; color: white; }
            .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #aaa; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <h1>🧾 Reporte de Datos DELVA</h1>
              <p>Generado el: ${new Date().toLocaleString()}</p>
            </div>
            
            <h2>📦 Catálogo de Productos (${productsData.length})</h2>
            <table>
              <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th></tr></thead>
              <tbody>
                ${productsData.map((p: any) => `<tr><td><strong>${p.title}</strong></td><td>${p.category}</td><td>S/ ${p.price.toFixed(2)}</td></tr>`).join('')}
              </tbody>
            </table>
            
            <h2>👥 Usuarios y Clientes (${usersData.length})</h2>
            <table>
              <thead><tr><th>Nombre</th><th>Perfil</th><th>Contacto / Origen</th></tr></thead>
              <tbody>
                ${usersData.map((u: any) => `<tr>
                  <td><strong>${u.name}</strong></td>
                  <td><span class="badge ${u.role}">${u.role}</span></td>
                  <td>${u.phone || u.email || '-'} ${u.heardFrom ? `<br><small style="color:#888;">Origen: ${u.heardFrom}</small>` : ''}</td>
                </tr>`).join('')}
              </tbody>
            </table>
            
            <div class="footer">
              <p>Archivo interno exclusivo de administración - DELVA PRO</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_DELVA_${new Date().toLocaleDateString().replace(/\//g, '-')}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Error al exportar base de datos');
    }
  };

  // --- HELPERS: IMAGE COMPRESSION ---
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // --- LOGIC: PRODUCT MANAGE ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingProduct) {
      const compressed = await compressImage(file);
      setEditingProduct((prev: any) => ({ ...prev, image: compressed }));
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && editingProduct) {
      const newGallery = [...(editingProduct.gallery || [])];
      for (const file of Array.from(files)) {
        const compressed = await compressImage(file);
        newGallery.push(compressed);
      }
      setEditingProduct((prev: any) => ({ ...prev, gallery: newGallery }));
    }
  };

  const handleAddColor = () => {
    const newColors = [...(editingProduct.colors || []), newColorInput];
    setEditingProduct({ ...editingProduct, colors: newColors });
  };

  const removeColor = (index: number) => {
    const newColors = [...(editingProduct.colors || [])];
    newColors.splice(index, 1);
    setEditingProduct({ ...editingProduct, colors: newColors });
  };

  const removeGalleryImage = (index: number) => {
    const newG = [...editingProduct.gallery];
    newG.splice(index, 1);
    setEditingProduct({ ...editingProduct, gallery: newG });
  };

  const [isSaving, setIsSaving] = useState(false);

  const saveProduct = async (data: any) => {
    if (!data.title || !data.price) return alert('Ponle nombre y precio.');
    setIsSaving(true);
    const cat = CATEGORIES.find(c => c.id === data.categoryId);
    const productData = {
      ...data, id: data.id || Date.now().toString(), price: Number(data.price), category: cat?.name || 'Varios'
    };

    try {
      await setDoc(doc(db, 'products', productData.id), productData);
      setEditingProduct(null);
    } catch (error: any) {
      console.error(error);
      alert('Ocurrió un error al subir el producto a la nube.\n\nIntentaste subir demasiadas fotos pesadas o la conexión falló. Motivo técnico: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file);
      setGlobalLogo(compressed);
    }
  };

  const saveSettings = async () => {
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        waNumber: globalWaNumber,
        brandName: globalBrandName,
        primaryColor: globalPrimaryColor,
        logo: globalLogo,
        font: globalFont,
        gridCols: globalGridCols, // Assuming gridCols is still managed somewhere or has a default
        socialLinks: globalSocialLinks
      });
      alert('✅ ¡Diseño y parámetros guardados!');
    } catch (error) {
      console.error("Error saving settings:", error);
      alert('Error al guardar la configuración.');
    }
  };

  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeCategory !== 'all') list = list.filter(p => p.categoryId === activeCategory);
    if (searchTerm) list = list.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
    return list;
  }, [activeCategory, products, searchTerm]);

  // --- RENDER ---
  return (
    <>
      <nav className="navbar">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {globalLogo ? <img src={globalLogo} alt="Logo" style={{ height: '35px', objectFit: 'contain' }} /> : globalBrandName}
          </div>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            {Object.keys(globalSocialLinks).map(key => (
              globalSocialLinks[key] && (
                <a key={key} href={globalSocialLinks[key]} target="_blank" rel="noreferrer" className="nav-btn" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center' }}>
                  {SOCIAL_ICONS[key]}
                </a>
              )
            ))}

            <button className="nav-btn" onClick={() => currentUser ? setCurrentUser(null) : setShowLogin(true)} title={currentUser ? "Cerrar Sesión" : "Acceso Usuarios"}>
              {currentUser ? <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>{currentUser.initials}</span> : '👤'}
            </button>
            <button className="nav-btn" onClick={() => setIsCartOpen(true)}>
              🛒 {cart.length > 0 && <span className="badge">{cart.reduce((s, i) => s + i.quantity, 0)}</span>}
            </button>
          </div>
        </div>
      </nav>

      <main style={{ marginTop: '70px' }}>
        {/* DASHBOARD STAFF */}
        {currentUser && (
          <section className="admin-section">
            <div className="container">
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                🛠️ Panel Staff <span style={{ opacity: 0.5, fontWeight: 500, fontSize: '0.9rem' }}>| {currentUser.name} ({currentUser.role})</span>
              </h2>

              <div className="stats-row" style={{ marginTop: '15px' }}>
                <div className="stat-box">
                  <p style={{ fontSize: '0.7rem', opacity: 0.7 }}>Productos</p>
                  <div className="stat-val">{products.length}</div>
                </div>
                {currentUser.role === 'admin' && (
                  <div className="stat-box">
                    <p style={{ fontSize: '0.7rem', opacity: 0.7 }}>Equipo</p>
                    <div className="stat-val">{users.length} perfiles</div>
                  </div>
                )}
                <div className="stat-box" style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <p style={{ fontSize: '0.7rem', opacity: 0.7 }}>Backup</p>
                  <button onClick={exportDB} style={{ background: 'transparent', color: 'white', padding: 0, fontSize: '0.65rem', textDecoration: 'underline', fontWeight: 700 }}>Exportar DB</button>
                </div>
              </div>

              {/* ADMIN ONLY: SETTINGS & TEAM (Collapsible) */}
              {currentUser.role === 'admin' && (
                <div style={{ marginTop: '20px' }}>
                  <button
                    onClick={() => setShowBranding(!showBranding)}
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '10px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {showBranding ? '🔼 Ocultar Personalización' : '🎨 Personalizar Tienda (Logo, Colores, Redes)'}
                  </button>

                  <div style={{ maxHeight: showBranding ? '2000px' : '0', overflow: 'hidden', transition: 'max-height 0.4s ease-in-out' }}>
                    <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                      <div className="admin-card">
                        <h3>🎨 Identidad Visual</h3>
                        <label>Nombre de Marca</label>
                        <input type="text" value={globalBrandName} onChange={e => setGlobalBrandName(e.target.value)} />

                        <label>Color Principal</label>
                        <input type="color" value={globalPrimaryColor} onChange={e => { setGlobalPrimaryColor(e.target.value); document.documentElement.style.setProperty('--primary', e.target.value); }} style={{ height: '50px' }} />

                        <label>Tipografía</label>
                        <select value={globalFont} onChange={e => { setGlobalFont(e.target.value); document.documentElement.style.setProperty('--font-main', `"${e.target.value}", sans-serif`); }} >
                          <option value="Montserrat">Montserrat (Moderna)</option>
                          <option value="Helvetica">Helvetica (Minimalista)</option>
                          <option value="Georgia">Georgia (Elegante)</option>
                        </select>
                      </div>

                      <div className="admin-card">
                        <h3>⚙️ Sistema & Ventas</h3>
                        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '15px', borderRadius: '12px', marginBottom: '15px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          <label style={{ color: '#fff', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                            WhatsApp de Ventas (Global)
                          </label>
                          <input
                            type="text"
                            value={globalWaNumber}
                            onChange={e => setGlobalWaNumber(e.target.value)}
                            placeholder="Ej: 51900000000"
                            style={{ margin: 0, fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                          />
                          <p style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '5px', color: '#fff' }}>Todos los pedidos llegarán a este número.</p>
                        </div>

                        <div style={{ padding: '10px 0' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>📱 Columnas de Catálogo (Móvil)</label>
                          <select value={globalGridCols} onChange={e => { setGlobalGridCols(Number(e.target.value)); document.documentElement.style.setProperty('--grid-cols', e.target.value); }} style={{ margin: 0 }}>
                            <option value={1}>1 (Filas Grandes)</option>
                            <option value={2}>2 (Diseño Estándar)</option>
                            <option value={3}>3 (Modo Compacto)</option>
                          </select>
                        </div>
                      </div>

                      <div className="admin-card">
                        <h3>🖼️ Logo de la Marca</h3>
                        {globalLogo ? (
                          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px' }}>
                            <img src={globalLogo} alt="Logo Preview" style={{ maxHeight: '60px', marginBottom: '15px', maxWidth: '100%', objectFit: 'contain' }} />
                            <br />
                            <button onClick={() => setGlobalLogo('')} className="btn-cart" style={{ background: 'var(--danger)', padding: '8px 15px', fontSize: '0.8rem', width: '100%' }}>Quitar Logo</button>
                          </div>
                        ) : (
                          <div className="file-input-wrapper" style={{ padding: '20px', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '12px', cursor: 'pointer' }} onClick={() => document.getElementById('logoInput')?.click()}>
                            <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>📤 Subir Logo JPG/PNG</p>
                          </div>
                        )}
                        <input id="logoInput" type="file" onChange={handleLogoUpload} accept="image/*" style={{ display: 'none' }} />
                      </div>
                    </div>

                    <div className="admin-card" style={{ marginTop: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3>🔗 Galería de Redes Sociales</h3>
                        <button onClick={saveSettings} className="btn-save" style={{ padding: '10px 30px' }}>Guardar Cambios ✨</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                        {Object.keys(SOCIAL_ICONS).map(net => (
                          <div key={net} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '12px' }}>
                            {SOCIAL_ICONS[net]}
                            <input
                              type="text"
                              value={globalSocialLinks[net] || ''}
                              onChange={e => setGlobalSocialLinks({ ...globalSocialLinks, [net]: e.target.value })}
                              placeholder={`Link de ${net.toUpperCase()}`}
                              style={{ margin: 0, background: 'transparent', border: 'none', fontSize: '0.8rem', color: 'white' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px' }}>🖼️ Gestión de Banners (Hero)</p>
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                  {banners.map((b) => (
                    <div key={b.id} style={{ position: 'relative', minWidth: '100px', height: '60px' }}>
                      <img src={b.image} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                      <button
                        onClick={() => deleteDoc(doc(db, 'banners', b.id))}
                        style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.6rem' }}>✕</button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file'; input.accept = 'image/*';
                      input.onchange = async (e: any) => {
                        if (e.target.files[0]) {
                          const compressed = await compressImage(e.target.files[0]);
                          const id = Date.now().toString();
                          const title = prompt('Título del banner (opcional):') || '';
                          await setDoc(doc(db, 'banners', id), { id, image: compressed, title });
                        }
                      };
                      input.click();
                    }}
                    style={{ minWidth: '100px', height: '60px', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '8px', background: 'transparent', color: 'white', fontSize: '0.7rem' }}>
                    + Agregar
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Cuentas de Acceso</p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', overflowX: 'auto' }}>
                  {users.map(u => (
                    <div key={u.id} style={{ padding: '5px 15px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '0.8rem' }}>
                      {u.name} ({u.role})
                      {u.id !== 'master' && <button onClick={() => deleteDoc(doc(db, 'users', u.id))} style={{ color: 'var(--danger)', marginLeft: '10px', background: 'transparent' }}>✕</button>}
                    </div>
                  ))}
                  <button style={{ color: 'var(--accent)', background: 'transparent', fontWeight: 800 }} onClick={async () => {
                    const n = prompt('Nombre colaborador:');
                    const p = prompt('Contraseña:');
                    if (n && p) {
                      const id = Date.now().toString();
                      await setDoc(doc(db, 'users', id), { id, name: n, role: 'colaborador', initials: n.substring(0, 2).toUpperCase(), password: p });
                    }
                  }}>+ Agregar</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* HERO BANNER CAROUSEL */}
        <header className="hero">
          <div className="container">
            <div className="banner-container">
              {banners.map((b, idx) => (
                <div key={b.id} className={`banner-slide ${idx === currentBannerIndex ? 'active' : ''}`}>
                  <img src={b.image} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div className="banner-overlay">
                    <h1 className="hero-title">{b.title || globalBrandName}</h1>
                  </div>
                </div>
              ))}

              {/* BANNER DOTS */}
              {banners.length > 1 && (
                <div style={{ position: 'absolute', bottom: 15, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10 }}>
                  {banners.map((_, idx) => (
                    <div
                      key={idx}
                      onClick={() => setCurrentBannerIndex(idx)}
                      style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: idx === currentBannerIndex ? 'white' : 'rgba(255,255,255,0.4)',
                        cursor: 'pointer', transition: '0.3s'
                      }}></div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* TIENDA */}
        <div className="container">
          {/* SEARCH BAR */}
          <div style={{ marginTop: '20px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 15, top: 12, opacity: 0.5, fontSize: '1.2rem' }}>🔍</span>
            <input
              type="text"
              placeholder="¿Qué estás buscando? (Ej: Gafas, Camisa, Café)"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '12px 15px 12px 45px', borderRadius: '30px', border: '1px solid #ddd', boxShadow: 'var(--shadow-sm)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '10px 0 20px 0', scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '10px 20px', borderRadius: '50px', whiteSpace: 'nowrap', fontWeight: 700,
                  background: activeCategory === cat.id ? 'var(--primary)' : 'white',
                  color: activeCategory === cat.id ? 'white' : 'var(--text-muted)'
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="grid">
            {filteredProducts.map(p => (
              <div key={p.id} className="card" onClick={() => { setViewingProduct(p); setSelectedColor(''); }}>

                {/* ADMIN CONTROLS PER CARD */}
                {currentUser && (
                  <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 5, zIndex: 10 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => setEditingProduct(p)} style={{ background: 'white', width: 30, height: 30, borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>✏️</button>
                    {(currentUser.role === 'admin') &&
                      <button onClick={() => deleteDoc(doc(db, 'products', p.id))} style={{ background: 'white', width: 30, height: 30, borderRadius: '50%', color: 'red' }}>🗑️</button>
                    }
                  </div>
                )}

                <div className="card-image-wrapper">
                  <img src={p.image} className="card-image" alt={p.title} />
                  {/* Gallery Indicator */}
                  {p.gallery && p.gallery.length > 0 && (
                    <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.7rem', padding: '3px 8px', borderRadius: '15px' }}>
                      +{p.gallery.length} fotos
                    </div>
                  )}
                </div>

                <div className="card-content">
                  <p style={{ fontSize: '0.6rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>{p.category}</p>
                  <h3 className="card-title">{p.title}</h3>

                  {/* COLOR DOTS IN GRID */}
                  {p.colors && p.colors.length > 0 && (
                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', margin: '5px 0' }}>
                      {p.colors.map((c, i) => (
                        <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: c, border: '1px solid #ddd' }}></div>
                      ))}
                    </div>
                  )}

                  <div className="card-price" style={{ marginTop: 'auto' }}>S/ {p.price.toFixed(2)}</div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }} onClick={e => e.stopPropagation()}>
                    <button
                      className="btn-cart"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (p.colors && p.colors.length > 0) {
                          setColorSelectProduct(p); // Abre menu simple de colores 
                          setSelectedColor('');
                        } else {
                          addToCart(p); // Añade directo si no hay variaciones
                        }
                      }}
                      style={{ flex: 1, padding: '10px 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                    </button>
                    <button className="btn-wa-direct" onClick={(e) => {
                      e.stopPropagation();
                      window.open(getWhatsAppLink(p), '_blank');
                    }} style={{ flex: 1, padding: '10px 0', fontSize: '0.9rem', textAlign: 'center', margin: 0 }}>WhatsApp</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* FAB - NUEVO PRODUCTO */}
      {currentUser && (
        <div className="fab" onClick={() => setEditingProduct({ title: '', price: '', categoryId: 'cafe', image: '', waNumber: '', gallery: [], colors: [] })}>
          +
        </div>
      )}

      {/* LOGIN/REGISTER MODAL */}
      <div className={`modal-overlay ${showLogin ? 'open' : ''}`} onClick={() => { setShowLogin(false); setSelectedProfileForLogin(null); setActiveLoginTab('login'); }}>
        <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: activeLoginTab === 'login' && !selectedProfileForLogin ? '600px' : '400px' }}>

          {/* TABS */}
          {!selectedProfileForLogin && (
            <div style={{ display: 'flex', borderBottom: '1px solid #eee', marginBottom: '20px' }}>
              <button
                onClick={() => setActiveLoginTab('login')}
                style={{ flex: 1, padding: '15px', fontWeight: 700, borderBottom: activeLoginTab === 'login' ? '3px solid var(--primary)' : 'none', opacity: activeLoginTab === 'login' ? 1 : 0.5 }}>
                Entrar
              </button>
              <button
                onClick={() => setActiveLoginTab('register')}
                style={{ flex: 1, padding: '15px', fontWeight: 700, borderBottom: activeLoginTab === 'register' ? '3px solid var(--primary)' : 'none', opacity: activeLoginTab === 'register' ? 1 : 0.5 }}>
                Registrarse
              </button>
            </div>
          )}

          {activeLoginTab === 'login' ? (
            <>
              {!selectedProfileForLogin ? (
                <>
                  <h2 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '1.2rem' }}>¡De vuelta a la comunidad! 🌿</h2>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Usuario o Celular</label>
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={e => setLoginIdentifier(e.target.value)}
                      placeholder="Ej: 51987654321"
                    />
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '10px', display: 'block' }}>Contraseña</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      onKeyDown={e => e.key === 'Enter' && attemptLogin()}
                    />
                    <button className="btn-cart" style={{ width: '100%', padding: '15px', marginTop: '10px' }} onClick={attemptLogin}>Entrar ahora</button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0', opacity: 0.3 }}>
                    <div style={{ flex: 1, height: '1px', background: 'currentColor' }}></div>
                    <span style={{ fontSize: '0.8rem' }}>O CONTINUAR CON</span>
                    <div style={{ flex: 1, height: '1px', background: 'currentColor' }}></div>
                  </div>

                  <button
                    onClick={handleGoogleLogin}
                    style={{
                      width: '100%', padding: '15px', background: 'white', color: '#444',
                      border: '1px solid #ddd', borderRadius: '12px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 600,
                      marginBottom: '20px'
                    }}>
                    <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" /><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" /><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" /><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" /></svg>
                    Google
                  </button>

                  <p
                    onDoubleClick={() => setSelectedProfileForLogin({ id: 'master', name: 'DELVA PRO', role: 'admin', initials: 'DP', password: 'delva2026' })}
                    style={{ fontSize: '0.7rem', opacity: 0.2, textAlign: 'center' }}>
                    Acceso Staff
                  </p>
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ marginBottom: '20px' }}>Hola, {selectedProfileForLogin.name}</h2>
                  <input
                    type="password"
                    placeholder="Ingresa tu contraseña"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && attemptLogin()}
                    autoFocus
                  />
                  <button className="btn-cart" style={{ width: '100%', padding: '15px', marginTop: '10px' }} onClick={attemptLogin}>Entrar al Sistema</button>
                  <button style={{ marginTop: '20px', opacity: 0.6 }} onClick={() => setSelectedProfileForLogin(null)}>← Atrás</button>
                </div>
              )}
            </>
          ) : (
            <div>
              <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Crea tu cuenta 🌿</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nombre Completo</label>
                  <input type="text" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Ej: Juan Perez" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Número de Celular</label>
                  <input type="text" value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="Ej: 51987654321" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>¿De dónde nos conoces?</label>
                  <select value={regHeardFrom} onChange={e => setRegHeardFrom(e.target.value)} style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <option value="">Selecciona una opción</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="tiktok">TikTok</option>
                    <option value="recomendacion">Recomendación</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Contraseña (Opcional)</label>
                  <input type="password" value={regPass} onChange={e => setRegPass(e.target.value)} placeholder="Para volver a entrar" />
                </div>

                <button
                  className="btn-cart"
                  style={{ padding: '18px', marginTop: '10px' }}
                  onClick={async () => {
                    if (!regName || !regPhone) return alert('Por favor dinos tu nombre y celular');
                    const id = Date.now().toString();
                    const initials = regName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                    const newUser: User = {
                      id,
                      name: regName,
                      phone: regPhone,
                      role: 'customer',
                      initials,
                      password: regPass || '123',
                      heardFrom: regHeardFrom
                    };
                    await setDoc(doc(db, 'users', id), newUser);
                    setCurrentUser(newUser);
                    setShowLogin(false);
                    alert(`¡Bienvenido ${regName}! Ahora eres parte de DELVA.`);
                    setRegName(''); setRegPhone(''); setRegHeardFrom(''); setRegPass('');
                  }}>
                  Registrarme Ahora 🚀
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VIEW PRODUCT DETAIL (CUSTOMER) */}
      <div className={`modal-overlay ${viewingProduct ? 'open' : ''}`} onClick={() => setViewingProduct(null)}>
        {viewingProduct && (
          <div className="modal-card" style={{ padding: '20px', maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewingProduct(null)} style={{ position: 'absolute', top: 15, right: 15, fontSize: '1.5rem', zIndex: 10, background: 'rgba(255,255,255,0.8)', width: 35, height: 35, borderRadius: '50%' }}>✕</button>

            {/* Gallery Horizontal Scroll */}
            <div style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', gap: '10px', scrollBehavior: 'smooth' }} className="gallery-scroll">
              <img src={viewingProduct.image} style={{ width: '100%', borderRadius: '15px', scrollSnapAlign: 'start', flexShrink: 0, objectFit: 'cover', aspectRatio: '1/1' }} />
              {viewingProduct.gallery?.map((img, i) => (
                <img key={i} src={img} style={{ width: '100%', borderRadius: '15px', scrollSnapAlign: 'start', flexShrink: 0, objectFit: 'cover', aspectRatio: '1/1' }} />
              ))}
              {(!viewingProduct.gallery || viewingProduct.gallery.length === 0) && <div style={{ display: 'none' }}></div>}
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>{viewingProduct.category}</p>
              <h2 style={{ marginBottom: '5px', fontSize: '1.5rem' }}>{viewingProduct.title}</h2>
              <div className="card-price" style={{ fontSize: '1.8rem' }}>S/ {viewingProduct.price.toFixed(2)}</div>

              {/* Select Color */}
              {viewingProduct.colors && viewingProduct.colors.length > 0 && (
                <div style={{ margin: '15px 0', background: '#fafafa', padding: '15px', borderRadius: '12px' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Selecciona un Color</p>
                  <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                    {viewingProduct.colors.map((c, i) => (
                      <div key={i}
                        onClick={() => setSelectedColor(c)}
                        style={{
                          width: '35px', height: '35px', borderRadius: '50%', backgroundColor: c,
                          border: selectedColor === c ? '3px solid var(--primary)' : '1px solid #ddd',
                          cursor: 'pointer',
                          boxShadow: selectedColor === c ? '0 0 10px rgba(0,0,0,0.2)' : 'none',
                          transform: selectedColor === c ? 'scale(1.1)' : 'scale(1)',
                          transition: '0.2s'
                        }}>
                      </div>
                    ))}
                  </div>
                  {viewingProduct.colors.length > 0 && !selectedColor && <p style={{ fontSize: '0.7rem', color: 'var(--danger)', marginTop: '8px' }}>* Debes elegir un color para añadir</p>}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                <button
                  className="btn-cart"
                  style={{ padding: '16px', fontSize: '1rem', opacity: (viewingProduct.colors?.length && !selectedColor) ? 0.5 : 1 }}
                  disabled={!!(viewingProduct.colors?.length && !selectedColor)}
                  onClick={() => addToCart(viewingProduct, selectedColor)}
                >
                  Añadir al Carrito
                </button>
                <a href={getWhatsAppLink(viewingProduct, selectedColor)} target="_blank" className="btn-wa-direct" style={{ padding: '16px', fontSize: '1rem' }}>
                  Consultar WhatsApp Directo
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MINI COLOR SELECTION OVERLAY */}
      <div className={`modal-overlay ${colorSelectProduct ? 'open' : ''}`} onClick={() => setColorSelectProduct(null)}>
        {colorSelectProduct && (
          <div className="modal-card" style={{ padding: '20px', maxWidth: '350px', textAlign: 'center', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setColorSelectProduct(null)} style={{ position: 'absolute', top: 15, right: 15, background: '#eee', width: 30, height: 30, borderRadius: '50%', fontWeight: 'bold' }}>✕</button>
            <h3 style={{ marginBottom: '5px' }}>¿Qué color prefieres?</h3>
            <p style={{ opacity: 0.6, fontSize: '0.8rem', marginBottom: '15px' }}>{colorSelectProduct.title}</p>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '20px' }}>
              {colorSelectProduct.colors?.map((c, i) => (
                <div key={i}
                  onClick={() => setSelectedColor(c)}
                  style={{
                    width: '45px', height: '45px', borderRadius: '50%', backgroundColor: c,
                    border: selectedColor === c ? '3px solid var(--primary)' : '1px solid #ddd',
                    cursor: 'pointer',
                    boxShadow: selectedColor === c ? '0 0 10px rgba(0,0,0,0.2)' : 'none',
                    transform: selectedColor === c ? 'scale(1.1)' : 'scale(1)',
                    transition: '0.2s'
                  }}>
                </div>
              ))}
            </div>

            <button
              className="btn-cart"
              style={{ width: '100%', padding: '15px', fontSize: '1rem', opacity: !selectedColor ? 0.5 : 1 }}
              disabled={!selectedColor}
              onClick={() => {
                addToCart(colorSelectProduct, selectedColor);
                setColorSelectProduct(null);
              }}
            >
              Agregar a mi bolsa
            </button>
          </div>
        )}
      </div>

      {/* MODAL EDIT/ADD PRODUCT (Upload Photo, Gallery & Config) */}
      <div className={`modal-overlay ${editingProduct ? 'open' : ''}`} onClick={() => setEditingProduct(null)}>
        {editingProduct && (
          <div className="modal-card" style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setEditingProduct(null)}
              style={{ position: 'absolute', top: 15, right: 15, background: '#eee', width: 40, height: 40, borderRadius: '50%', fontSize: '1.2rem', fontWeight: 'bold', zIndex: 10 }}>
              ✕
            </button>

            <h2 style={{ marginBottom: '20px', paddingRight: '40px' }}>{editingProduct.id ? 'Editar Anuncio' : 'Nuevo en Market'}</h2>

            <p style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
              1. Foto de Portada
              {editingProduct.image && (
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingProduct({ ...editingProduct, image: '' }); }}
                  style={{ background: 'transparent', color: 'var(--danger)', fontSize: '0.7rem', fontWeight: 600 }}>
                  ✕ Eliminar
                </button>
              )}
            </p>
            <div className="file-input-wrapper" onClick={() => fileInputRef.current?.click()} style={{ padding: editingProduct.image ? '0' : '20px', overflow: 'hidden', position: 'relative' }}>
              {editingProduct.image ? (
                <>
                  <img src={editingProduct.image} style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '5px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                    🔄 Cambiar Foto
                  </div>
                </>
              ) : (
                <p style={{ fontWeight: 600 }}><span style={{ fontSize: '1.5rem' }}>📸</span><br />Tomar o Subir nueva</p>
              )}
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
            </div>

            <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>2. Galería Extra (Opcional)</p>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '5px' }}>
              {editingProduct.gallery?.map((img: string, i: number) => (
                <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                  <img src={img} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }} />
                  <button onClick={() => removeGalleryImage(i)} style={{ position: 'absolute', top: -5, right: -5, background: 'var(--danger)', color: 'white', borderRadius: '50%', width: 22, height: 22, fontSize: '0.7rem' }}>X</button>
                </div>
              ))}
              <div onClick={() => galleryInputRef.current?.click()} style={{ width: '60px', height: '60px', flexShrink: 0, borderRadius: '8px', border: '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', cursor: 'pointer', background: '#fafafa' }}>
                +
              </div>
              <input type="file" ref={galleryInputRef} onChange={handleGalleryUpload} accept="image/*" multiple style={{ display: 'none' }} />
            </div>

            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>3. Colores Disponibles</label>
            <p style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '5px' }}>Selecciona un color y agrégalo a la lista.</p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input type="color" value={newColorInput} onChange={e => setNewColorInput(e.target.value)} style={{ width: '50px', padding: '0', height: '40px' }} />
              <button
                onClick={handleAddColor}
                style={{ background: 'var(--primary)', color: 'white', borderRadius: '8px', padding: '0 15px', fontWeight: 600 }}>
                Añadir Color
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {editingProduct.colors?.map((c: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#eee', padding: '5px 10px', borderRadius: '20px' }}>
                  <div style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: c, border: '1px solid #ccc' }}></div>
                  <span style={{ fontSize: '0.8rem' }}>{c.toUpperCase()}</span>
                  <button onClick={() => removeColor(i)} style={{ background: 'transparent', color: 'var(--danger)', fontSize: '0.8rem' }}>✕</button>
                </div>
              ))}
            </div>

            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nombre del Producto</label>
            <input value={editingProduct.title} onChange={e => setEditingProduct({ ...editingProduct, title: e.target.value })} placeholder="Ej: Camisa Lino" />

            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Precio Total (S/)</label>
            <input type="number" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })} placeholder="0.00" />

            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Categoría</label>
            <select value={editingProduct.categoryId} onChange={e => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}>
              {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <label style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '10px', display: 'block', color: 'var(--wa-green)' }}> WhatsApp Reemplazo (Opcional)</label>
            <input value={editingProduct.waNumber || ''} onChange={e => setEditingProduct({ ...editingProduct, waNumber: e.target.value })} placeholder="51987654321" />

            <button className="btn-cart" style={{ width: '100%', padding: 15, marginTop: 10 }} onClick={() => saveProduct(editingProduct)} disabled={isSaving}>
              {isSaving ? 'Subiendo a la nube... ☁️' : '¡Publicar Anuncio!'}
            </button>
          </div>
        )}
      </div>

      {/* THE PRO CART DRAWER */}
      <div className={`cart-overlay ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)}>
        <div className="cart-drawer" onClick={e => e.stopPropagation()}>
          <div className="cart-header">
            <h2 style={{ fontFamily: 'Playfair Display' }}>Tu Carrito 🛒</h2>
            <button onClick={() => setIsCartOpen(false)} style={{ fontSize: '1.5rem', opacity: 0.5 }}>✕</button>
          </div>

          <div className="cart-body">
            {cart.length === 0 ? <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '50px' }}>No hay productos aún.</p> : null}
            {cart.map(item => (
              <div key={item.id + '-' + item.selectedColor} className="cart-item">
                <img src={item.image} alt={item.title} />
                <div className="cart-item-info">
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, lineHeight: '1.2', marginBottom: '5px' }}>{item.title}</div>
                  {item.selectedColor && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px', fontSize: '0.75rem' }}>
                      Color: <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.selectedColor, border: '1px solid #ccc' }}></div>
                    </div>
                  )}
                  <div style={{ color: 'var(--accent)', fontWeight: 800 }}>S/ {item.price.toFixed(2)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button className="cart-qty-btn" onClick={() => { if (item.quantity === 1) removeCartItem(item.id, item.selectedColor); else updateCartQty(item.id, item.selectedColor, -1); }}>-</button>
                  <span style={{ fontWeight: 600 }}>{item.quantity}</span>
                  <button className="cart-qty-btn" onClick={() => updateCartQty(item.id, item.selectedColor, 1)}>+</button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-footer" style={{ borderTop: '1px solid #eee', paddingTop: '20px', marginTop: 'auto' }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '0.7rem', opacity: 0.6, display: 'block', marginBottom: '5px' }}>¿Tienes un código de referido o cupón? 🎟️</label>
              <input
                type="text"
                value={referralCode}
                onChange={e => setReferralCode(e.target.value)}
                placeholder="Ingresa código aquí"
                style={{ margin: 0, padding: '12px', fontSize: '0.85rem', background: '#f9f9f9', borderRadius: '10px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px' }}>
              <span>Total:</span>
              <span style={{ color: 'var(--primary)' }}>S/ {cart.reduce((s, i) => s + (i.price * i.quantity), 0).toFixed(2)}</span>
            </div>
            <button
              className="btn-cart"
              style={{ width: '100%', padding: '18px', fontSize: '1rem', textAlign: 'center' }}
              onClick={() => {
                const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0).toFixed(2);
                let message = `*Hola! Me interesa realizar este pedido:*%0A%0A`;
                cart.forEach(i => {
                  message += `- ${i.quantity}x ${i.title} ${i.selectedColor ? `(Color: ${i.selectedColor})` : ''}%0A`;
                });
                message += `%0A*Total: S/ ${total}*`;
                if (referralCode) message += `%0A%0A🎟️ *Código Referido:* ${referralCode}`;

                window.open(`https://wa.me/${globalWaNumber}?text=${message}`, '_blank');
              }}
            >
              🌿 Confirmar pedido por WhatsApp
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
