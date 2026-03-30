'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db, auth, googleProvider, storage } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { signInWithPopup, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { CATEGORIES, type Product } from '@/lib/data/products';
import { type User, type CartItem } from '@/lib/types';

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
  generateSuggestedSKU: (categoryId: string, title: string, color?: string) => string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
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

  // Cart & Referral
  const [referralCode, setReferralCode] = useState('');

  // Product Editor States
  const [globalTags, setGlobalTags] = useState<string[]>(['destacado', 'oferta', 'nuevo']);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Handlers
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
            // Real master authentication with original credentials
            await signInWithEmailAndPassword(auth, 'master@delva.com', 'delva2026');
            setCurrentUser(overrideUser);
            setShowLogin(false);
            return;
        }

        if (overrideUser) {
            setCurrentUser(overrideUser);
            setShowLogin(false);
            return;
        }

        // Simple mock login for this version
        const found = users.find(u => (u.phone === loginIdentifier || u.id === loginIdentifier) && u.password === loginPassword);
        if (found) {
            // If it's the master credentials via input
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
        // Fallback to local session even if Firebase Auth fails (useful for local dev without internet)
        if (overrideUser) {
            setCurrentUser(overrideUser);
            setShowLogin(false);
        }
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
            // Fallback al original si falla la compresión
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
              const fileRef = ref(storage, `products/${Date.now()}_${Math.random().toString(36).substring(7)}`);
              await uploadBytes(fileRef, prod._pendingImageFile);
              finalImage = await getDownloadURL(fileRef);
          }

          let finalGallery = [];
          for (const url of (prod.gallery || [])) {
              const pending = (prod._pendingGalleryFiles || []).find((p: any) => p.url === url);
              if (pending) {
                  const fileRef = ref(storage, `gallery/${Date.now()}_${Math.random().toString(36).substring(7)}`);
                  await uploadBytes(fileRef, pending.file);
                  finalGallery.push(await getDownloadURL(fileRef));
              } else {
                  finalGallery.push(url);
              }
          }

          const pRef = doc(db, 'products', prod.id || doc(collection(db, 'products')).id);
          
          const dataToSave = { 
              ...prod, 
              image: finalImage, 
              gallery: finalGallery,
              id: pRef.id, 
              updatedAt: new Date().toISOString() 
          };
          
          delete dataToSave._pendingImageFile;
          delete dataToSave._pendingGalleryFiles;

          await setDoc(pRef, dataToSave, { merge: true });
          
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
    await setDoc(doc(db, 'products', id), { stock: newStock }, { merge: true });
  };

  const assignSKUToProduct = async (id: string, sku: string) => {
    await setDoc(doc(db, 'products', id), { sku }, { merge: true });
  };

  const generateSuggestedSKU = (categoryId: string, title: string, color?: string) => {
    const getCatCode = (id: string) => {
      const cat = globalCategories.find(c => c.id === id);
      const name = cat?.name || id;
      return name.substring(0, 3).toUpperCase();
    };
    
    const catPart = getCatCode(categoryId);
    const titlePart = title.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const colorPart = color ? color.replace(/\s+/g, '').substring(0, 3).toUpperCase() : '';
    
    return `${catPart}-${titlePart}${colorPart ? '-' + colorPart : ''}`;
  };

  const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 40) || 'item';

  useEffect(() => {
    const savedUser = localStorage.getItem('delva_sesion_v6_5');
    if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        // If it's the master, ensure we are also authenticated in Firebase Auth
        if (parsed.id === 'master' && !auth.currentUser) {
            signInWithEmailAndPassword(auth, 'master@delva.com', 'delva2026').catch(e => console.warn("Auto-auth Master failed:", e));
        }
    }

    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
        if (!fbUser && currentUser?.id === 'master') {
             // Re-auth if session dropped but we are still master locally
             signInWithEmailAndPassword(auth, 'master@delva.com', 'delva2026').catch(() => {});
        }
    });

    // 📦 PRODUCT MEMORY: Load from cache instantly
    const cachedProducts = localStorage.getItem('delva_products_cache');
    if (cachedProducts) {
      setProducts(JSON.parse(cachedProducts));
      setIsLoading(false); // If we have cache, we aren't "loading" anymore
    }
  }, []);

  useEffect(() => {
    if (currentUser) localStorage.setItem('delva_sesion_v6_5', JSON.stringify(currentUser));
    else localStorage.removeItem('delva_sesion_v6_5');
  }, [currentUser]);

  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const updatedProducts = snapshot.docs.map(d => {
        const data = d.data() as Product;
        const slug = data.slug || slugify(data.title || '');
        if (!data.slug && data.title) {
          setDoc(doc(db, 'products', d.id), { slug }, { merge: true }).catch(() => {});
        }
        return { ...data, id: d.id, slug };
      });
      setProducts(updatedProducts);
      localStorage.setItem('delva_products_cache', JSON.stringify(updatedProducts));
      setIsLoading(false);
    }, (error) => {
      console.warn("Products permissions:", error.message);
      setIsLoading(false);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const allUsers = snapshot.docs.map(d => ({ ...(d.data() as User), id: d.id }));
      setUsers(allUsers);
    }, (error) => {
      console.warn("Users access restricted:", error.message);
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGlobalWaNumber(data.waNumber || '51900000000');
        setGlobalBrandName(data.brandName || 'DELVA');
        setGlobalPrimaryColor(data.primaryColor || '#1A3C34');
        setGlobalLogo(data.logo || '');
        setGlobalFont(data.font || 'Montserrat');
        setGlobalSocialLinks(data.socialLinks || { ig: '', tk: '', fb: '', yt: '', x: '' });
        setGlobalCategories(data.categories ?? CATEGORIES);
        document.documentElement.style.setProperty('--primary', data.primaryColor || '#1A3C34');
      }
    }, (error) => {
      console.warn("Global settings access:", error.message);
    });

    const unsubBanners = onSnapshot(collection(db, 'banners'), (snapshot) => {
      setBanners(snapshot.docs.map(d => d.data() as any));
    }, (error) => {
      console.warn("Banners access:", error.message);
    });

    return () => { unsubProducts(); unsubUsers(); unsubSettings(); unsubBanners(); };
  }, []);

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
    alert(`${title}: ${message}`); // Temporary simple alert
  };

  const confirmAction = (title: string, message: string, onConfirm: () => void) => {
    if (confirm(`${title}\n\n${message}`)) onConfirm();
  };

  const onRecordSale = (p: Product) => {
    console.log("Recording sale for:", p.title);
    // Add real Firestore logic here if desired
  };

  return (
    <AppContext.Provider value={{
      products, users, currentUser, setCurrentUser, cart, setCart, addToCart, updateCartQty,
      isCartOpen, setIsCartOpen, showLogin, setShowLogin, editingProduct, setEditingProduct,
      searchTerm, setSearchTerm, activeCategory, setActiveCategory,
      isLoading, globalWaNumber, globalBrandName, globalPrimaryColor, globalLogo, globalFont, globalSocialLinks,
      globalCategories, banners, getWhatsAppLink, alertAction, confirmAction, onRecordSale,
      // Auth
      setSelectedProfileForLogin, loginPassword, setLoginPassword, activeLoginTab, setActiveLoginTab,
      regName, setRegName, regPhone, setRegPhone, regHeardFrom, setRegHeardFrom,
      regPass, setRegPass, loginIdentifier, setLoginIdentifier, isLoggingIn,
      handleGoogleLogin, attemptLogin,
      // Cart/Referral
      referralCode, setReferralCode,
      // Product Editor
      globalTags, handleImageUpload, handleGalleryUpload, removeGalleryImage,
      isSaving, saveProduct, updateProductStock, assignSKUToProduct, generateSuggestedSKU, fileInputRef, galleryInputRef
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
