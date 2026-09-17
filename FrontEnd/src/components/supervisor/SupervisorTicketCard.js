import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SUPERVISOR_COLORS } from '../../screens/supervisor/supervisorTheme';

export default function SupervisorTicketCard({ item, onPress }) {
  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL': return SUPERVISOR_COLORS.critical;
      case 'HIGH': return SUPERVISOR_COLORS.high;
      case 'MEDIUM': return SUPERVISOR_COLORS.medium;
      default: return SUPERVISOR_COLORS.low;
    }
  };

  const getSlaStatus = (deadlineStr) => {
    if (!deadlineStr) return { text: 'No deadline', color: SUPERVISOR_COLORS.low };
    const timeLeft = new Date(deadlineStr).getTime() - Date.now();
    if (timeLeft < 0) return { text: 'SLA breached', color: SUPERVISOR_COLORS.critical };
    const hoursLeft = Math.round(timeLeft / (1000 * 60 * 60));
    return { text: `${hoursLeft}h left`, color: SUPERVISOR_COLORS.accent };
  };

  const priorityColor = getPriorityColor(item.priority);
  const sla = getSlaStatus(item.slaDeadline);
  const isUnassigned = !item.assignedOfficerId;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.rowBetween}>
        <Text style={styles.ticketNumber}>{item.ticketNumber || `#CS-${item.id}`}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {item.escalationLevel > 0 ? (
            <View style={[styles.badge, { backgroundColor: SUPERVISOR_COLORS.critical + '22', borderColor: SUPERVISOR_COLORS.critical + '55' }]}>
              <Text style={[styles.badgeText, { color: SUPERVISOR_COLORS.critical }]}>
                ESCALATED L{item.escalationLevel}
              </Text>
            </View>
          ) : null}
          <View style={[styles.badge, { backgroundColor: priorityColor + '22', borderColor: priorityColor + '55' }]}>
            <Text style={[styles.badgeText, { color: priorityColor }]}>{item.priority || 'NORMAL'}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={1}>{item.title}</Text>

      <View style={styles.locationContainer}>
        <Ionicons name="location-sharp" size={14} color={SUPERVISOR_COLORS.textSecondary} />
        <Text style={styles.address} numberOfLines={1}>{item.formattedAddress || 'Location unavailable'}</Text>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.statusWrapper}>
          <Ionicons
            name={isUnassigned ? 'person-remove' : 'person'}
            size={13}
            color={isUnassigned ? SUPERVISOR_COLORS.critical : SUPERVISOR_COLORS.success}
          />
          <Text style={[styles.statusText, isUnassigned && { color: SUPERVISOR_COLORS.critical }]}>
            {isUnassigned ? 'Unassigned' : item.assignedOfficerName || 'Assigned'}
          </Text>
        </View>

        <View style={[styles.slaBadge, { backgroundColor: sla.color + '1f' }]}>
          <Ionicons name="time-outline" size={12} color={sla.color} />
          <Text style={[styles.slaText, { color: sla.color }]}>{sla.text}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SUPERVISOR_COLORS.glassBgSoft,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: SUPERVISOR_COLORS.glassBorder,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketNumber: { color: SUPERVISOR_COLORS.textSecondary, fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  title: { color: SUPERVISOR_COLORS.textPrimary, fontSize: 16, fontWeight: '700', marginTop: 10 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  address: { color: SUPERVISOR_COLORS.textSecondary, fontSize: 12, flex: 1 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  statusWrapper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { color: SUPERVISOR_COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  slaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  slaText: { fontSize: 11, fontWeight: '700' },
});
