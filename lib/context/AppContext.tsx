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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
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
      globalCategories, banners, getWhatsAppLink, alertAction, confirmAction, onRecordSale
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
