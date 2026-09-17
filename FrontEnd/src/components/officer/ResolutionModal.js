import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { updateGrievanceStatus, getMediaUrl } from '../../api/api';
import { OFFICER_COLORS, OFFICER_SPACING } from '../../screens/officer/officerTheme';

export default function ResolutionModal({ visible, selectedTask, officerId, readOnly = false, onClose, onResolved }) {
  const [resolutionComment, setResolutionComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!selectedTask) return null;

  const handleSubmitResolution = async () => {
    if (!resolutionComment.trim()) {
      alert('Please enter resolution notes before marking as resolved.');
      return;
    }
    if (!officerId) {
      alert('Could not identify the logged-in officer. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateGrievanceStatus(selectedTask.id, officerId, 'RESOLVED', resolutionComment.trim());
      setResolutionComment('');
      alert(`Ticket ${selectedTask.ticketNumber} marked as resolved successfully.`);
      if (onResolved) onResolved();
      else onClose();
    } catch (e) {
      alert('Failed to update the ticket. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <LinearGradient colors={OFFICER_COLORS.bgGradient} style={styles.gradient}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
          {/* Modal Window Navigation Navbar Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Task Action Panel</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={OFFICER_COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Information Card Banner Layout */}
            <View style={styles.infoCard}>
              <Text style={styles.ticketLabel}>{selectedTask.ticketNumber}</Text>
              <Text style={styles.taskTitle}>{selectedTask.title}</Text>

              <View style={styles.metaRow}>
                <Ionicons name="location" size={14} color={OFFICER_COLORS.textSecondary} />
                <Text style={styles.metaText}>{selectedTask.address}</Text>
              </View>
            </View>

            {/* Description Block */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Citizen Grievance Description</Text>
              <Text style={styles.descriptionText}>{selectedTask.description}</Text>
            </View>

            {/* Evidence Block: the photo/video the citizen submitted with the complaint */}
            {(selectedTask.image_url || selectedTask.video_url) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Citizen Evidence</Text>
                {selectedTask.image_url && (
                  <Image
                    source={{ uri: getMediaUrl(selectedTask.image_url) }}
                    style={styles.evidenceImage}
                    resizeMode="cover"
                  />
                )}
                {selectedTask.video_url && (
                  <TouchableOpacity
                    style={styles.evidenceVideoButton}
                    onPress={() => Linking.openURL(getMediaUrl(selectedTask.video_url))}
                  >
                    <Ionicons name="videocam" size={18} color={OFFICER_COLORS.accent} />
                    <Text style={styles.evidenceVideoText}>View submitted video evidence</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {readOnly ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Resolution Action Logs</Text>
                <Text style={styles.descriptionText}>
                  {selectedTask.closure_notes || 'No closure notes were recorded for this ticket.'}
                </Text>
              </View>
            ) : (
              <>
                {/* Form Action Input Field Content */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Resolution Action Logs</Text>
                  <TextInput
                    style={styles.textInput}
                    multiline
                    numberOfLines={4}
                    placeholder="Provide a detailed log describing technical actions taken to eliminate this infrastructural anomaly..."
                    placeholderTextColor={OFFICER_COLORS.textSecondary}
                    value={resolutionComment}
                    onChangeText={setResolutionComment}
                  />
                </View>

                {/* Action Call Controls Button Set Footer */}
                <TouchableOpacity
                  style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
                  onPress={handleSubmitResolution}
                  disabled={isSubmitting}
                >
                  <Ionicons name="checkmark-done-circle" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? 'Updating Registry...' : 'Mark As Resolved'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: OFFICER_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: OFFICER_COLORS.glassBorder,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: OFFICER_COLORS.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: OFFICER_SPACING.md,
  },
  infoCard: {
    backgroundColor: OFFICER_COLORS.glassBg,
    padding: OFFICER_SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: OFFICER_COLORS.glassBorder,
    marginBottom: OFFICER_SPACING.md,
  },
  ticketLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: OFFICER_COLORS.accent,
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: OFFICER_COLORS.textPrimary,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: OFFICER_COLORS.textSecondary,
  },
  section: {
    marginBottom: OFFICER_SPACING.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: OFFICER_COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: OFFICER_SPACING.sm,
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 14,
    color: OFFICER_COLORS.textPrimary,
    lineHeight: 20,
    backgroundColor: OFFICER_COLORS.glassBgSoft,
    borderWidth: 1,
    borderColor: OFFICER_COLORS.glassBorder,
    padding: 12,
    borderRadius: 12,
  },
  evidenceImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: OFFICER_COLORS.glassBgSoft,
  },
  evidenceVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: OFFICER_COLORS.glassBorder,
    backgroundColor: OFFICER_COLORS.glassBgSoft,
  },
  evidenceVideoText: {
    fontSize: 14,
    fontWeight: '600',
    color: OFFICER_COLORS.accent,
  },
  textInput: {
    backgroundColor: OFFICER_COLORS.inputBg,
    borderWidth: 1,
    borderColor: OFFICER_COLORS.glassBorder,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: OFFICER_COLORS.textPrimary,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: OFFICER_COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: OFFICER_SPACING.sm,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
