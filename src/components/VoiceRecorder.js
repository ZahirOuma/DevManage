import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';

const VoiceRecorder = ({ onRecordingComplete, existingRecording = null }) => {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceNote, setVoiceNote] = useState(existingRecording);
  const [pulseAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  useEffect(() => {
    let interval = null;
    if (isRecording) {
      // Animation de pulsation pendant l'enregistrement
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      pulseAnimation.setValue(1);
      if (interval) {
        clearInterval(interval);
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      // Demander les permissions
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour enregistrer de l\'audio');
        return;
      }

      // Configuration de l'enregistrement
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Supprimer l'ancien enregistrement s'il existe
      if (voiceNote) {
        await deleteVoiceNote();
      }
      
    } catch (err) {
      console.error('Erreur lors du démarrage de l\'enregistrement', err);
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      
      // Créer un nom de fichier unique
      const fileName = `voice_note_${Date.now()}.m4a`;
      const newUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // Déplacer le fichier vers un emplacement permanent
      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });

      const voiceNoteData = {
        uri: newUri,
        duration: recordingDuration,
        fileName: fileName,
        createdAt: new Date().toISOString(),
      };

      setVoiceNote(voiceNoteData);
      setRecording(null);
      
      // Notifier le composant parent
      onRecordingComplete(voiceNoteData);
      
    } catch (error) {
      console.error('Erreur lors de l\'arrêt de l\'enregistrement', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder l\'enregistrement');
    }
  };

  const playVoiceNote = async () => {
    try {
      if (!voiceNote) return;

      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: voiceNote.uri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });

    } catch (error) {
      console.error('Erreur lors de la lecture', error);
      Alert.alert('Erreur', 'Impossible de lire l\'enregistrement');
    }
  };

  const stopPlaying = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Erreur lors de l\'arrêt de la lecture', error);
    }
  };

  const deleteVoiceNote = async () => {
    try {
      if (voiceNote && voiceNote.uri) {
        const fileExists = await FileSystem.getInfoAsync(voiceNote.uri);
        if (fileExists.exists) {
          await FileSystem.deleteAsync(voiceNote.uri);
        }
      }
      setVoiceNote(null);
      onRecordingComplete(null);
    } catch (error) {
      console.error('Erreur lors de la suppression', error);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const confirmDelete = () => {
    Alert.alert(
      'Supprimer la note vocale',
      'Êtes-vous sûr de vouloir supprimer cette note vocale ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: deleteVoiceNote },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        <Text style={styles.icon}>🎤</Text> Note vocale
      </Text>

      {!voiceNote && !isRecording && (
        <TouchableOpacity
          style={styles.recordButton}
          onPress={startRecording}
          activeOpacity={0.8}
        >
          <Ionicons name="mic" size={24} color="#fff" />
          <Text style={styles.recordButtonText}>Appuyer pour enregistrer</Text>
        </TouchableOpacity>
      )}

      {isRecording && (
        <View style={styles.recordingContainer}>
          <Animated.View
            style={[
              styles.recordingIndicator,
              { transform: [{ scale: pulseAnimation }] }
            ]}
          >
            <Ionicons name="mic" size={32} color="#fff" />
          </Animated.View>
          <Text style={styles.recordingText}>
            Enregistrement... {formatDuration(recordingDuration)}
          </Text>
          <TouchableOpacity
            style={styles.stopButton}
            onPress={stopRecording}
            activeOpacity={0.8}
          >
            <Ionicons name="stop" size={20} color="#fff" />
            <Text style={styles.stopButtonText}>Arrêter</Text>
          </TouchableOpacity>
        </View>
      )}

      {voiceNote && (
        <View style={styles.voiceNoteContainer}>
          <View style={styles.voiceNoteInfo}>
            <Ionicons name="musical-notes" size={24} color="#6366F1" />
            <View style={styles.voiceNoteDetails}>
              <Text style={styles.voiceNoteDuration}>
                Note vocale • {formatDuration(voiceNote.duration)}
              </Text>
              <Text style={styles.voiceNoteDate}>
                {new Date(voiceNote.createdAt).toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          </View>
          
          <View style={styles.voiceNoteActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.playButton]}
              onPress={isPlaying ? stopPlaying : playVoiceNote}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={16} 
                color="#fff" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={confirmDelete}
              activeOpacity={0.8}
            >
              <Ionicons name="trash" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  recordButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  recordButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  recordingContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FCA5A5',
  },
  recordingIndicator: {
    backgroundColor: '#EF4444',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 16,
  },
  stopButton: {
    backgroundColor: '#374151',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  stopButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  voiceNoteContainer: {
    backgroundColor: '#F8FAFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voiceNoteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  voiceNoteDetails: {
    marginLeft: 12,
    flex: 1,
  },
  voiceNoteDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  voiceNoteDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  voiceNoteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    backgroundColor: '#10B981',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
});

export default VoiceRecorder;