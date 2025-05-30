import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { memberService } from '../services/memberService';
import { useFocusEffect } from '@react-navigation/native';

const MembersListScreen = ({ navigation, route }) => {
  const [members, setMembers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadMembers = async () => {
    try {
      setLoading(true);
      const userMembers = await memberService.getAllMembers();
      console.log('Loaded members:', userMembers);
      setMembers(userMembers);
    } catch (error) {
      console.error('Error loading members:', error);
      Alert.alert('Error', `Failed to load members\n${error?.message || error}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Utiliser useFocusEffect pour recharger les données à chaque fois que l'écran devient actif
  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused, reloading members...');
      loadMembers();
      return () => {
        console.log('Screen unfocused');
      };
    }, [])
  );

  // Vérifier si un rafraîchissement est nécessaire
  useFocusEffect(
    useCallback(() => {
      if (route.params?.refresh) {
        console.log('Refresh parameter detected, reloading members...');
        loadMembers();
        // Réinitialiser le paramètre
        navigation.setParams({ refresh: undefined });
      }
    }, [route.params?.refresh])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMembers();
  }, []);

  const handleCreateMember = () => {
    navigation.navigate('CreateMember');
  };

  const renderMemberItem = ({ item }) => {
    console.log('Rendering member:', item);
    return (
      <TouchableOpacity
        style={styles.memberCard}
        onPress={() => navigation.navigate('MemberDetails', { memberId: item.id })}
      >
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberEmail}>{item.email}</Text>
        {item.role && <Text style={styles.memberRole}>{item.role}</Text>}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Team Members</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateMember}
        >
          <Text style={styles.createButtonText}>Add Member</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={members}
        renderItem={renderMemberItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No members yet. Add one!</Text>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    padding: 10,
  },
  memberCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  memberRole: {
    fontSize: 14,
    color: '#007AFF',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default MembersListScreen; 