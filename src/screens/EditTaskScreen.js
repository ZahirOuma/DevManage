import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';
import { Ionicons } from '@expo/vector-icons';
import VoiceRecorder from '../components/VoiceRecorder';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EditTaskScreen = ({ route, navigation }) => {
  const { taskId } = route.params;
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    dueDate: '',
    projectId: '',
  });
  const [projects, setProjects] = useState([]);
  const [voiceNote, setVoiceNote] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const { user } = useAuth();
  const [reminderEnabled, setReminderEnabled] = useState(false);

  useEffect(() => {
    loadTask();
    loadProjects();
    checkReminderStatus();
  }, [taskId]);

  const loadTask = async () => {
    setLoading(true);
    try {
      const task = await taskService.getTask(taskId);
      if (task) {
        setTask(task);
        setFormData({
          title: task.title || '',
          description: task.description || '',
          status: task.status || 'todo',
          dueDate: task.dueDate ? new Date(task.dueDate.seconds * 1000).toISOString().split('T')[0] : '',
          projectId: task.projectId || '',
        });
        setVoiceNote(task.voiceNote || null);
        setAttachments(task.attachments || []);
      }
    } catch (error) {
      console.error('Error loading task:', error);
      Alert.alert('Error', 'Failed to load task details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const userProjects = await projectService.getUserProjects(user.uid);
      setProjects(userProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  // Fonction pour gérer la note vocale
  const handleVoiceRecording = (recording) => {
    setVoiceNote(recording);
  };

  const handlePickDocument = async () => {
    try {
      // Configuration du picker
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });

      console.log('Résultat du picker:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        
        // Vérifier si le fichier existe
        const fileInfo = await FileSystem.getInfoAsync(selectedFile.uri);
        console.log('Info du fichier:', fileInfo);

        if (!fileInfo.exists) {
          Alert.alert('Erreur', 'Le fichier n\'a pas pu être copié');
          return;
        }

        // Créer l'objet d'attachement avec toutes les informations nécessaires
        const newAttachment = {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.mimeType || 'application/octet-stream',
          size: selectedFile.size
        };

        console.log('Nouvelle pièce jointe à ajouter:', newAttachment);

        // Mettre à jour la liste des pièces jointes
        setAttachments(currentAttachments => {
          const updatedAttachments = [...currentAttachments, newAttachment];
          console.log('Liste mise à jour des pièces jointes:', updatedAttachments);
          return updatedAttachments;
        });

        // Confirmation visuelle
        Alert.alert('Succès', 'Document ajouté avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du document:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le document');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        // Vérifier si l'image existe
        const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri);
        
        if (!fileInfo.exists) {
          Alert.alert('Erreur', 'L\'image n\'a pas pu être copiée');
          return;
        }

        // Créer l'objet d'attachement
        const newAttachment = {
          uri: result.assets[0].uri,
          name: result.assets[0].fileName || 'image.jpg',
          type: 'image/jpeg',
          size: result.assets[0].fileSize
        };

        // Mettre à jour la liste des pièces jointes
        setAttachments(currentAttachments => {
          const updatedAttachments = [...currentAttachments, newAttachment];
          console.log('Liste mise à jour des pièces jointes:', updatedAttachments); // Debug log
          return updatedAttachments;
        });

        // Confirmation visuelle
        Alert.alert('Succès', 'Image ajoutée avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  // Ajouter cette fonction pour déboguer l'état des pièces jointes
  useEffect(() => {
    console.log('État actuel des pièces jointes:', attachments);
  }, [attachments]);

  const handleRemoveAttachment = (index) => {
    Alert.alert(
      'Supprimer la pièce jointe',
      'Voulez-vous vraiment supprimer cette pièce jointe ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            const newAttachments = [...attachments];
            newAttachments.splice(index, 1);
            setAttachments(newAttachments);
          },
        },
      ]
    );
  };

  const handleOpenAttachment = async (attachment) => {
    try {
      if (!attachment.uri) {
        Alert.alert('Erreur', 'Le fichier n\'existe pas');
        return;
      }

      // Vérifier si le fichier existe
      const fileInfo = await FileSystem.getInfoAsync(attachment.uri);
      
      if (!fileInfo.exists) {
        Alert.alert('Erreur', 'Le fichier n\'existe plus');
        return;
      }

      if (Platform.OS === 'android') {
        try {
          // Créer un URI de contenu pour le fichier
          const contentUri = await FileSystem.getContentUriAsync(attachment.uri);
          console.log('URI de contenu créé:', contentUri);

          // Créer l'URL avec le type MIME explicite
          const mimeType = attachment.type || 'application/pdf';
          const urlWithMime = `${contentUri}?type=${encodeURIComponent(mimeType)}`;
          console.log('URL avec type MIME:', urlWithMime);

          // Essayer d'ouvrir avec le type MIME
          const canOpen = await Linking.canOpenURL(urlWithMime);
          if (canOpen) {
            await Linking.openURL(urlWithMime);
          } else {
            // Si ça ne marche pas, essayer avec un intent Android
            const intentUrl = `intent://${contentUri}#Intent;scheme=content;type=${mimeType};end`;
            const canOpenIntent = await Linking.canOpenURL(intentUrl);
            
            if (canOpenIntent) {
              await Linking.openURL(intentUrl);
            } else {
              // Dernier recours : copier le fichier vers un emplacement accessible
              const fileName = attachment.name || 'document.pdf';
              const newUri = `${FileSystem.cacheDirectory}${fileName}`;
              
              await FileSystem.copyAsync({
                from: attachment.uri,
                to: newUri
              });

              const newContentUri = await FileSystem.getContentUriAsync(newUri);
              const finalUrl = `${newContentUri}?type=${encodeURIComponent(mimeType)}`;
              
              await Linking.openURL(finalUrl);
            }
          }
        } catch (error) {
          console.error('Erreur lors de l\'ouverture du fichier:', error);
          Alert.alert(
            'Erreur',
            'Impossible d\'ouvrir le PDF. Veuillez réessayer.'
          );
        }
      } else {
        // Pour iOS, utiliser l'approche directe
        const canOpen = await Linking.canOpenURL(attachment.uri);
        if (canOpen) {
          await Linking.openURL(attachment.uri);
        } else {
          Alert.alert(
            'Erreur',
            'Impossible d\'ouvrir le PDF. Veuillez vérifier que vous avez un lecteur PDF installé.'
          );
        }
      }
    } catch (error) {
      console.error('Erreur détaillée:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'ouvrir le fichier. Erreur: ' + (error.message || 'inconnue')
      );
    }
  };

  // Fonction pour planifier un rappel
  const scheduleReminder = async (dueDate) => {
    try {
      if (!dueDate) {
        console.log('Pas de date d\'échéance spécifiée');
        return;
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
          taskId: taskId,
          taskTitle: formData.title,
          dueDate: dueDate,
          reminderDate: twoDaysBefore.toISOString(),
        };

        console.log('Données du rappel à sauvegarder:', reminderData);

        await AsyncStorage.setItem(
          `task_reminder_${taskId}`,
          JSON.stringify(reminderData)
        );

        // Vérifier que les données ont été sauvegardées
        const savedData = await AsyncStorage.getItem(`task_reminder_${taskId}`);
        console.log('Données sauvegardées:', savedData);

        setReminderEnabled(true);
        Alert.alert(
          'Rappel configuré',
          `Un rappel a été programmé pour le ${twoDaysBefore.toLocaleDateString()}`
        );
      } else {
        console.log('La date du rappel est dans le passé');
        Alert.alert(
          'Date invalide',
          'La date du rappel doit être dans le futur'
        );
      }
    } catch (error) {
      console.error('Erreur lors de la planification du rappel:', error);
      Alert.alert('Erreur', 'Impossible de planifier le rappel');
    }
  };

  // Fonction pour vérifier l'état actuel des rappels
  const checkReminderStatus = async () => {
    try {
      const reminder = await AsyncStorage.getItem(`task_reminder_${taskId}`);
      console.log('État actuel du rappel:', reminder);
      
      if (reminder) {
        const reminderData = JSON.parse(reminder);
        console.log('Données du rappel:', reminderData);
        console.log('Date du rappel:', new Date(reminderData.reminderDate).toLocaleString());
      }
      
      setReminderEnabled(!!reminder);
    } catch (error) {
      console.error('Erreur lors de la vérification du rappel:', error);
    }
  };

  // Fonction pour annuler un rappel
  const cancelReminder = async () => {
    try {
      const reminder = await AsyncStorage.getItem(`task_reminder_${taskId}`);
      console.log('Rappel à annuler:', reminder);
      
      await AsyncStorage.removeItem(`task_reminder_${taskId}`);
      
      // Vérifier que le rappel a bien été supprimé
      const checkReminder = await AsyncStorage.getItem(`task_reminder_${taskId}`);
      console.log('Vérification après suppression:', checkReminder);
      
      setReminderEnabled(false);
      Alert.alert('Rappel annulé', 'Le rappel a été supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'annulation du rappel:', error);
      Alert.alert('Erreur', 'Impossible d\'annuler le rappel');
    }
  };

  const handleUpdateTask = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    setSaving(true);
    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        projectId: formData.projectId,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
        voiceNote: voiceNote,
        attachments: attachments.map((attachment) => ({
          uri: attachment.uri,
          name: attachment.name || 'image.jpg',
          type: attachment.type || 'image/jpeg',
        })),
        updatedBy: user.uid,
        updatedAt: new Date(),
      };

      await taskService.updateTask(taskId, taskData);

      // Gérer les rappels
      if (formData.dueDate) {
        await scheduleReminder(formData.dueDate);
      } else {
        await cancelReminder();
      }

      Alert.alert('Success', 'Task updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this task? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await taskService.deleteTask(taskId);
              Alert.alert('Success', 'Task deleted successfully', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task. Please try again.');
            }
          },
        },
      ],
    );
  };

  const onDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setFormData({ ...formData, dueDate: selectedDate.toISOString().split('T')[0] });
    }
    setShowDatePicker(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return '#FF6B6B';
      case 'doing': return '#4ECDC4';
      case 'done': return '#45B7D1';
      default: return '#95A5A6';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'todo': return '📝 To Do';
      case 'doing': return '⚡ In Progress';
      case 'done': return '✅ Completed';
      default: return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#6C5CE7" />
          <Text style={styles.loadingText}>Loading task details...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>✏️ Edit Task</Text>
          <Text style={styles.subtitle}>Update your task details</Text>
        </View>
        <TouchableOpacity
          style={styles.assignButton}
          onPress={() => navigation.navigate('AssignTask', { 
            taskId: taskId,
            projectId: task?.projectId 
          })}
        >
          <Text style={styles.assignButtonText}>👥 Assign</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>📋 Task Title</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="create-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  placeholder="Enter task title"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>📄 Description</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="document-text-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Describe your task in detail..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Composant Note Vocale */}
            <View style={styles.inputGroup}>
              <VoiceRecorder 
                onRecordingComplete={handleVoiceRecording}
                existingRecording={voiceNote}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>🎯 Status</Text>
              <View style={[styles.pickerContainer, { borderColor: getStatusColor(formData.status) }]}>
                <Picker
                  selectedValue={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="📝 To Do" value="todo" />
                  <Picker.Item label="⚡ In Progress" value="doing" />
                  <Picker.Item label="✅ Completed" value="done" />
                </Picker>
              </View>
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(formData.status) }]}>
                <Text style={styles.statusText}>{getStatusLabel(formData.status)}</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>📅 Due Date</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="calendar-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.dueDate}
                  onChangeText={(text) => setFormData({ ...formData, dueDate: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999"
                />
              </View>
              {formData.dueDate && (
                <View style={styles.reminderInfo}>
                  <Ionicons 
                    name={reminderEnabled ? "alarm" : "alarm-outline"} 
                    size={20} 
                    color={reminderEnabled ? "#10B981" : "#6B7280"} 
                  />
                  <Text style={styles.reminderText}>
                    {reminderEnabled 
                      ? "Rappel programmé 2 jours avant l'échéance"
                      : "Cliquez sur Mettre à jour pour activer le rappel"}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>🗂️ Project</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.projectId}
                  onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="Select a project" value="" />
                  {projects.map(project => (
                    <Picker.Item
                      key={project.id}
                      label={`📁 ${project.name}`}
                      value={project.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.attachmentSection}>
              <Text style={styles.sectionTitle}>
                <Text style={styles.labelIcon}>📎</Text> Pièces jointes
              </Text>
              <View style={styles.attachmentButtons}>
                <TouchableOpacity
                  style={[styles.attachmentButton, styles.documentButton]}
                  onPress={handlePickDocument}
                  activeOpacity={0.8}
                >
                  <Text style={styles.attachmentButtonIcon}>📄</Text>
                  <Text style={styles.attachmentButtonText}>Document</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.attachmentButton, styles.imageButton]}
                  onPress={handlePickImage}
                  activeOpacity={0.8}
                >
                  <Text style={styles.attachmentButtonIcon}>🖼️</Text>
                  <Text style={styles.attachmentButtonText}>Image</Text>
                </TouchableOpacity>
              </View>

              {attachments.length > 0 && (
                <View style={styles.attachmentsList}>
                  <Text style={styles.attachmentsTitle}>Fichiers ajoutés :</Text>
                  {attachments.map((attachment, index) => (
                    <View key={index} style={styles.attachmentItem}>
                      <TouchableOpacity
                        style={styles.attachmentContent}
                        onPress={() => handleOpenAttachment(attachment)}
                      >
                        <Text style={styles.attachmentIcon}>
                          {attachment.type?.startsWith('image/') ? '🖼️' : '📄'}
                        </Text>
                        <Text style={styles.attachmentName}>
                          {attachment.name || 'Image'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeAttachmentButton}
                        onPress={() => handleRemoveAttachment(index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.updateButton]}
              onPress={handleUpdateTask}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Update Task</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={handleDeleteTask}
              disabled={saving}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Delete Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
    padding: 20,
  },
  loadingCard: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#74788D',
    fontWeight: '500',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D3748',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#74788D',
    fontWeight: '500',
  },
  assignButton: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  assignButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 12,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FC',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E6E8F0',
  },
  inputIcon: {
    padding: 18,
  },
  input: {
    flex: 1,
    padding: 18,
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '500',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 18,
  },
  pickerContainer: {
    backgroundColor: '#F7F8FC',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E6E8F0',
    overflow: 'hidden',
  },
  picker: {
    height: 56,
    color: '#2D3748',
  },
  statusIndicator: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  updateButton: {
    backgroundColor: '#10B981',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  attachmentSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  attachmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  documentButton: {
    backgroundColor: '#EFF6FF',
  },
  imageButton: {
    backgroundColor: '#F0FDF4',
  },
  attachmentButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  attachmentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  attachmentsList: {
    marginTop: 12,
  },
  attachmentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  attachmentName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  removeAttachmentButton: {
    padding: 4,
  },
  updateButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  updateButtonText: {
    color: '#9CA3AF',
  },
  deleteButtonText: {
    color: '#9CA3AF',
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  reminderText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
});

export default EditTaskScreen;