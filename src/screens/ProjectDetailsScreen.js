import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { memberService } from '../services/memberService';
import { Ionicons } from '@expo/vector-icons';

const ProjectDetailsScreen = ({ route, navigation }) => {
  const { projectId } = route.params;
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const projectData = await projectService.getProjectById(projectId);
      if (projectData) {
      setProject(projectData);
      const projectTasks = await taskService.getProjectTasks(projectId);
      setTasks(projectTasks);
        const projectMembers = await memberService.getProjectMembers(projectId);
        setMembers(projectMembers);
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  // Ajouter un focus listener pour rafraîchir les données
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });

    return unsubscribe;
  }, [navigation]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
      fetchData();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const renderTaskCard = (task) => (
    <TouchableOpacity
      key={task.id}
      style={[styles.taskCard, { borderLeftWidth: 4, borderLeftColor: getStatusColor(task.status) }]}
      onPress={() => navigation.navigate('EditTask', { taskId: task.id })}
      activeOpacity={0.7}
    >
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle} numberOfLines={2}>{task.title}</Text>
        <View style={styles.taskActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('AssignTask', { taskId: task.id })}
            style={[styles.actionButton, { backgroundColor: '#F8F9FA' }]}
            activeOpacity={0.6}
          >
            <Ionicons name="person-add-outline" size={16} color="#6C7B7F" />
          </TouchableOpacity>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(task.status) }]}>
            <View style={styles.statusDot} />
          </View>
        </View>
      </View>
      
      {task.description && (
        <Text style={styles.taskDescription} numberOfLines={3}>
          {task.description}
        </Text>
      )}
      
      <View style={styles.taskFooter}>
        <View style={styles.taskMeta}>
          <View style={styles.dueDateContainer}>
            <Ionicons name="calendar-outline" size={12} color="#8E8E93" />
            <Text style={styles.dueDate}>
              {task.dueDate ? new Date(task.dueDate.seconds * 1000).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short'
              }) : 'Aucune date'}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
          <Text style={styles.statusText}>
            {task.status}
          </Text>
        </View>
      </View>
      
      {/* Effet de lueur subtil */}
      <View style={[styles.glowEffect, { backgroundColor: getStatusColor(task.status) + '08' }]} />
    </TouchableOpacity>
  );

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'done':
        return '#32D74B';
      case 'doing':
        return '#FF9F0A';
      case 'to do':
        return '#007AFF';
      default:
        return '#007AFF';
    }
  };

  const getColumnConfig = (type) => {
    switch (type) {
      case 'todo':
        return {
          icon: 'list-outline',
          title: 'À faire',
          color: '#007AFF',
          bgGradient: ['#F0F8FF', '#E8F4FF'],
          shadowColor: '#007AFF'
        };
      case 'doing':
        return {
          icon: 'hourglass-outline',
          title: 'En cours',
          color: '#FF9F0A',
          bgGradient: ['#FFF8E1', '#FFF4D6'],
          shadowColor: '#FF9F0A'
        };
      case 'done':
        return {
          icon: 'checkmark-circle',
          title: 'Terminé',
          color: '#32D74B',
          bgGradient: ['#F0FFF4', '#E8F5E8'],
          shadowColor: '#32D74B'
        };
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.centered}>
        <Ionicons name="folder-open-outline" size={48} color="#C7C7CC" />
        <Text style={styles.errorText}>Projet introuvable</Text>
      </View>
    );
  }

  const todoTasks = tasks.filter(task => task.status?.toLowerCase() === 'to do');
  const inProgressTasks = tasks.filter(task => task.status?.toLowerCase() === 'doing');
  const completedTasks = tasks.filter(task => task.status?.toLowerCase() === 'done');

  const renderColumn = (columnType, taskList) => {
    const config = getColumnConfig(columnType);
    
    return (
      <View style={[styles.column, { 
        backgroundColor: config.bgGradient[0],
        shadowColor: config.shadowColor + '40'
      }]}>
        {/* Header avec effet glassmorphism */}
        <View style={[styles.columnHeader, { 
          borderBottomColor: config.color + '20',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)'
        }]}>
          <View style={styles.columnTitleContainer}>
            <View style={[styles.columnIconContainer, { 
              backgroundColor: config.color + '15',
              borderWidth: 2,
              borderColor: config.color + '30'
            }]}>
              <Ionicons name={config.icon} size={20} color={config.color} />
            </View>
            <View>
              <Text style={[styles.columnTitle, { color: config.color }]}>{config.title}</Text>
              <Text style={styles.columnSubtitle}>
                {taskList.length} tâche{taskList.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <View style={[styles.taskCountBadge, { 
            backgroundColor: config.color,
            shadowColor: config.color,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8
          }]}>
            <Text style={styles.taskCount}>{taskList.length}</Text>
          </View>
        </View>
        
        {/* Corps de la colonne avec scrolling amélioré */}
        <ScrollView 
          style={styles.tasksScrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.tasksScrollContent}
        >
          {taskList.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: config.color + '15' }]}>
                <Ionicons name="cube-outline" size={32} color={config.color + '60'} />
              </View>
              <Text style={[styles.emptyText, { color: config.color + '80' }]}>
                Aucune tâche
              </Text>
            </View>
          ) : (
            taskList.map(renderTaskCard)
          )}
          
          {columnType === 'todo' && (
            <TouchableOpacity
              style={[styles.addTaskButton, { 
                borderColor: config.color + '40',
                backgroundColor: config.color + '08',
                shadowColor: config.color,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12
              }]}
              onPress={() => navigation.navigate('SelectTask', { 
                projectId: projectId,
                existingTasks: tasks
              })}
              activeOpacity={0.7}
            >
              <View style={[styles.addTaskIconContainer, { 
                backgroundColor: config.color,
                shadowColor: config.color,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 6
              }]}>
                <Ionicons name="add" size={18} color="#fff" />
              </View>
              <Text style={[styles.addTaskText, { color: config.color }]}>Nouvelle tâche</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header amélioré */}
      <View style={styles.header}>
        <View style={styles.headerGradient}>
          <View style={styles.headerContent}>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.addButton}
                onPress={() => navigation.navigate('SelectMember', { projectId: projectId })}
                activeOpacity={0.8}
          >
                <Ionicons name="person-add" size={18} color="#fff" />
                <Text style={styles.addButtonText}>Ajouter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProject', { projectId: projectId })}
                activeOpacity={0.8}
              >
                <Ionicons name="create" size={18} color="#fff" />
                <Text style={styles.editButtonText}>Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.attachButton}
                onPress={() => navigation.navigate('SelectTask', { 
                  projectId: projectId,
                  existingTasks: tasks
                })}
                activeOpacity={0.8}
              >
                <Ionicons name="attach" size={18} color="#fff" />
                <Text style={styles.attachButtonText}>Attacher tâche</Text>
          </TouchableOpacity>
        </View>
          </View>
        </View>
        
        <View style={styles.headerInfo}>
          {project.description && project.description.trim() !== '' && (
            <Text style={styles.description}>{project.description}</Text>
          )}
          
          <View style={styles.metaInfo}>
        <View style={styles.metaRow}>
              <View style={styles.metaCard}>
                <View style={[styles.metaIconContainer, { backgroundColor: '#E8F5E8' }]}>
                  <Ionicons name="calendar-outline" size={18} color="#32D74B" />
                </View>
                <View style={styles.metaTextContainer}>
                  <Text style={styles.metaLabel}>Date de début</Text>
                  <Text style={styles.metaValue}>
                    {project.startDate ? new Date(project.startDate.seconds * 1000).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }) : 'Non définie'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.metaCard}>
                <View style={[styles.metaIconContainer, { backgroundColor: '#FFE8E8' }]}>
                  <Ionicons name="calendar" size={18} color="#FF3B30" />
                </View>
                <View style={styles.metaTextContainer}>
                  <Text style={styles.metaLabel}>Date de fin</Text>
                  <Text style={styles.metaValue}>
                    {project.endDate ? new Date(project.endDate.seconds * 1000).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }) : 'Non définie'}
                  </Text>
                </View>
              </View>
        </View>
            
        <View style={styles.metaRow}>
              <View style={styles.metaCard}>
                <View style={[styles.metaIconContainer, { backgroundColor: '#E8F4FF' }]}>
                  <Ionicons name="flag-outline" size={18} color="#007AFF" />
                </View>
                <View style={styles.metaTextContainer}>
                  <Text style={styles.metaLabel}>Statut du projet</Text>
                  <Text style={[styles.metaValue, { textTransform: 'capitalize' }]}>{project.status}</Text>
                </View>
              </View>
              
              <View style={styles.metaCard}>
                <View style={[styles.metaIconContainer, { backgroundColor: '#FFF4E6' }]}>
                  <Ionicons name="people" size={18} color="#FF9F0A" />
                </View>
                <View style={styles.metaTextContainer}>
                  <Text style={styles.metaLabel}>Membres</Text>
                  <Text style={styles.metaValue}>{members.length}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Section des tâches avec style Kanban premium */}
      <View style={styles.tasksSection}>
        <View style={styles.tasksSectionHeader}>
          <View style={styles.titleContainer}>
            <View style={styles.titleIcon}>
              <Ionicons name="grid-outline" size={24} color="#007AFF" />
            </View>
            <View>
              <Text style={styles.tasksSectionTitle}>Tableau des tâches</Text>
              <Text style={styles.tasksSectionSubtitle}>
                {tasks.length} tâche{tasks.length !== 1 ? 's' : ''} au total
              </Text>
            </View>
          </View>
          
          {/* Indicateurs de progression */}
          <View style={styles.progressIndicators}>
            <View style={styles.progressItem}>
              <View style={[styles.progressDot, { backgroundColor: '#007AFF' }]} />
              <Text style={styles.progressText}>{todoTasks.length}</Text>
            </View>
            <View style={styles.progressItem}>
              <View style={[styles.progressDot, { backgroundColor: '#FF9F0A' }]} />
              <Text style={styles.progressText}>{inProgressTasks.length}</Text>
            </View>
            <View style={styles.progressItem}>
              <View style={[styles.progressDot, { backgroundColor: '#32D74B' }]} />
              <Text style={styles.progressText}>{completedTasks.length}</Text>
            </View>
          </View>
        </View>
        
        <ScrollView 
          horizontal 
          style={styles.tasksContainer}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tasksContentContainer}
          pagingEnabled={false}
          decelerationRate="fast"
        >
          {renderColumn('todo', todoTasks)}
          {renderColumn('doing', inProgressTasks)}
          {renderColumn('done', completedTasks)}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#fff',
    marginBottom: 20,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  headerGradient: {
    backgroundColor: '#007AFF',
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    marginRight: 16,
    lineHeight: 34,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  attachButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  attachButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  headerInfo: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#3C3C43',
    marginBottom: 20,
    lineHeight: 24,
  },
  metaInfo: {
    backgroundColor: 'transparent',
    marginTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  metaCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  metaIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metaTextContainer: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  tasksSection: {
    flex: 1,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E8F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tasksSectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  tasksSectionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  progressIndicators: {
    flexDirection: 'row',
    gap: 12,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C6C70',
  },
  tasksContainer: {
    flex: 1,
  },
  tasksContentContainer: {
    paddingRight: 16,
    paddingBottom: 20,
  },
  column: {
    width: 320,
    marginRight: 16,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    maxHeight: 700,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    overflow: 'hidden',
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  columnTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  columnIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  columnTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  columnSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '600',
  },
  taskCountBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    elevation: 4,
  },
  taskCount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  tasksScrollView: {
    flex: 1,
  },
  tasksScrollContent: {
    padding: 20,
    paddingTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
    flex: 1,
    marginRight: 12,
    lineHeight: 24,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  taskDescription: {
    fontSize: 15,
    color: '#6C6C70',
    marginBottom: 16,
    lineHeight: 22,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskMeta: {
    flex: 1,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  dueDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 6,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 20,
    marginTop: 16,
    elevation: 2,
  },
  addTaskIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 3,
  },
  addTaskText: {
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
});

export default ProjectDetailsScreen; 