import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyClnKVrMn0Kv4AJvLGKeXOPi_0DZF5rfcI",
    authDomain: "delva-cb9d5.firebaseapp.com",
    projectId: "delva-cb9d5",
    storageBucket: "delva-cb9d5.firebasestorage.app",
    messagingSenderId: "60299677417",
    appId: "1:60299677417:web:aad42de21902906fe6ea78",
    measurementId: "G-JBVH2P76EF"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Cloud Firestore y obtener una referencia al servicio
export const db = getFirestore(app);
