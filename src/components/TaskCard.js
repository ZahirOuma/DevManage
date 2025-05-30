import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const TaskCard = ({ task, onPress, onStatusPress }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [descriptionHeight, setDescriptionHeight] = useState(0);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const maxDescriptionLength = 100;
  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo':
        return '#FF9500';
      case 'doing':
        return '#007AFF';
      case 'done':
        return '#34C759';
      default:
        return '#FF9500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'doing':
        return 'Doing';
      case 'done':
        return 'Done';
      default:
        return 'To Do';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'No due date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleDescription = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFullDescription(!showFullDescription);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const playVoiceNote = async () => {
    try {
      if (!task.voiceNote || !task.voiceNote.uri) return;

      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: task.voiceNote.uri },
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
      Alert.alert('Erreur', 'Impossible de lire la note vocale');
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

  const renderDescription = () => {
    if (!task.description) return null;
    
    const description = task.description.trim();
    const isLongDescription = description.length > maxDescriptionLength;
    const displayText = showFullDescription 
      ? description 
      : description.substring(0, maxDescriptionLength) + '...';

    return (
      <Animated.View 
        style={[
          styles.descriptionContainer,
          { opacity: fadeAnim }
        ]}
      >
        <Text 
          style={styles.descriptionText}
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            setDescriptionHeight(height);
          }}
        >
          {displayText}
        </Text>
        {isLongDescription && (
          <TouchableOpacity 
            onPress={toggleDescription} 
            style={styles.readMoreButton}
          >
            <Text style={styles.readMoreText}>
              {showFullDescription ? 'Voir moins' : 'Voir plus'}
            </Text>
            <Ionicons 
              name={showFullDescription ? 'chevron-up' : 'chevron-down'} 
              size={16} 
              color="#007AFF" 
              style={styles.readMoreIcon}
            />
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  const renderVoiceNote = () => {
    if (!task.voiceNote) return null;

    return (
      <View style={styles.voiceNoteContainer}>
        <View style={styles.voiceNoteInfo}>
          <Ionicons name="musical-notes" size={20} color="#6366F1" />
          <Text style={styles.voiceNoteText}>
            Note vocale • {formatDuration(task.voiceNote.duration || 0)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.playButton}
          onPress={isPlaying ? stopPlaying : playVoiceNote}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={isPlaying ? "pause" : "play"} 
            size={16} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {task.title}
          </Text>
          <TouchableOpacity
            style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}
            onPress={() => onStatusPress(task)}
          >
            <Text style={styles.statusText}>{getStatusText(task.status)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderDescription()}
      {renderVoiceNote()}

      <View style={styles.footer}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.dateText}>{formatDate(task.dueDate)}</Text>
        </View>
        {task.assignedTo && (
          <View style={styles.assignedContainer}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.assignedText} numberOfLines={1}>
              {task.assignedTo.name}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  header: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionContainer: {
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  readMoreButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  readMoreText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  readMoreIcon: {
    marginLeft: 4,
  },
  voiceNoteContainer: {
    backgroundColor: '#F0F7FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E1EAFF',
  },
  voiceNoteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  voiceNoteText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#4A5568',
    fontWeight: '500',
  },
  playButton: {
    backgroundColor: '#10B981',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 6,
    borderRadius: 6,
  },
  dateText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#495057',
    fontWeight: '500',
  },
  assignedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
    backgroundColor: '#f8f9fa',
    padding: 6,
    borderRadius: 6,
  },
  assignedText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#495057',
    fontWeight: '500',
  },
});

export default TaskCard;