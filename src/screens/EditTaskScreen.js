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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';
import { Ionicons } from '@expo/vector-icons';
import VoiceRecorder from '../components/VoiceRecorder'; // Import du composant

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
  const [voiceNote, setVoiceNote] = useState(null); // État pour la note vocale
  const { user } = useAuth();

  useEffect(() => {
    loadTask();
    loadProjects();
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
        // Charger la note vocale existante
        setVoiceNote(task.voiceNote || null);
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
        voiceNote: voiceNote, // Ajouter la note vocale
        updatedBy: user.uid,
        updatedAt: new Date(),
      };

      await taskService.updateTask(taskId, taskData);
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
});

export default EditTaskScreen;