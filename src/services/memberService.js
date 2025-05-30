import { collection, addDoc, getDocs, getDoc, updateDoc, deleteDoc, doc, query, where, or } from 'firebase/firestore';
import { db } from './firebase';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const TEAM_MEMBERS_COLLECTION = 'team_members';

// Fonction pour générer un mot de passe temporaire
const generateTemporaryPassword = () => {
  const length = 8;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

export const memberService = {
  // Créer un nouveau membre
  async createMember(memberData) {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      const memberToCreate = {
        ...memberData,
        createdBy: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, TEAM_MEMBERS_COLLECTION), memberToCreate);
      
      // Récupérer le membre nouvellement créé avec son ID
      const newMemberDoc = await getDoc(docRef);
      const newMember = {
        id: newMemberDoc.id,
        ...newMemberDoc.data()
      };

      // Retourner le membre créé pour le rafraîchissement
      return newMember;
    } catch (error) {
      console.error('Error creating member:', error);
      throw error;
    }
  },

  // Récupérer tous les membres créés par l'utilisateur
  async getAllMembers() {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      const membersRef = collection(db, TEAM_MEMBERS_COLLECTION);
      const q = query(
        membersRef,
        where('createdBy', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting members:', error);
      throw error;
    }
  },

  // Récupérer un membre par son ID
  async getMemberById(memberId) {
    try {
      const memberDoc = await getDoc(doc(db, TEAM_MEMBERS_COLLECTION, memberId));
      if (memberDoc.exists()) {
        return { id: memberDoc.id, ...memberDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting member:', error);
      throw error;
    }
  },

  // Mettre à jour un membre
  async updateMember(memberId, memberData) {
    try {
      const memberRef = doc(db, TEAM_MEMBERS_COLLECTION, memberId);
      await updateDoc(memberRef, {
        ...memberData,
        updatedAt: new Date(),
      });
      return { id: memberId, ...memberData };
    } catch (error) {
      console.error('Error updating member:', error);
      throw error;
    }
  },

  // Supprimer un membre
  async deleteMember(memberId) {
    try {
      await deleteDoc(doc(db, TEAM_MEMBERS_COLLECTION, memberId));
      return true;
    } catch (error) {
      console.error('Error deleting member:', error);
      throw error;
    }
  },

  // Rechercher des membres
  async searchMembers(searchTerm) {
    try {
      const membersRef = collection(db, TEAM_MEMBERS_COLLECTION);
      const q = query(
        membersRef,
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error searching members:', error);
      throw error;
    }
  },

  // Récupérer les membres d'un projet
  async getProjectMembers(projectId) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const project = projectDoc.data();
      if (!project.members || project.members.length === 0) {
        return [];
      }

      const membersDetails = await Promise.all(
        project.members.map(async (memberId) => {
          const memberRef = doc(db, TEAM_MEMBERS_COLLECTION, memberId);
          const memberDoc = await getDoc(memberRef);
          if (memberDoc.exists()) {
            return { id: memberDoc.id, ...memberDoc.data() };
          }
          return null;
        })
      );

      return membersDetails.filter(member => member !== null);
    } catch (error) {
      console.error('Error getting project members:', error);
      throw new Error(`Failed to get project members: ${error.message}`);
    }
  },

  // Authentifier un membre
  async loginMember(email, password) {
    try {
      const q = query(
        collection(db, TEAM_MEMBERS_COLLECTION),
        where('email', '==', email)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Invalid email or password');
      }

      const memberDoc = querySnapshot.docs[0];
      const memberData = memberDoc.data();

      if (!memberData.password || memberData.password !== password) {
        throw new Error('Invalid email or password');
      }

      return {
        id: memberDoc.id,
        ...memberData
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Définir le mot de passe d'un membre
  async setMemberPassword(memberId, password) {
    try {
      const memberRef = doc(db, TEAM_MEMBERS_COLLECTION, memberId);
      const memberDoc = await getDoc(memberRef);

      if (!memberDoc.exists()) {
        throw new Error('Member not found');
      }

      const member = memberDoc.data();
      const email = member.email;

      // Créer un compte Firebase Auth pour le membre
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Mettre à jour le membre dans Firestore
      await updateDoc(memberRef, {
        hasSetPassword: true,
        authUid: userCredential.user.uid,
        updatedAt: new Date()
      });

      return { id: memberId, ...member, hasSetPassword: true };
    } catch (error) {
      console.error('Error setting member password:', error);
      throw new Error('Failed to set password');
    }
  },

  // Récupérer les tâches assignées à un membre
  async getMemberTasks(memberId) {
    try {
      const tasksRef = collection(db, 'tasks');
      const q = query(tasksRef, where('assignedTo', '==', memberId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting member tasks:', error);
      throw new Error('Failed to get member tasks');
    }
  },

  // Mettre à jour le statut d'une tâche
  async updateTaskStatus(taskId, status) {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        status,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error updating task status:', error);
      throw new Error('Failed to update task status');
    }
  },

  // Récupérer les membres des projets de l'utilisateur
  async getUserMembers(userId) {
    try {
      // D'abord, récupérer tous les projets de l'utilisateur
      const projectsRef = collection(db, 'projects');
      const projectsQuery = query(
        projectsRef,
        or(
          where('createdBy', '==', userId),
          where('members', 'array-contains', userId)
        )
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      
      // Collecter tous les IDs des membres uniques
      const memberIds = new Set();
      projectsSnapshot.docs.forEach(doc => {
        const project = doc.data();
        if (project.members) {
          project.members.forEach(memberId => memberIds.add(memberId));
        }
      });

      // Récupérer les détails de tous les membres
      const membersDetails = await Promise.all(
        Array.from(memberIds).map(async (memberId) => {
          const memberRef = doc(db, TEAM_MEMBERS_COLLECTION, memberId);
          const memberDoc = await getDoc(memberRef);
          if (memberDoc.exists()) {
            return { id: memberDoc.id, ...memberDoc.data() };
          }
          return null;
        })
      );

      return membersDetails.filter(member => member !== null);
    } catch (error) {
      console.error('Error getting user members:', error);
      throw new Error('Failed to get user members');
    }
  }
}; 