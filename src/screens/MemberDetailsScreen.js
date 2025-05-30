import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const MemberDetailsScreen = ({ route, navigation }) => {
  const { memberId } = route.params;
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemberDetails();
  }, [memberId]);

  const fetchMemberDetails = async () => {
    try {
      const memberRef = doc(db, 'members', memberId);
      const memberSnap = await getDoc(memberRef);
      
      if (memberSnap.exists()) {
        setMember({ id: memberSnap.id, ...memberSnap.data() });
      } else {
        Alert.alert('Erreur', 'Membre non trouvé');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les détails du membre');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer ce membre ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'members', memberId));
              Alert.alert('Succès', 'Membre supprimé avec succès');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le membre');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!member) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Détails du Membre</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.editButton]}
            onPress={() => navigation.navigate('EditMember', { memberId })}
          >
            <Text style={styles.buttonText}>Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Text style={styles.buttonText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Text style={styles.label}>Nom</Text>
          <Text style={styles.value}>{member.nom}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.label}>Prénom</Text>
          <Text style={styles.value}>{member.prenom}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{member.email}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.label}>Téléphone</Text>
          <Text style={styles.value}>{member.telephone || 'Non renseigné'}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.label}>Rôle</Text>
          <Text style={styles.value}>{member.role}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.label}>Date d'inscription</Text>
          <Text style={styles.value}>
            {new Date(member.dateInscription).toLocaleDateString()}
          </Text>
        </View>
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
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  detailsContainer: {
    padding: 20,
  },
  detailItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default MemberDetailsScreen; 