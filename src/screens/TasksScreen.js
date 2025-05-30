import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import KanbanBoard from '../components/KanbanBoard';

const { width } = Dimensions.get('window');

const TasksScreen = ({ route, navigation }) => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const { user } = useAuth();
  const projectId = route.params?.projectId;
  const fadeAnim = new Animated.Value(0);

  const filters = [
    { id: 'all', label: 'All', icon: 'apps-outline' },
    { id: 'todo', label: 'To Do', icon: 'time-outline' },
    { id: 'doing', label: 'Doing', icon: 'play-outline' },
    { id: 'done', label: 'Done', icon: 'checkmark-circle-outline' },
  ];

  const loadTasks = async () => {
    try {
      let loadedTasks = [];
      if (projectId) {
        loadedTasks = await taskService.getProjectTasks(projectId);
      } else {
        loadedTasks = await taskService.getUserTasks(user.uid);
      }
      console.log('Loaded tasks:', loadedTasks); // Debug log
      setTasks(loadedTasks);
      filterTasks(activeFilter, loadedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const filterTasks = (filter, tasksList = tasks) => {
    console.log('Filtering tasks:', tasksList); // Debug log
    let filtered = tasksList;
    if (filter !== 'all') {
      filtered = tasksList.filter(task => task.status?.toLowerCase() === filter);
    }
    console.log('Filtered tasks:', filtered); // Debug log
    setFilteredTasks(filtered);
  };

  useEffect(() => {
    loadTasks();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadTasks();
    });

    return unsubscribe;
  }, [navigation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTasks();
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'done':
        return '#34C759';
      case 'doing':
        return '#FF9500';
      case 'todo':
        return '#007AFF';
      default:
        return '#007AFF';
    }
  };

  const renderFilterItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        activeFilter === item.id && styles.activeFilterButton,
      ]}
      onPress={() => {
        setActiveFilter(item.id);
        filterTasks(item.id);
      }}
    >
      <Ionicons
        name={item.icon}
        size={20}
        color={activeFilter === item.id ? '#fff' : '#666'}
      />
      <Text
        style={[
          styles.filterText,
          activeFilter === item.id && styles.activeFilterText,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderTaskItem = ({ item }) => {
    console.log('Rendering task:', item); // Debug log
    return (
      <View style={styles.taskCard}>
        <TouchableOpacity
          style={styles.taskContent}
          onPress={() => navigation.navigate('EditTask', { taskId: item.id })}
        >
          <View style={styles.taskHeader}>
            <View style={[styles.taskIcon, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <Ionicons name="checkbox-outline" size={24} color={getStatusColor(item.status)} />
            </View>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{item.title}</Text>
              <View style={styles.taskMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={14} color="#666" />
                  <Text style={styles.metaText}>
                    {item.dueDate ? new Date(item.dueDate.seconds * 1000).toLocaleDateString() : 'No date'}
                  </Text>
                </View>
                {item.assignedTo && (
                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={14} color="#666" />
                    <Text style={styles.metaText}>{item.assignedTo.name}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <Text style={styles.taskDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.taskFooter}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status || 'To Do'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('EditTask', { taskId: item.id })}
            >
              <Ionicons name="create-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>
            {projectId ? 'Project Tasks' : 'My Tasks'}
          </Text>
          <Text style={styles.subtitle}>
            {projectId ? 'Manage project tasks' : 'View and manage your tasks'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateTask', { projectId })}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.filtersContainer}>
        <FlatList
          data={filters}
          renderItem={renderFilterItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      <View style={styles.boardContainer}>
        {projectId ? (
          <KanbanBoard
            projectId={projectId}
            onTaskUpdate={loadTasks}
          />
        ) : (
          <FlatList
            data={filteredTasks}
            renderItem={renderTaskItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="checkbox-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No tasks yet</Text>
                <Text style={styles.emptySubtext}>Create your first task to get started</Text>
              </View>
            }
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  createButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filtersList: {
    paddingHorizontal: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  boardContainer: {
    flex: 1,
    padding: 10,
  },
  list: {
    padding: 16,
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  taskContent: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 14,
    color: '#333333',
    marginLeft: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 12,
    lineHeight: 20,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});

export default TasksScreen;