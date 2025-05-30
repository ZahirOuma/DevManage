import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { taskService } from '../services/taskService';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 3;

const KanbanBoard = ({ projectId, tasks: propTasks, onTaskUpdate }) => {
  const [tasks, setTasks] = useState({
    todo: [],
    doing: [],
    done: [],
  });

  useEffect(() => {
    if (propTasks) {
      // Utiliser les tâches passées en props (My Tasks)
      const categorizedTasks = {
        todo: propTasks.filter(task => task.status === 'todo'),
        doing: propTasks.filter(task => task.status === 'doing'),
        done: propTasks.filter(task => task.status === 'done'),
      };
      setTasks(categorizedTasks);
    } else {
      // Charger les tâches du projet
      loadTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, propTasks]);

  const loadTasks = async () => {
    try {
      const projectTasks = await taskService.getProjectTasks(projectId);
      if (!projectTasks || projectTasks.length === 0) {
        alert('Aucune tâche trouvée. projectTasks: ' + JSON.stringify(projectTasks, null, 2));
      }
      const categorizedTasks = {
        todo: projectTasks.filter(task => task.status === 'todo'),
        doing: projectTasks.filter(task => task.status === 'doing'),
        done: projectTasks.filter(task => task.status === 'done'),
      };
      setTasks(categorizedTasks);
    } catch (error) {
      alert('Erreur lors du chargement des tâches : ' + (error?.message || error));
    }
  };

  const handleDragEnd = async ({ data, from, to }) => {
    const newStatus = to.split('-')[0];
    const taskId = data.id;
    
    try {
      await taskService.updateTask(taskId, { status: newStatus });
      onTaskUpdate && onTaskUpdate();
      loadTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const renderTask = ({ item, drag, isActive }) => {
    return (
      <TouchableOpacity
        onLongPress={drag}
        disabled={isActive}
        style={[
          styles.taskCard,
          isActive && styles.taskCardActive,
        ]}
      >
        <Text style={styles.taskTitle}>{item.title}</Text>
        <Text style={styles.taskDescription} numberOfLines={2}>
          {item.description}
        </Text>
        {item.assignedTo && (
          <Text style={styles.taskAssignee}>Assigned to: {item.assignedTo}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderColumn = (status, title) => {
    const data = tasks[status].map(task => ({
      ...task,
      key: task.id,
    }));

    return (
      <View style={styles.column}>
        <Text style={styles.columnTitle}>{title}</Text>
        <DraggableFlatList
          data={data}
          renderItem={renderTask}
          keyExtractor={item => item.id}
          onDragEnd={handleDragEnd}
          containerStyle={styles.columnContent}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderColumn('todo', 'To Do')}
      {renderColumn('doing', 'Doing')}
      {renderColumn('done', 'Done')}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
  },
  column: {
    width: COLUMN_WIDTH,
    height: '100%',
    padding: 10,
  },
  columnTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  columnContent: {
    flex: 1,
  },
  taskCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskCardActive: {
    backgroundColor: '#e3f2fd',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  taskAssignee: {
    fontSize: 12,
    color: '#999',
  },
});

export default KanbanBoard; 