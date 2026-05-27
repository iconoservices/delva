'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';
import { CATEGORIES, type Product } from '@/lib/data/products';
import { type User, type CartItem, type Sale, type Expense, type FixedExpense } from '@/lib/types';

interface AppContextType {
  products: Product[];
  users: User[];
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  addToCart: (product: Product, color?: string) => void;
  updateCartQty: (id: string, color: string | undefined, delta: number) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  showLogin: boolean;
  setShowLogin: (show: boolean) => void;
  editingProduct: any;
  setEditingProduct: (p: any) => void;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  activeCategory: string;
  setActiveCategory: (c: string) => void;
  isLoading: boolean;
  globalWaNumber: string;
  globalBrandName: string;
  globalPrimaryColor: string;
  globalLogo: string;
  globalFont: string;
  globalSocialLinks: any;
  globalCategories: any[];
  banners: { id: string, image: string, title?: string }[];
  getWhatsAppLink: (p: Product, color?: string) => string;
  alertAction: (title: string, message: string) => void;
  confirmAction: (title: string, message: string, onConfirm: () => void) => void;
  onRecordSale: (p: Product) => void;
  globalColors: { name: string, hex: string }[];
  saveGlobalColors: (colors: { name: string, hex: string }[]) => Promise<void>;
  // Auth & Login
  setSelectedProfileForLogin: (u: User | null) => void;
  loginPassword: string;
  setLoginPassword: (p: string) => void;
  activeLoginTab: 'login' | 'register';
  setActiveLoginTab: (tab: 'login' | 'register') => void;
  regName: string;
  setRegName: (n: string) => void;
  regPhone: string;
  setRegPhone: (p: string) => void;
  regHeardFrom: string;
  setRegHeardFrom: (h: string) => void;
  regPass: string;
  setRegPass: (p: string) => void;
  loginIdentifier: string;
  setLoginIdentifier: (i: string) => void;
  isLoggingIn: boolean;
  handleGoogleLogin: () => Promise<void>;
  attemptLogin: (u?: User) => Promise<void>;
  // Cart & Referral
  referralCode: string;
  setReferralCode: (c: string) => void;
  // Product Editor
  globalTags: string[];
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGalleryUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeGalleryImage: (idx: number) => void;
  isSaving: boolean;
  saveProduct: (p: any) => Promise<void>;
  updateProductStock: (id: string, delta: number) => Promise<void>;
  assignSKUToProduct: (id: string, sku: string) => Promise<void>;
  generateSuggestedSKU: (categoryId: string, title: string, color?: string, subCategoryId?: string) => string;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductPublish?: (id: string) => Promise<void>;
  logout: () => void;
  isSynced: boolean;
  authEmail: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
  // Financial Dashboard Data
  sales: Sale[];
  expenses: Expense[];
  fixedExpenses: FixedExpense[];
  loadingFinancials: boolean;
  selectedStoreId: string;
  setSelectedStoreId: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  
  const [globalWaNumber, setGlobalWaNumber] = useState('51900000000');
  const [globalBrandName, setGlobalBrandName] = useState('DELVA');
  const [globalPrimaryColor, setGlobalPrimaryColor] = useState('#1A3C34');
  const [globalLogo, setGlobalLogo] = useState('');
  const [globalFont, setGlobalFont] = useState('Montserrat');
  const [globalSocialLinks, setGlobalSocialLinks] = useState({ ig: '', tk: '', fb: '', yt: '', x: '' });
  const [globalCategories, setGlobalCategories] = useState(CATEGORIES);
  const [globalColors, setGlobalColors] = useState<{ name: string, hex: string }[]>([]);
  const [banners, setBanners] = useState<{ id: string, image: string, title?: string }[]>([]);

  // Auth States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [activeLoginTab, setActiveLoginTab] = useState<'login' | 'register'>('login');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regHeardFrom, setRegHeardFrom] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [selectedProfileForLogin, setSelectedProfileForLogin] = useState<User | null>(null);

