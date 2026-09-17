import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SUPERVISOR_COLORS, SUPERVISOR_SPACING } from '../../screens/supervisor/supervisorTheme';
import { fetchOfficerOptions, assignOfficerToGrievance } from '../../api/api';

export default function AssignOfficerModal({ visible, ticket, supervisorId, onClose, onAssigned }) {
  const [officers, setOfficers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOfficerId, setSelectedOfficerId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadOfficers = useCallback(async () => {
    if (!ticket?.id) return;
    setIsLoading(true);
    setSelectedOfficerId(null);
    try {
      const data = await fetchOfficerOptions(ticket.id);
      setOfficers(Array.isArray(data) ? data : []);
    } catch (e) {
      setOfficers([]);
    } finally {
      setIsLoading(false);
    }
  }, [ticket?.id]);

  useEffect(() => {
    if (visible) loadOfficers();
  }, [visible, loadOfficers]);

  const handleConfirmAssign = async () => {
    if (!selectedOfficerId) return;
    setIsSubmitting(true);
    try {
      await assignOfficerToGrievance(ticket.id, selectedOfficerId, supervisorId);
      onAssigned?.();
    } catch (e) {
      Alert.alert('Assignment failed', 'Could not assign this officer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!ticket) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.ticketNumber}>{ticket.ticketNumber}</Text>
              <Text style={styles.title} numberOfLines={2}>{ticket.title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={SUPERVISOR_COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Field officers in this ward &amp; department</Text>

          {isLoading ? (
            <ActivityIndicator color={SUPERVISOR_COLORS.accent} style={{ marginVertical: 24 }} />
          ) : officers.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="alert-circle-outline" size={22} color={SUPERVISOR_COLORS.critical} />
              <Text style={styles.emptyText}>
                No field officer is seeded for this ward + department combo. This ticket needs
                routing outside the app, or a new officer account created for this ward.
              </Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              {officers.map((officer) => {
                const selected = officer.id === selectedOfficerId;
                return (
                  <TouchableOpacity
                    key={officer.id}
                    style={[styles.officerRow, selected && styles.officerRowSelected]}
                    onPress={() => setSelectedOfficerId(officer.id)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.officerName}>{officer.name}</Text>
                      <Text style={styles.officerMeta}>
                        {officer.activeTicketCount} active ticket{officer.activeTicketCount === 1 ? '' : 's'}
                      </Text>
                    </View>
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={selected ? SUPERVISOR_COLORS.accent : SUPERVISOR_COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <TouchableOpacity
            style={[styles.assignBtn, (!selectedOfficerId || isSubmitting) && styles.assignBtnDisabled]}
            onPress={handleConfirmAssign}
            disabled={!selectedOfficerId || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#07161b" />
            ) : (
              <Text style={styles.assignBtnText}>Assign Ticket</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0f2a33',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SUPERVISOR_SPACING.lg,
    borderWidth: 1,
    borderColor: SUPERVISOR_COLORS.glassBorder,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SUPERVISOR_SPACING.md },
  ticketNumber: { color: SUPERVISOR_COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  title: { color: SUPERVISOR_COLORS.textPrimary, fontSize: 18, fontWeight: '700', marginTop: 4 },
  closeBtn: { padding: 4 },
  sectionLabel: { color: SUPERVISOR_COLORS.textMuted, fontSize: 13, fontWeight: '600', marginBottom: SUPERVISOR_SPACING.sm },
  emptyBox: {
    backgroundColor: SUPERVISOR_COLORS.critical + '14',
    borderRadius: 14,
    padding: SUPERVISOR_SPACING.md,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  emptyText: { color: SUPERVISOR_COLORS.textMuted, fontSize: 13, flex: 1, lineHeight: 18 },
  officerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SUPERVISOR_COLORS.glassBgSoft,
    borderWidth: 1,
    borderColor: SUPERVISOR_COLORS.glassBorder,
    borderRadius: 14,
    padding: 14,
    marginBottom: SUPERVISOR_SPACING.sm,
  },
  officerRowSelected: { borderColor: SUPERVISOR_COLORS.accent },
  officerName: { color: SUPERVISOR_COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
  officerMeta: { color: SUPERVISOR_COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  assignBtn: {
    backgroundColor: SUPERVISOR_COLORS.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: SUPERVISOR_SPACING.md,
  },
  assignBtnDisabled: { opacity: 0.4 },
  assignBtnText: { color: '#07161b', fontWeight: '700', fontSize: 15 },
});
