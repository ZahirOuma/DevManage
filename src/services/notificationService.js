import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  // Demander la permission pour les notifications
  static async requestPermission() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('Statut de la permission de notification:', status);
      return status === 'granted';
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
      return false;
    }
  }

  // Programmer une notification pour une tâche
  static async scheduleTaskReminder(taskId, taskTitle, dueDate) {
    try {
      if (!dueDate) {
        console.log('Pas de date d\'échéance spécifiée');
        return null;
      }

      const dueDateTime = new Date(dueDate);
      const twoDaysBefore = new Date(dueDateTime);
      twoDaysBefore.setDate(dueDateTime.getDate() - 2);

      console.log('Date d\'échéance:', dueDateTime.toLocaleString());
      console.log('Date du rappel (2 jours avant):', twoDaysBefore.toLocaleString());
      console.log('Date actuelle:', new Date().toLocaleString());

      // Vérifier si la date est dans le futur
      if (twoDaysBefore > new Date()) {
        const reminderData = {
          taskId,
          taskTitle,
          dueDate: dueDate,
          reminderDate: twoDaysBefore.toISOString(),
        };

        console.log('Données du rappel à sauvegarder:', reminderData);

        // Sauvegarder les données du rappel
        await AsyncStorage.setItem(
          `task_reminder_${taskId}`,
          JSON.stringify(reminderData)
        );

        // Vérifier que les données ont été sauvegardées
        const savedData = await AsyncStorage.getItem(`task_reminder_${taskId}`);
        console.log('Données sauvegardées:', savedData);

        // Programmer la notification
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Rappel de tâche',
            body: `La tâche "${taskTitle}" arrive à échéance dans 2 jours !`,
            data: { taskId },
          },
          trigger: {
            date: twoDaysBefore,
          },
        });

        console.log('Notification programmée avec l\'ID:', notificationId);

        return reminderData;
      } else {
        console.log('La date du rappel est dans le passé');
      }
    } catch (error) {
      console.error('Erreur lors de la planification du rappel:', error);
    }
    return null;
  }

  // Annuler une notification pour une tâche
  static async cancelTaskReminder(taskId) {
    try {
      console.log('Annulation du rappel pour la tâche:', taskId);
      
      // Récupérer toutes les notifications programmées
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('Notifications programmées:', scheduledNotifications);
      
      // Trouver et annuler la notification correspondante
      for (const notification of scheduledNotifications) {
        if (notification.content.data?.taskId === taskId) {
          console.log('Annulation de la notification:', notification.identifier);
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }

      // Supprimer les données du rappel
      await AsyncStorage.removeItem(`task_reminder_${taskId}`);
      
      // Vérifier que le rappel a bien été supprimé
      const checkReminder = await AsyncStorage.getItem(`task_reminder_${taskId}`);
      console.log('Vérification après suppression:', checkReminder);
    } catch (error) {
      console.error('Erreur lors de l\'annulation du rappel:', error);
    }
  }

  // Vérifier l'état d'un rappel
  static async checkReminderStatus(taskId) {
    try {
      console.log('Vérification du statut du rappel pour la tâche:', taskId);
      const reminder = await AsyncStorage.getItem(`task_reminder_${taskId}`);
      console.log('Données du rappel:', reminder);
      return reminder ? JSON.parse(reminder) : null;
    } catch (error) {
      console.error('Erreur lors de la vérification du rappel:', error);
      return null;
    }
  }

  // Programmer une notification de test
  static async scheduleTestNotification() {
    try {
      console.log('Envoi d\'une notification de test immédiate');

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test de notification',
          body: 'Ceci est une notification de test pour vérifier le fonctionnement des notifications !',
          data: { type: 'test' },
        },
        trigger: null, // null signifie que la notification sera envoyée immédiatement
      });

      console.log('Notification de test envoyée');
      return new Date(); // Retourne la date actuelle pour l'affichage
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de test:', error);
      throw error;
    }
  }
}

export default NotificationService; 