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
import { projectService } from '../services/projectService';

const AddMemberToProjectScreen = ({ route, navigation }) => {
  const { projectId } = route.params;
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState([]);

  useEffect(() => {
    loadMembers();
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

  const loadMembers = async () => {
    try {
      const allMembers = await memberService.getUserMembers();
      setMembers(allMembers);
      setFilteredMembers(allMembers);
    } catch (error) {
      Alert.alert('Error', `Failed to load members\n${error?.message || error}`);
    }
  };

  const handleAddMember = async (member) => {
    try {
      await projectService.addMemberToProject(projectId, member.id);
      Alert.alert('Success', 'Member added to project successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', `Failed to add member\n${error?.message || error}`);
    }
  };

  const renderMemberItem = ({ item }) => (
    <TouchableOpacity
      style={styles.memberCard}
      onPress={() => handleAddMember(item)}
    >
      <Text style={styles.memberName}>
        {item.prenom} {item.nom}
      </Text>
      <Text style={styles.memberEmail}>{item.email}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Member to Project</Text>
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
          <Text style={styles.emptyText}>No members found</Text>
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

export default AddMemberToProjectScreen; 