  // Connection & Sync Stats
  const [isSynced, setIsSynced] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);

  // Financial Dashboard State
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [loadingFinancials, setLoadingFinancials] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');

  // Cart & Referral
  const [referralCode, setReferralCode] = useState('');

  // Product Editor States
  const [globalTags, setGlobalTags] = useState<string[]>(['destacado', 'oferta', 'nuevo']);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const logout = () => {
    auth.signOut().catch(() => {});
    setCurrentUser(null);
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = users.find(u => u.id === result.user.uid);
      if (user) setCurrentUser(user);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const attemptLogin = async (overrideUser?: User) => {
    setIsLoggingIn(true);
    try {
        if (overrideUser?.id === 'master') {
            try {
                const cred = await signInWithEmailAndPassword(auth, 'master@delva.com', 'delva2026');
                console.log("Firebase Auth Success:", cred.user.email);
                setCurrentUser(overrideUser);
                setShowLogin(false);
            } catch (authError: any) {
                console.error("Firebase Auth (Master) failed:", authError);
                const errorCode = authError.code || 'unknown';
                let msg = "Error de servidor: ";
                if (errorCode === 'auth/wrong-password') msg += "Contraseña de Firebase incorrecta.";
                else if (errorCode === 'auth/user-not-found') msg += "El usuario 'master@delva.com' no existe en Firebase.";
                else msg += authError.message;
                
                alert(`⚠️ ${msg}\n\n(Código: ${errorCode})\n\nSin este permiso real, no podrás subir fotos.`);
            }
            return;
        }

        if (overrideUser) {
            setCurrentUser(overrideUser);
            setShowLogin(false);
            return;
        }

        const found = users.find(u => (u.phone === loginIdentifier || u.id === loginIdentifier) && u.password === loginPassword);
        if (found) {
            if (found.id === 'master') {
                await signInWithEmailAndPassword(auth, 'master@delva.com', 'delva2026');
            }
            setCurrentUser(found);
            setShowLogin(false);
        } else {
            alert("Credenciales incorrectas");
        }
    } catch (e) {
        console.error("Login Error:", e);
        alert("Error al ingresar: " + (e as Error).message);
    } finally {
        setIsLoggingIn(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingProduct) {
        try {
            const options = { maxSizeMB: 0.6, maxWidthOrHeight: 1200, useWebWorker: true };
            const compressedFile = await imageCompression(file, options);
            setEditingProduct((prev: any) => ({ 
                 ...prev, 
                 image: URL.createObjectURL(compressedFile),
                 _pendingImageFile: compressedFile 
            }));
        } catch (error) {
            console.error('Error al comprimir:', error);
            setEditingProduct((prev: any) => ({ 
                 ...prev, 
                 image: URL.createObjectURL(file),
                 _pendingImageFile: file 
            }));
        }
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length && editingProduct) {
        const options = { maxSizeMB: 0.6, maxWidthOrHeight: 1200, useWebWorker: true };
        
        const compressedFilesData = await Promise.all(files.map(async (file) => {
            try {
                const compressed = await imageCompression(file, options);
                return { file: compressed, url: URL.createObjectURL(compressed) };
            } catch (err) {
                return { file, url: URL.createObjectURL(file) };
            }
        }));

        setEditingProduct((prev: any) => ({
            ...prev,
            gallery: [...(prev.gallery || []), ...compressedFilesData.map(f => f.url)],
            _pendingGalleryFiles: [...(prev._pendingGalleryFiles || []), ...compressedFilesData]
        }));
    }
  };

  const removeGalleryImage = (idx: number) => {
      if (editingProduct) {
          const gallery = [...(editingProduct.gallery || [])];
          const removedUrl = gallery[idx];
          gallery.splice(idx, 1);
          
          let pending = [...(editingProduct._pendingGalleryFiles || [])];
          pending = pending.filter(p => p.url !== removedUrl);
          
          setEditingProduct({ ...editingProduct, gallery, _pendingGalleryFiles: pending });
      }
  };

  const saveProduct = async (prod: any, keepOpen?: boolean) => {
      try {
          setIsSaving(true);
          
          let finalImage = prod.image;
          if (prod._pendingImageFile) {
              const ext = prod._pendingImageFile.name?.split('.').pop() || 'jpg';
              const path = `delva/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
              const { error: upErr } = await supabase.storage.from('product-images').upload(path, prod._pendingImageFile);
              if (upErr) throw upErr;
              finalImage = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
          }

          let finalGallery = [];
          for (const url of (prod.gallery || [])) {
              const pending = (prod._pendingGalleryFiles || []).find((p: any) => p.url === url);
              if (pending) {
                  const ext = pending.file.name?.split('.').pop() || 'jpg';
                  const path = `delva/gallery/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
                  await supabase.storage.from('product-images').upload(path, pending.file);
                  finalGallery.push(supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl);
              } else {
                  finalGallery.push(url);
              }
          }

          const productId = prod.id;
          const slugify = (text: string) => text?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 40) || 'item';
          const finalSlug = prod.slug ? prod.slug : `${slugify(prod.title)}-${productId ? productId.slice(-4).toLowerCase() : Date.now().toString().slice(-4)}`;

          const row: any = {
              name: prod.title || '',
              store: 'delva',
              price: Number(prod.price) || 0,
              category: prod.category || '',
              subcategory: prod.subCategoryId || '',
              stock: Number(prod.stock) || 0,
              status: prod.published !== false ? 'Activo' : 'Inactivo',
              image: finalImage,
              description: prod.description || '',
              sku: prod.sku || '',
              slug: finalSlug,
              waNumber: prod.waNumber || '',
              gallery: finalGallery,
              colors: prod.colors || [],
              tags: prod.tags || [],
              details: prod.details || [],
              subCategoryId: prod.subCategoryId || '',
              subSubCategoryId: prod.subSubCategoryId || '',
              userId: prod.userId || '',
              hasOffer: prod.hasOffer || false,
              originalPrice: prod.originalPrice || null,
              costPrice: prod.costPrice || null,
              viewCount: prod.viewCount || 0,
              approvalRate: prod.approvalRate || 0,
          };

          let saveErr;
          if (productId) {
              const { error } = await supabase.from('products').update(row).eq('id', productId);
              saveErr = error;
          } else {
              const { error } = await supabase.from('products').insert(row);
              saveErr = error;
          }
          if (saveErr) throw saveErr;
          
          if (!keepOpen) {
              setEditingProduct(null);
          } else {
              setEditingProduct({ 
                  title: '', 
                  price: '', 
                  originalPrice: '', 
                  stock: 1, 
                  categoryId: prod.categoryId || 'cat-original', 
                  userId: prod.userId, 
                  published: true 
              } as any);
              alert("✅ Guardado con éxito. Listo para agregar el siguiente.");
          }
      } catch (e) {
          console.error("Error al subir:", e);
          alert("Error al subir el producto: " + (e as Error).message);
      } finally {
          setIsSaving(false);
      }
  };

  const updateProductStock = async (id: string, delta: number) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const newStock = Math.max(0, (Number(product.stock) || 0) + delta);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
    await supabase.from('products').update({ stock: newStock }).eq('id', id);
  };

  const assignSKUToProduct = async (id: string, sku: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, sku } : p));
    await supabase.from('products').update({ sku }).eq('id', id);
  };

  const saveGlobalColors = async (colors: { name: string, hex: string }[]) => {
      try {
          await supabase.from('settings').update({ colors }).eq('id', 'global');
      } catch (e) {
          console.error("Error saving global colors:", e);
      }
  };

  const deleteProduct = async (id: string | undefined) => {
    if (!id) return;
    try {
        setProducts(prev => prev.filter(p => p.id !== id));
        await supabase.from('products').delete().eq('id', id);
    } catch (e) {
        console.error("Error al borrar producto:", e);
        alert("Error al borrar el producto del servidor.");
    }
  };

  const toggleProductPublish = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const newPublished = !product.published;
    const newStatus = newPublished ? 'Activo' : 'Inactivo';
    
    // Optimistic local state update
    setProducts(prev => prev.map(p => p.id === id ? { ...p, published: newPublished, status: newStatus } : p));
    
    const { error } = await supabase.from('products').update({ status: newStatus }).eq('id', id);
    if (error) {
        console.error("Error updating status:", error);
        // Rollback on error
        setProducts(prev => prev.map(p => p.id === id ? { ...p, published: !newPublished, status: product.status } : p));
        alert(`Error al cambiar estado: ${error.message}`);
    }
  };

  const generateSuggestedSKU = (categoryId: string, title: string, color?: string, subCategoryId?: string) => {
    const getCode = (id: string | undefined, length: number = 3) => {
      if (!id) return '';
      let name = id;
      const cat = globalCategories.find(c => c.id === categoryId);
      if (cat) {
          if (id === categoryId) name = cat.name;
          else {
              const sub = (cat as any).subCategories?.find((s: any) => s.id === id);
              if (sub) name = sub.name;
          }
      }
      return name.replace(/\s+/g, '').substring(0, length).toUpperCase();
    };
    const catPart = getCode(categoryId, 2);
    const subPart = getCode(subCategoryId, 2);
    
    const titlePart = title
        .split(/[\s-|]+/)
        .map(w => w[0])
        .filter(c => c && /[a-zA-Z0-9]/.test(c))
        .join('')
        .substring(0, 4)
        .toUpperCase();
        
    let colorPart = '';
    const selectedColors = Array.isArray(color) ? color : (color ? [color] : []);
    
    if (selectedColors.length > 0) {
        const colorNames = selectedColors.map(c => {
            if (c.startsWith('#')) {
                return globalColors.find(sc => sc.hex.toLowerCase() === c.toLowerCase())?.name || '';
            }
            return c;
        }).filter(Boolean);

        const getColorCode = (name: string) => {
            const map: Record<string, string> = {
                'ROJO': 'RJ', 'ROSA': 'RS', 'ROSADO': 'RS', 'NEGRO': 'NG', 'BLANCO': 'BL',
                'AZUL': 'AZ', 'VERDE': 'VD', 'AMARILLO': 'AM', 'NARANJA': 'NJ', 'CELESTE': 'CL',
                'GRIS': 'GR', 'BEIGE': 'BG', 'CAFÉ': 'CF', 'CAFE': 'CF', 'MARRON': 'MR',
                'MORADO': 'MD', 'TURQUESA': 'TQ', 'ORO': 'OR', 'PLATA': 'PL'
            };
            const upper = name.toUpperCase().trim();
            if (map[upper]) return map[upper];
            
            const match = upper.match(/^[A-Z](?:[AEIOU]*)([B-DF-HJ-NP-TV-Z])/);
            if (match) return upper[0] + match[1];
            return upper.substring(0, 2);
        };

        if (colorNames.length > 0) {
            colorPart = colorNames.map(getColorCode).join('');
        }
    }
    
    const parts = [catPart, subPart, titlePart, colorPart].filter(Boolean);
    return parts.join('-');
  };

  const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 40) || 'item';

  useEffect(() => {
    const savedUser = localStorage.getItem('delva_sesion_v6_5');
    if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        setSelectedStoreId(parsed.id);
        if (parsed.id === 'master' && !auth.currentUser) {
            signInWithEmailAndPassword(auth, 'master@delva.com', 'delva2026').catch(e => console.warn("Auto-auth Master failed:", e));
        }
    }

    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
            setIsSynced(true);
            setAuthEmail(fbUser.email);
        } else {
            setIsSynced(false);
            setAuthEmail(null);
            if (currentUser?.id === 'master') {
                 signInWithEmailAndPassword(auth, 'master@delva.com', 'delva2026').catch(() => {});
            }
        }
    });

    const cachedProducts = localStorage.getItem('delva_products_cache');
    if (cachedProducts) {
      setProducts(JSON.parse(cachedProducts));
      setIsLoading(false);
    } else {
      // No cache — isLoading will be turned off by loadData()
      // but add a safety timeout of 8s to prevent infinite spinner
      setTimeout(() => setIsLoading(false), 8000);
    }
  }, []);

  useEffect(() => {
    if (currentUser) localStorage.setItem('delva_sesion_v6_5', JSON.stringify(currentUser));
    else localStorage.removeItem('delva_sesion_v6_5');
  }, [currentUser]);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        // Load Products
        const { data: pData, error: pErr } = await supabase.from('products').select('*').eq('store', 'delva');
        if (pErr) console.error('Products fetch error:', pErr.message);
        if (active) {
          const mappedProducts = (pData || []).map((d: any) => ({
            ...d,
            id: d.id,
            title: d.name,
            subCategoryId: d.subcategory || d.subCategoryId,
            published: d.status === 'Activo'
          }));

          // 🛡️ PROTECCIÓN ANTI-CHOQUES: Desduplicar slugs idénticos en memoria
          const slugCounts: Record<string, number> = {};
          mappedProducts.forEach((p: any) => {
             if (p.slug) {
                slugCounts[p.slug] = (slugCounts[p.slug] || 0) + 1;
             }
          });
          
          mappedProducts.forEach((p: any) => {
             if (p.slug && slugCounts[p.slug] > 1) {
                 // Añade los últimos 4 caracteres del ID para hacerlo único en la tienda
                 p.slug = `${p.slug}-${p.id.slice(-4)}`;
             }
          });

          setProducts(mappedProducts);
          if (mappedProducts.length > 0)
            localStorage.setItem('delva_products_cache', JSON.stringify(mappedProducts));
          // ✅ ALWAYS stop loading after products fetch resolves
          setIsLoading(false);
        }

        // Load Users
        const { data: uData } = await supabase.from('users').select('*');
        if (uData && active) setUsers(uData as User[]);

        // Load Settings
        const { data: sData } = await supabase.from('settings').select('*').in('id', ['global', 'categories']);
        if (sData && active) {
          const globalObj = sData.find((s: any) => s.id === 'global') || {};
          setGlobalWaNumber(globalObj.waNumber || '51900000000');
          setGlobalBrandName(globalObj.brandName || 'DELVA');
          setGlobalPrimaryColor(globalObj.primaryColor || '#1A3C34');
          setGlobalLogo(globalObj.logo || '');
          setGlobalFont(globalObj.font || 'Montserrat');
          setGlobalSocialLinks(globalObj.socialLinks || { ig: '', tk: '', fb: '', yt: '', x: '' });
          setGlobalCategories(globalObj.categories ?? CATEGORIES);
          
          const defaultColors = [
              { name: 'Negro', hex: '#1A1A1A' }, { name: 'Blanco', hex: '#FFFFFF' }, { name: 'Gris', hex: '#8E8E93' },
              { name: 'Beige', hex: '#F5F5DC' }, { name: 'Café', hex: '#5D4037' }, { name: 'Rojo', hex: '#FF4D4F' },
              { name: 'Rosa', hex: '#FF85C0' }, { name: 'Naranja', hex: '#FFA940' }, { name: 'Amarillo', hex: '#FFEC3D' },
              { name: 'Verde', hex: '#52C41A' }, { name: 'Turquesa', hex: '#13C2C2' }, { name: 'Azul', hex: '#1890FF' },
              { name: 'Morado', hex: '#722ED1' }, { name: 'Oro', hex: '#D4B106' }, { name: 'Plata', hex: '#C0C0C0' }
          ];
          setGlobalColors(globalObj.colors && globalObj.colors.length > 0 ? globalObj.colors : defaultColors);
          document.documentElement.style.setProperty('--primary', globalObj.primaryColor || '#1A3C34');
        }

        // Load Banners
        const { data: bData } = await supabase.from('banners').select('*');
        if (bData && active) setBanners(bData as any[]);

      } catch (e) {
        console.error("Supabase load error:", e);
        if (active) setIsLoading(false);
      }
    };

    loadData();

    const channel = supabase.channel('delva-data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: "store=eq.delva" }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, loadData)
      .subscribe();

    return () => { 
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const effectiveStoreId = selectedStoreId || currentUser.id;
    if (!effectiveStoreId) return;

    let active = true;
    setLoadingFinancials(true);

    const loadFinancials = async () => {
      try {
        const [salesRes, expRes, fixedRes] = await Promise.all([
          supabase.from('sales').select('*').eq('sellerId', effectiveStoreId).order('createdAt', { ascending: false }),
          supabase.from('expenses').select('*').eq('storeId', effectiveStoreId).order('createdAt', { ascending: false }),
          supabase.from('fixedExpenses').select('*').eq('storeId', effectiveStoreId)
        ]);
        if (active) {
          if (salesRes.data) setSales(salesRes.data as Sale[]);
          if (expRes.data) setExpenses(expRes.data as Expense[]);
          if (fixedRes.data) setFixedExpenses(fixedRes.data as FixedExpense[]);
          setLoadingFinancials(false);
        }
      } catch (e) {
        console.error("Error loading financials:", e);
        if (active) setLoadingFinancials(false);
      }
    };

    loadFinancials();

    const channel = supabase.channel('delva-financials')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales', filter: `sellerId=eq.${effectiveStoreId}` }, loadFinancials)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `storeId=eq.${effectiveStoreId}` }, loadFinancials)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixedExpenses', filter: `storeId=eq.${effectiveStoreId}` }, loadFinancials)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [currentUser, selectedStoreId]);

  const addToCart = (product: Product, color?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedColor === color);
      if (existing) return prev.map(item => (item.id === product.id && item.selectedColor === color) ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1, selectedColor: color }];
    });
    setTimeout(() => setIsCartOpen(true), 50);
  };

  const updateCartQty = (id: string, color: string | undefined, delta: number) => {
    setCart(prev => {
      const updated = prev.map(item => (item.id === id && item.selectedColor === color) ? { ...item, quantity: item.quantity + delta } : item);
      return updated.filter(item => item.quantity > 0);
    });
  };

  const getWhatsAppLink = (p: Product, color?: string) => {
    const targetNumber = p.waNumber?.trim() || globalWaNumber;
    let msg = `¡Hola DELVA! Me interesa: *${p.title}*`;
    if (color) msg += ` (Color: ${color})`;
    msg += ` - Precio: S/ ${Number(p.price || 0).toFixed(2)}`;
    return `https://wa.me/${targetNumber}?text=${encodeURIComponent(msg)}`;
  };

  const alertAction = (title: string, message: string) => {
    alert(`${title}: ${message}`);
  };

  const confirmAction = (title: string, message: string, onConfirm: () => void) => {
    if (confirm(`${title}\n\n${message}`)) onConfirm();
  };

  const onRecordSale = (p: Product) => {
    console.log("Recording sale for:", p.title);
  };

  return (
    <AppContext.Provider value={{
      products, users, currentUser, setCurrentUser, cart, setCart, addToCart, updateCartQty,
      isCartOpen, setIsCartOpen, showLogin, setShowLogin, editingProduct, setEditingProduct,
      searchTerm, setSearchTerm, activeCategory, setActiveCategory,
      isLoading, globalWaNumber, globalBrandName, globalPrimaryColor, globalLogo, globalFont, globalSocialLinks,
      globalCategories, banners, getWhatsAppLink, alertAction, confirmAction, onRecordSale,
      globalColors, saveGlobalColors,
      // Auth
      setSelectedProfileForLogin, loginPassword, setLoginPassword, activeLoginTab, setActiveLoginTab,
      regName, setRegName, regPhone, setRegPhone, regHeardFrom, setRegHeardFrom,
      regPass, setRegPass, loginIdentifier, setLoginIdentifier, isLoggingIn,
      handleGoogleLogin, attemptLogin, logout,
      // Cart/Referral
      referralCode, setReferralCode,
      // Status
      isSynced, authEmail,
      // Product Editor
      globalTags, handleImageUpload, handleGalleryUpload, removeGalleryImage,
      isSaving, saveProduct, updateProductStock, assignSKUToProduct, generateSuggestedSKU, deleteProduct, fileInputRef, galleryInputRef,
      toggleProductPublish,
      sales, expenses, fixedExpenses, loadingFinancials, selectedStoreId, setSelectedStoreId
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
}
