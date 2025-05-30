import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { memberService } from '../services/memberService';

const DashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalMembers: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const loadDashboardData = async () => {
    try {
      // Charger les projets
      const projects = await projectService.getUserProjects(user.uid);
      setRecentProjects(projects.slice(0, 3));
      setStats(prev => ({
        ...prev,
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'active').length,
      }));

      // Charger les tâches
      const tasks = await taskService.getUserTasks(user.uid);
      setRecentTasks(tasks.slice(0, 3));
      setStats(prev => ({
        ...prev,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
      }));

      // Charger les membres
      const members = await memberService.getUserMembers(user.uid);
      setStats(prev => ({
        ...prev,
        totalMembers: members.length,
      }));
    } catch (error) {
      Alert.alert('Error', `Failed to load dashboard data\n${error?.message || error}`);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Rafraîchir la liste quand on revient sur l'écran
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboardData();
    });

    return unsubscribe;
  }, [navigation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData();
  }, []);

  const renderStatCard = (title, value, color) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const renderProjectCard = (project) => (
    <TouchableOpacity
      key={project.id}
      style={styles.projectCard}
      onPress={() => navigation.navigate('ProjectDetails', { projectId: project.id })}
    >
      <Text style={styles.projectTitle}>{project.name}</Text>
      <Text style={styles.projectDescription} numberOfLines={2}>
        {project.description}
      </Text>
      <View style={styles.projectMeta}>
        <Text style={styles.projectStatus}>
          Status: {project.status || 'In Progress'}
        </Text>
        <Text style={styles.projectDueDate}>
          Due: {new Date(project.dueDate?.toDate()).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderTaskCard = (task) => (
    <TouchableOpacity
      key={task.id}
      style={styles.taskCard}
      onPress={() => navigation.navigate('EditTask', { taskId: task.id })}
    >
      <Text style={styles.taskTitle}>{task.title}</Text>
      <Text style={styles.taskDescription} numberOfLines={2}>
        {task.description}
      </Text>
      <View style={styles.taskMeta}>
        <Text style={styles.taskStatus}>Status: {task.status}</Text>
        <Text style={styles.taskDueDate}>
          Due: {new Date(task.dueDate?.toDate()).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
      </View>

      <View style={styles.statsContainer}>
        {renderStatCard('Total Projects', stats.totalProjects, '#007AFF')}
        {renderStatCard('Active Projects', stats.activeProjects, '#34C759')}
        {renderStatCard('Total Tasks', stats.totalTasks, '#FF9500')}
        {renderStatCard('Completed Tasks', stats.completedTasks, '#5856D6')}
        {renderStatCard('Total Members', stats.totalMembers, '#FF2D55')}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Projects</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Projects')}>
            <Text style={styles.seeAllButton}>See All</Text>
          </TouchableOpacity>
        </View>
        {recentProjects.map(renderProjectCard)}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Tasks</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
            <Text style={styles.seeAllButton}>See All</Text>
          </TouchableOpacity>
        </View>
        {recentTasks.map(renderTaskCard)}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statTitle: {
    color: '#666',
    fontSize: 12,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllButton: {
    color: '#007AFF',
    fontSize: 14,
  },
  projectCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  projectDescription: {
    color: '#666',
    marginBottom: 10,
  },
  projectMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectStatus: {
    color: '#007AFF',
  },
  projectDueDate: {
    color: '#666',
  },
  taskCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  taskDescription: {
    color: '#666',
    marginBottom: 10,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskStatus: {
    color: '#007AFF',
  },
  taskDueDate: {
    color: '#666',
  },
});

export default DashboardScreen; 