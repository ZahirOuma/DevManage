import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCOQxhH3XcWRL5NzvPxHa5TRPd3u8pN19o",
  authDomain: "taskmanager-29403.firebaseapp.com",
  projectId: "taskmanager-29403",
  storageBucket: "taskmanager-29403.firebasestorage.app",
  messagingSenderId: "924688744522",
  appId: "1:924688744522:web:ba0d5effacdd5a058326b3",
  measurementId: "G-8VLDLDJ7SG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services with persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app; 