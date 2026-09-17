import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OFFICER_COLORS } from '../../screens/officer/officerTheme';

export default function GrievanceCard({ item, onPress }) {
  // Determine Priority Badge Accent Colorization
  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL': return OFFICER_COLORS.critical;
      case 'HIGH': return OFFICER_COLORS.high;
      case 'MEDIUM': return OFFICER_COLORS.medium;
      default: return OFFICER_COLORS.low;
    }
  };

  // Humanize time calculations for simple SLA tracking display
  const getSlaStatus = (deadlineStr) => {
    if (!deadlineStr) return { text: 'No Deadline', color: OFFICER_COLORS.low };
    const timeLeft = new Date(deadlineStr).getTime() - Date.now();
    if (timeLeft < 0) return { text: 'SLA Breached', color: OFFICER_COLORS.critical };

    const hoursLeft = Math.round(timeLeft / (1000 * 60 * 60));
    if (hoursLeft === 0) return { text: 'Breaching Soon (<1h)', color: OFFICER_COLORS.high };
    return { text: `SLA: ${hoursLeft}h left`, color: OFFICER_COLORS.accent };
  };

  const priorityColor = getPriorityColor(item.priority);
  const sla = getSlaStatus(item.sla_deadline);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {/* Upper Meta Flag Strip */}
      <View style={styles.rowBetween}>
        <Text style={styles.ticketNumber}>{item.ticketNumber || `#CS-${item.id}`}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {item.escalationLevel > 0 ? (
            <View style={[styles.badge, { backgroundColor: OFFICER_COLORS.critical + '22', borderColor: OFFICER_COLORS.critical + '55' }]}>
              <Text style={[styles.badgeText, { color: OFFICER_COLORS.critical }]}>
                ESCALATED L{item.escalationLevel}
              </Text>
            </View>
          ) : null}
          <View style={[styles.badge, { backgroundColor: priorityColor + '22', borderColor: priorityColor + '55' }]}>
            <Text style={[styles.badgeText, { color: priorityColor }]}>{item.priority || 'NORMAL'}</Text>
          </View>
        </View>
      </View>

      {/* Primary Context Section */}
      <Text style={styles.title} numberOfLines={1}>{item.title}</Text>

      <View style={styles.locationContainer}>
        <Ionicons name="location-sharp" size={14} color={OFFICER_COLORS.textSecondary} />
        <Text style={styles.address} numberOfLines={1}>{item.address}</Text>
      </View>

      <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

      {/* Dynamic Operational Footer Indicators */}
      <View style={styles.footerRow}>
        <View style={styles.statusWrapper}>
          <View style={[styles.statusDot, { backgroundColor: item.status === 'ASSIGNED' ? OFFICER_COLORS.info : OFFICER_COLORS.success }]} />
          <Text style={styles.statusText}>{item.status?.replace(/_/g, ' ')}</Text>
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
    backgroundColor: OFFICER_COLORS.glassBgSoft,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: OFFICER_COLORS.glassBorder,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: OFFICER_COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: OFFICER_COLORS.textPrimary,
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  address: {
    fontSize: 13,
    color: OFFICER_COLORS.textSecondary,
    flex: 1,
  },
  description: {
    fontSize: 13,
    color: OFFICER_COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: OFFICER_COLORS.glassBorder,
    paddingTop: 12,
  },
  statusWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: OFFICER_COLORS.textMuted,
    textTransform: 'uppercase',
  },
  slaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  slaText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
