import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchSupervisorOverview } from '../../../api/api';
import { SUPERVISOR_COLORS, SUPERVISOR_SPACING } from '../supervisorTheme';

function StatCard({ icon, label, value, color, hint }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </View>
  );
}

export default function OverviewTab() {
  const [overview, setOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async ({ isRefresh = false } = {}) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const data = await fetchSupervisorOverview();
      setOverview(data);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={SUPERVISOR_COLORS.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => load({ isRefresh: true })} colors={[SUPERVISOR_COLORS.accent]} />}
    >
      <StatCard
        icon="person-remove"
        label="Unassigned tickets"
        value={overview?.unassignedCount ?? 0}
        color={SUPERVISOR_COLORS.critical}
        hint="No field officer seeded for ward + department — needs manual routing"
      />
      <StatCard
        icon="warning"
        label="Escalated tickets"
        value={overview?.escalatedCount ?? 0}
        color={SUPERVISOR_COLORS.high}
        hint="SLA breached or the citizen rejected a resolution"
      />
      <StatCard
        icon="folder-open"
        label="Open tickets citywide"
        value={overview?.openTicketCount ?? 0}
        color={SUPERVISOR_COLORS.info}
        hint="Pending, assigned, in progress, or reopened"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SUPERVISOR_SPACING.md, gap: SUPERVISOR_SPACING.md },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  statCard: {
    backgroundColor: SUPERVISOR_COLORS.glassBgSoft,
    borderRadius: 18,
    padding: SUPERVISOR_SPACING.lg,
    borderWidth: 1,
    borderColor: SUPERVISOR_COLORS.glassBorder,
    marginBottom: SUPERVISOR_SPACING.md,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { color: SUPERVISOR_COLORS.textPrimary, fontSize: 30, fontWeight: '800' },
  statLabel: { color: SUPERVISOR_COLORS.textMuted, fontSize: 14, fontWeight: '600', marginTop: 2 },
  statHint: { color: SUPERVISOR_COLORS.textSecondary, fontSize: 12, marginTop: 6, lineHeight: 16 },
});
