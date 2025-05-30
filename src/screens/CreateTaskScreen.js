import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { projectService } from '../services/projectService';
import VoiceRecorder from '../components/VoiceRecorder';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const CreateTaskScreen = ({ route, navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [voiceNote, setVoiceNote] = useState(null);
  const { user } = useAuth();
  const projectId = route.params?.projectId;
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!projectId && user && user.uid) {
      projectService.getUserProjects(user.uid).then(setProjects);
    }
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [user, sound]);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        setAttachments([...attachments, result]);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Échec du choix du document');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setAttachments([...attachments, result.assets[0]]);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Échec du choix de l\'image');
    }
  };

  const handleVoiceRecording = (recording) => {
    setVoiceNote(recording);
  };

  const playVoiceNote = async () => {
    try {
      if (!voiceNote) return;

      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: voiceNote.uri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Erreur lors de la lecture', error);
      Alert.alert('Erreur', 'Impossible de lire la note vocale');
    }
  };

  const stopPlaying = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Erreur lors de l\'arrêt de la lecture', error);
    }
  };

  const deleteVoiceNote = async () => {
    try {
      if (voiceNote && voiceNote.uri) {
        const fileExists = await FileSystem.getInfoAsync(voiceNote.uri);
        if (fileExists.exists) {
          await FileSystem.deleteAsync(voiceNote.uri);
        }
      }
      setVoiceNote(null);
      handleVoiceRecording(null);
    } catch (error) {
      console.error('Erreur lors de la suppression', error);
      Alert.alert('Erreur', 'Impossible de supprimer la note vocale');
    }
  };

  const confirmDeleteVoiceNote = () => {
    Alert.alert(
      'Supprimer la note vocale',
      'Êtes-vous sûr de vouloir supprimer cette note vocale ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: deleteVoiceNote },
      ]
    );
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCreateTask = async () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un titre pour la tâche');
      return;
    }

    const finalProjectId = projectId || selectedProjectId;
    if (!finalProjectId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un projet');
      return;
    }

    try {
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        status: 'todo',
        createdBy: user.uid,
        attachments: attachments.map((attachment) => ({
          uri: attachment.uri,
          name: attachment.name || 'image.jpg',
          type: attachment.mimeType || 'image/jpeg',
        })),
        voiceNote: voiceNote ? {
          uri: voiceNote.uri,
          duration: voiceNote.duration,
          fileName: voiceNote.fileName,
          createdAt: voiceNote.createdAt,
        } : null,
        createdAt: new Date(),
      };

      if (finalProjectId) {
        taskData.projectId = finalProjectId;
      }

      await taskService.createTask(taskData);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', `Échec de la création de la tâche\n${error?.message || error}`);
    }
  };

  const renderVoiceNote = () => {
    if (!voiceNote) return null;

    return (
      <View style={styles.voiceNoteContainer}>
        <View style={styles.voiceNoteInfo}>
          <Ionicons name="musical-notes" size={24} color="#6366F1" />
          <View style={styles.voiceNoteDetails}>
            <Text style={styles.voiceNoteDuration}>
              Note vocale • {formatDuration(voiceNote.duration || 0)}
            </Text>
            <Text style={styles.voiceNoteDate}>
              {new Date(voiceNote.createdAt).toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
        <View style={styles.voiceNoteActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.playButton]}
            onPress={isPlaying ? stopPlaying : playVoiceNote}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={16}
              color="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={confirmDeleteVoiceNote}
            activeOpacity={0.8}
          >
            <Ionicons name="trash" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Créer une nouvelle tâche</Text>
            <Text style={styles.subtitle}>Organisez votre travail efficacement</Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <Text style={styles.labelIcon}>📝</Text> Titre de la tâche
              </Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Saisissez le titre de votre tâche"
                placeholderTextColor="#A0A0A0"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <Text style={styles.labelIcon}>📄</Text> Description
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Décrivez votre tâche en détail..."
                placeholderTextColor="#A0A0A0"
                multiline
                numberOfLines={4}
              />
            </View>

            {!projectId && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <Text style={styles.labelIcon}>📁</Text> Affecter à un projet
                </Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedProjectId}
                    onValueChange={setSelectedProjectId}
                    style={styles.picker}
                  >
                    <Picker.Item label="Sélectionner un projet" value="" />
                    {projects.map((proj) => (
                      <Picker.Item key={proj.id} label={proj.name} value={proj.id} />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <Text style={styles.labelIcon}>🎤</Text> Note vocale
              </Text>
              <VoiceRecorder
                onRecordingComplete={handleVoiceRecording}
                existingRecording={voiceNote}
              />
              {renderVoiceNote()}
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
                      <Text style={styles.attachmentIcon}>📎</Text>
                      <Text style={styles.attachmentName}>
                        {attachment.name || 'Image'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateTask}
            activeOpacity={0.9}
          >
            <Text style={styles.createButtonIcon}>✨</Text>
            <Text style={styles.createButtonText}>Créer la tâche</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  picker: {
    backgroundColor: 'transparent',
  },
  voiceNoteContainer: {
    backgroundColor: '#F8FAFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  voiceNoteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  voiceNoteDetails: {
    marginLeft: 12,
    flex: 1,
  },
  voiceNoteDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  voiceNoteDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  voiceNoteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    backgroundColor: '#10B981',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
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
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  attachmentButton: {
    flex: 0.48,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentButton: {
    backgroundColor: '#3B82F6',
  },
  imageButton: {
    backgroundColor: '#10B981',
  },
  attachmentButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  attachmentButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  attachmentsList: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
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
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  attachmentIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  attachmentName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  createButton: {
    backgroundColor: '#6366F1',
    padding: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },
});

export default CreateTaskScreen;