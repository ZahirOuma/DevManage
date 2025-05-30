import { db } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  orderBy,
  or,
} from 'firebase/firestore';

const PROJECTS_COLLECTION = 'projects';

export const projectService = {
  // Create a new project
  async createProject(projectData) {
    try {
      const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), {
        ...projectData,
        createdAt: new Date(),
        updatedAt: new Date(),
        members: [],
      });

      // Récupérer le projet nouvellement créé avec son ID
      const newProjectDoc = await getDoc(docRef);
      const newProject = {
        id: newProjectDoc.id,
        ...newProjectDoc.data()
      };

      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  // Get all projects
  async getAllProjects() {
    try {
      const querySnapshot = await getDocs(collection(db, PROJECTS_COLLECTION));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting projects:', error);
      throw error;
    }
  },

  // Get a single project by ID
  async getProjectById(projectId) {
    try {
      const projectDoc = await getDoc(doc(db, PROJECTS_COLLECTION, projectId));
      if (projectDoc.exists()) {
        return { id: projectDoc.id, ...projectDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting project:', error);
      throw error;
    }
  },

  // Update a project
  async updateProject(projectId, projectData) {
    try {
      const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
      await updateDoc(projectRef, {
        ...projectData,
        updatedAt: new Date(),
      });
      return { id: projectId, ...projectData };
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  // Delete a project
  async deleteProject(projectId) {
    try {
      await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId));
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  // Get all projects for a user
  async getUserProjects(userId) {
    try {
      // Créer une requête pour obtenir les projets où l'utilisateur est créateur ou membre
      const projectsRef = collection(db, PROJECTS_COLLECTION);
      
      // Récupérer d'abord les projets créés par l'utilisateur
      const createdProjectsQuery = query(
        projectsRef,
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      // Récupérer ensuite les projets où l'utilisateur est membre
      const memberProjectsQuery = query(
        projectsRef,
        where('members', 'array-contains', userId)
      );

      // Exécuter les deux requêtes
      const [createdProjectsSnapshot, memberProjectsSnapshot] = await Promise.all([
        getDocs(createdProjectsQuery),
        getDocs(memberProjectsQuery)
      ]);

      // Combiner les résultats en évitant les doublons
      const projectsMap = new Map();
      
      createdProjectsSnapshot.docs.forEach(doc => {
        projectsMap.set(doc.id, { id: doc.id, ...doc.data() });
      });
      
      memberProjectsSnapshot.docs.forEach(doc => {
        if (!projectsMap.has(doc.id)) {
          projectsMap.set(doc.id, { id: doc.id, ...doc.data() });
        }
      });

      // Convertir la Map en tableau et trier par date de création
      return Array.from(projectsMap.values())
        .sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
    } catch (error) {
      console.error('Error getting user projects:', error);
      throw error;
    }
  },

  // Add a member to a project
  async addMemberToProject(projectId, memberId) {
    try {
      const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const project = projectDoc.data();
      const members = project.members || [];
      
      if (members.includes(memberId)) {
        throw new Error('Member already in project');
      }

      await updateDoc(projectRef, {
        members: [...members, memberId],
        updatedAt: new Date(),
      });

      return true;
    } catch (error) {
      console.error('Error adding member to project:', error);
      throw error;
    }
  },

  // Remove a member from a project
  async removeMemberFromProject(projectId, memberId) {
    try {
      const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const project = projectDoc.data();
      const members = project.members || [];
      
      if (!members.includes(memberId)) {
        throw new Error('Member not in project');
      }

      await updateDoc(projectRef, {
        members: members.filter(id => id !== memberId),
        updatedAt: new Date(),
      });

      return true;
    } catch (error) {
      console.error('Error removing member from project:', error);
      throw error;
    }
  },

  // Get projects for a member
  async getMemberProjects(memberId) {
    try {
      const projectsRef = collection(db, PROJECTS_COLLECTION);
      const q = query(projectsRef, where('members', 'array-contains', memberId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting member projects:', error);
      throw error;
    }
  }
}; 