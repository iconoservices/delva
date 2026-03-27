'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db, auth, googleProvider } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { signInWithPopup } from 'firebase/auth';
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
    if (overrideUser) {
        setCurrentUser(overrideUser);
        setShowLogin(false);
        return;
    }
    // Simple mock login for this version
    const found = users.find(u => (u.phone === loginIdentifier || u.id === loginIdentifier) && u.password === loginPassword);
    if (found) {
        setCurrentUser(found);
        setShowLogin(false);
    } else {
        alert("Credenciales incorrectas");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingProduct) {
      const reader = new FileReader();
      reader.onload = (ev: any) => {
        if (editingProduct) {
          setEditingProduct({ ...editingProduct, image: ev.target?.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length && editingProduct) {
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev: any) => {
                setEditingProduct((prev: any) => ({
                    ...prev,
                    gallery: [...(prev.gallery || []), ev.target?.result]
                }));
            };
            reader.readAsDataURL(file);
        });
    }
  };

  const removeGalleryImage = (idx: number) => {
      if (editingProduct) {
          const gallery = [...(editingProduct.gallery || [])];
          gallery.splice(idx, 1);
          setEditingProduct({ ...editingProduct, gallery });
      }
  };

  const saveProduct = async (prod: any) => {
      try {
          setIsSaving(true);
          const pRef = doc(db, 'products', prod.id || Math.random().toString(36).substring(7));
          await setDoc(pRef, { ...prod, updatedAt: new Date().toISOString() }, { merge: true });
          setEditingProduct(null);
      } catch (e) {
          console.error(e);
      } finally {
          setIsSaving(false);
      }
  };

  const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 40) || 'item';

  useEffect(() => {
    const savedUser = localStorage.getItem('delva_sesion_v6_5');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));

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
          setDoc(doc(db, 'products', d.id), { slug }, { merge: true }).catch(console.error);
        }
        return { ...data, id: d.id, slug };
      });
      setProducts(updatedProducts);
      // 💾 Save to memory for instant load next time
      localStorage.setItem('delva_products_cache', JSON.stringify(updatedProducts));
      setIsLoading(false);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const allUsers = snapshot.docs.map(d => ({ ...(d.data() as User), id: d.id }));
      setUsers(allUsers);
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
    });

    const unsubBanners = onSnapshot(collection(db, 'banners'), (snapshot) => {
      setBanners(snapshot.docs.map(d => d.data() as any));
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
      isSaving, saveProduct, fileInputRef, galleryInputRef
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
