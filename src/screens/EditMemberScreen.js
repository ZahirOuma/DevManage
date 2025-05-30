import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { memberService } from '../services/memberService';

const EditMemberScreen = ({ route, navigation }) => {
  const { memberId } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    phone: '',
  });

  useEffect(() => {
    loadMember();
  }, [memberId]);

  const loadMember = async () => {
    try {
      const member = await memberService.getMemberById(memberId);
      if (member) {
        setFormData({
          name: member.name || '',
          email: member.email || '',
          role: member.role || '',
          phone: member.phone || '',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load member details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      await memberService.updateMember(memberId, formData);
      Alert.alert('Success', 'Member updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update member');
    } finally {
      setSaving(false);
    }
  };

  const getRoleIcon = (role) => {
    const roleMap = {
      'admin': '👑',
      'manager': '💼',
      'developer': '💻',
      'designer': '🎨',
      'tester': '🧪',
      'analyst': '📊',
      'lead': '⭐',
      'senior': '🏆',
      'junior': '🌱',
      'intern': '📚',
    };
    
    const lowerRole = role.toLowerCase();
    return roleMap[lowerRole] || '👤';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading member details...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>👤 Edit Member</Text>
          <Text style={styles.subtitle}>Update member information</Text>
        </View>
        <View style={styles.memberAvatar}>
          <Text style={styles.avatarText}>
            {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>👤 Full Name *</Text>
              <TextInput
                style={[styles.input, !formData.name.trim() && styles.inputError]}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter member's full name"
                placeholderTextColor="#BDC3C7"
              />
              {!formData.name.trim() && (
                <Text style={styles.errorText}>Name is required</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>📧 Email Address *</Text>
              <TextInput
                style={[styles.input, !formData.email.trim() && styles.inputError]}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Enter email address"
                placeholderTextColor="#BDC3C7"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {!formData.email.trim() && (
                <Text style={styles.errorText}>Email is required</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {getRoleIcon(formData.role)} Role
              </Text>
              <TextInput
                style={styles.input}
                value={formData.role}
                onChangeText={(text) => setFormData({ ...formData, role: text })}
                placeholder="e.g., Developer, Designer, Manager"
                placeholderTextColor="#BDC3C7"
              />
              {formData.role && (
                <View style={styles.rolePreview}>
                  <Text style={styles.rolePreviewText}>
                    {getRoleIcon(formData.role)} {formData.role}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>📞 Phone Number</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Enter phone number"
                placeholderTextColor="#BDC3C7"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>ℹ️ Quick Tips</Text>
            <Text style={styles.infoText}>
              • Name and email are required fields{'\n'}
              • Use a professional email address{'\n'}
              • Role helps identify team member responsibilities{'\n'}
              • Phone number is optional but recommended
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              saving && styles.submitButtonDisabled,
              (!formData.name.trim() || !formData.email.trim()) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={saving || !formData.name.trim() || !formData.email.trim()}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.buttonIcon}>💾</Text>
                <Text style={styles.submitButtonText}>Update Member</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
    padding: 20,
  },
  loadingCard: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#74788D',
    fontWeight: '500',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#8B5CF6',
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
  memberAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
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
    shadowColor: '#8B5CF6',
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
  input: {
    backgroundColor: '#F7F8FC',
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E6E8F0',
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '500',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    marginLeft: 4,
  },
  rolePreview: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#8B5CF6',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  rolePreviewText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#E0E7FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5B21B6',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#5B21B6',
    lineHeight: 20,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#BDC3C7',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default EditMemberScreen;