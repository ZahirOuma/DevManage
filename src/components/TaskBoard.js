import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import { taskService } from '../services/taskService';
import { useNavigation } from '@react-navigation/native';

const TaskBoard = ({ tasks, onTaskUpdate }) => {
  const navigation = useNavigation();
  const [taskColumns, setTaskColumns] = useState({
    todo: [],
    doing: [],
    done: [],
  });

  useEffect(() => {
    // Organiser les tâches dans les colonnes appropriées
    const organizedTasks = {
      todo: tasks.filter(task => !task.status || task.status === 'todo'),
      doing: tasks.filter(task => task.status === 'doing'),
      done: tasks.filter(task => task.status === 'done'),
    };
    setTaskColumns(organizedTasks);
  }, [tasks]);

  const handleDragEnd = async ({ from, to, data }) => {
    try {
      const task = data[to];
      const newStatus = getStatusFromColumn(to);
      
      // Mettre à jour le statut de la tâche
      await taskService.updateTask(task.id, {
        ...task,
        status: newStatus,
      });

      // Mettre à jour l'état local
      const updatedColumns = { ...taskColumns };
      const fromColumn = getColumnFromStatus(from);
      const toColumn = getColumnFromStatus(to);

      // Retirer la tâche de la colonne source
      updatedColumns[fromColumn] = updatedColumns[fromColumn].filter(t => t.id !== task.id);
      // Ajouter la tâche à la colonne destination
      updatedColumns[toColumn] = [...updatedColumns[toColumn], { ...task, status: newStatus }];

      setTaskColumns(updatedColumns);
      
      // Notifier le composant parent
      if (onTaskUpdate) {
        onTaskUpdate(task.id, newStatus);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut de la tâche');
    }
  };

  const getStatusFromColumn = (columnIndex) => {
    switch (columnIndex) {
      case 0: return 'todo';
      case 1: return 'doing';
      case 2: return 'done';
      default: return 'todo';
    }
  };

  const getColumnFromStatus = (status) => {
    switch (status) {
      case 'todo': return 'todo';
      case 'doing': return 'doing';
      case 'done': return 'done';
      default: return 'todo';
    }
  };

  const handleTaskPress = (task) => {
    navigation.navigate('EditTask', { taskId: task.id });
  };

  const renderTask = ({ item, drag, isActive }) => {
    return (
      <TouchableOpacity
        onLongPress={drag}
        onPress={() => handleTaskPress(item)}
        disabled={isActive}
        style={[
          styles.taskCard,
          isActive && styles.taskCardActive,
          { backgroundColor: getStatusColor(item.status) }
        ]}
      >
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <Ionicons name="reorder-three" size={24} color="#666" />
        </View>
        <Text style={styles.taskDescription} numberOfLines={2}>
          {item.description}
        </Text>
        {item.dueDate && (
          <View style={styles.dueDateContainer}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.dueDate}>
              {new Date(item.dueDate.seconds * 1000).toLocaleDateString()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return '#FFE5E5';
      case 'doing': return '#E5F6FF';
      case 'done': return '#E5FFE5';
      default: return '#F5F5F5';
    }
  };

  const renderColumn = (title, data, status) => (
    <View style={styles.column}>
      <View style={styles.columnHeader}>
        <Text style={styles.columnTitle}>{title}</Text>
        <Text style={styles.taskCount}>{data.length}</Text>
      </View>
      <DraggableFlatList
        data={data}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        onDragEnd={handleDragEnd}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.columnContent}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {renderColumn('📝 To Do', taskColumns.todo, 'todo')}
      {renderColumn('⚡ In Progress', taskColumns.doing, 'doing')}
      {renderColumn('✅ Done', taskColumns.done, 'done')}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    padding: 10,
  },
  column: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    padding: 10,
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
  },
  taskCount: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  columnContent: {
    paddingBottom: 20,
  },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskCardActive: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1,
  },
  taskDescription: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 8,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dueDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
});

export default TaskBoard; 