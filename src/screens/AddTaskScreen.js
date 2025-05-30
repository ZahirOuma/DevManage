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
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';
import { Ionicons } from '@expo/vector-icons';

const AddTaskScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    dueDate: '',
    projectId: '',
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const userProjects = await projectService.getUserProjects(user.uid);
      setProjects(userProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleCreateTask = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    setLoading(true);
    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        projectId: formData.projectId,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
        createdBy: user.uid,
        createdAt: new Date(),
      };

      await taskService.createTask(taskData);
      Alert.alert('Success', 'Task created successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>➕ Add New Task</Text>
          <Text style={styles.subtitle}>Create a new task for your project</Text>
        </View>
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

          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreateTask}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.createButtonText}>Create Task</Text>
              </>
            )}
          </TouchableOpacity>
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
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
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
  createButton: {
    backgroundColor: '#6C5CE7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AddTaskScreen; 