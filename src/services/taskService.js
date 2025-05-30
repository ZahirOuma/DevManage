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
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const TASKS_COLLECTION = 'tasks';

export const taskService = {
  // Create a new task
  async createTask(taskData) {
    try {
      const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
        ...taskData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return { id: docRef.id, ...taskData };
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  // Get a task
  async getTask(taskId) {
    try {
      const docRef = doc(db, TASKS_COLLECTION, taskId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting task:', error);
      throw error;
    }
  },

  // Update a task
  async updateTask(taskId, taskData) {
    try {
      const taskRef = doc(db, TASKS_COLLECTION, taskId);
      await updateDoc(taskRef, {
        ...taskData,
        updatedAt: new Date(),
      });
      return { id: taskId, ...taskData };
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  // Delete a task
  async deleteTask(taskId) {
    try {
      const taskRef = doc(db, TASKS_COLLECTION, taskId);
      await deleteDoc(taskRef);
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  // Get tasks for a specific project
  async getProjectTasks(projectId) {
    if (!projectId) return [];
    try {
      const q = query(
        collection(db, TASKS_COLLECTION),
        where('projectId', '==', projectId)
      );
      const querySnapshot = await getDocs(q);
      // Tri côté client par createdAt décroissant
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    } catch (error) {
      console.error('Error getting project tasks:', error);
      throw error;
    }
  },

  // Get tasks for a specific user (all tasks created by the user)
  async getUserTasks(userId) {
    if (!userId) return [];
    try {
      const q = query(
        collection(db, TASKS_COLLECTION),
        where('createdBy', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      // Tri côté client par createdAt décroissant
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    } catch (error) {
      console.error('Error getting user tasks:', error);
      throw error;
    }
  },

  // Get tasks by status
  async getTasksByStatus(status) {
    if (!status) return [];
    try {
      const q = query(
        collection(db, TASKS_COLLECTION),
        where('status', '==', status)
      );
      const querySnapshot = await getDocs(q);
      // Tri côté client par createdAt décroissant
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    } catch (error) {
      throw error;
    }
  },

  async assignTaskToMember(taskId, memberId) {
    try {
      const taskRef = doc(db, TASKS_COLLECTION, taskId);
      const taskDoc = await getDoc(taskRef);

      if (!taskDoc.exists()) {
        throw new Error('Task not found');
      }

      const task = taskDoc.data();
      
      // Vérifier si le membre appartient au projet de la tâche
      const projectRef = doc(db, 'projects', task.projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const project = projectDoc.data();
      if (!project.members || !project.members.includes(memberId)) {
        throw new Error('Member does not belong to this project');
      }

      // Mettre à jour la tâche avec le membre assigné
      await updateDoc(taskRef, {
        assignedTo: memberId,
        updatedAt: new Date()
      });

      return true;
    } catch (error) {
      console.error('Error assigning task to member:', error);
      throw error;
    }
  },

  // Get tasks assigned to a specific member
  async getMemberAssignedTasks(memberId) {
    if (!memberId) return [];
    try {
      const q = query(
        collection(db, TASKS_COLLECTION),
        where('assignedTo', '==', memberId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting member assigned tasks:', error);
      throw error;
    }
  },

  // Update task status
  async updateTaskStatus(taskId, status) {
    try {
      const taskRef = doc(db, TASKS_COLLECTION, taskId);
      await updateDoc(taskRef, {
        status,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  },

  // Get all tasks
  async getAllTasks() {
    try {
      const querySnapshot = await getDocs(collection(db, TASKS_COLLECTION));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  },

  // Get task by ID
  async getTaskById(taskId) {
    try {
      const taskDoc = await getDoc(doc(db, TASKS_COLLECTION, taskId));
      if (taskDoc.exists()) {
        return { id: taskDoc.id, ...taskDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting task:', error);
      throw error;
    }
  },

  // Get tasks assigned to a specific member
  async getMemberTasks(memberId) {
    try {
      const q = query(
        collection(db, TASKS_COLLECTION),
        where('assignedTo', '==', memberId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting member tasks:', error);
      throw error;
    }
  },

  // Attacher une tâche existante à un projet
  async assignTaskToProject(taskId, projectId) {
    try {
      const taskRef = doc(db, TASKS_COLLECTION, taskId);
      const taskDoc = await getDoc(taskRef);

      if (!taskDoc.exists()) {
        throw new Error('Task not found');
      }

      // Vérifier si le projet existe
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      // Mettre à jour la tâche avec l'ID du projet
      await updateDoc(taskRef, {
        projectId: projectId,
        updatedAt: new Date()
      });

      return true;
    } catch (error) {
      console.error('Error assigning task to project:', error);
      throw error;
    }
  },

  // Récupérer toutes les tâches des projets de l'utilisateur
  async getTasks() {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // D'abord, récupérer tous les projets de l'utilisateur
      const projectsRef = collection(db, 'projects');
      const projectsQuery = query(
        projectsRef,
        where('createdBy', '==', currentUser.uid)
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      
      // Collecter les IDs des projets
      const projectIds = projectsSnapshot.docs.map(doc => doc.id);
      
      if (projectIds.length === 0) {
        return [];
      }

      // Récupérer les tâches de ces projets
      const tasksRef = collection(db, TASKS_COLLECTION);
      const tasksQuery = query(
        tasksRef,
        where('projectId', 'in', projectIds)
      );
      const tasksSnapshot = await getDocs(tasksQuery);
      
      return tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  },
}; 