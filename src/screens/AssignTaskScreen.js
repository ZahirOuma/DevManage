import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { memberService } from '../services/memberService';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';

const AssignTaskScreen = ({ route, navigation }) => {
  const { taskId, projectId } = route.params;
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjectMembers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMembers(members);
    } else {
      const filtered = members.filter(member => {
        const fullName = `${member.prenom} ${member.nom}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase());
      });
      setFilteredMembers(filtered);
    }
  }, [searchQuery, members]);

  const loadProjectMembers = async () => {
    try {
      const projectMembers = await memberService.getProjectMembers(projectId);
      console.log('Project members:', projectMembers);
      
      setMembers(projectMembers);
      setFilteredMembers(projectMembers);
    } catch (error) {
      console.error('Error in loadProjectMembers:', error);
      Alert.alert('Error', `Failed to load project members\n${error?.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTask = async (member) => {
    try {
      await taskService.assignTaskToMember(taskId, member.id);
      Alert.alert('Success', 'Task assigned successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', `Failed to assign task\n${error?.message || error}`);
    }
  };

  const renderMemberItem = ({ item }) => (
    <TouchableOpacity
      style={styles.memberCard}
      onPress={() => handleAssignTask(item)}
    >
      <Text style={styles.memberName}>
        {item.prenom} {item.nom}
      </Text>
      <Text style={styles.memberEmail}>{item.email}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading members...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Assign Task to Member</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search members..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredMembers}
        renderItem={renderMemberItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No members found in this project</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  searchContainer: {
    padding: 10,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  list: {
    padding: 10,
  },
  memberCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  memberEmail: {
    color: '#666',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default AssignTaskScreen; 