import { auth, db } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const authService = {
  async register(email, password, firstName, lastName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Créer le document utilisateur dans Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        firstName,
        lastName,
        createdAt: new Date(),
        role: 'user'
      });

      return {
        id: user.uid,
        email: user.email,
        firstName,
        lastName,
        role: 'user'
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error.message);
    }
  },

  async login(email, password) {
    try {
      // Authentifier avec Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Vérifier si l'utilisateur est un admin dans Firestore
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      
      if (adminDoc.exists()) {
        return {
          id: user.uid,
          email: user.email,
          role: 'admin',
          ...adminDoc.data()
        };
      }

      throw new Error('Invalid email or password');
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Invalid email or password');
    }
  }
};

export default authService; 