import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { fetchOfficerScorecard } from '../../../api/api';
import { OFFICER_COLORS, OFFICER_SPACING } from '../officerTheme';

export default function ScorecardTab() {
  const { user } = useAuth();
  const [scorecard, setScorecard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadScorecard = useCallback(async ({ isRefresh = false } = {}) => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const data = await fetchOfficerScorecard(user.id);
      setScorecard({
        totalComplaints: data.totalHandled ?? 0,
        slaCompliance: data.slaCompliance ?? 100,
        reopenedRate: data.reopenedRate ?? 0,
        warningLevel: data.warningLevel ?? 0,
      });
    } catch (e) {
      setError('Unable to load scorecard. Pull down to retry.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadScorecard();
  }, [loadScorecard]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={OFFICER_COLORS.accent} />
      </View>
    );
  }

  if (error && !scorecard) {
    return (
      <ScrollView
        contentContainerStyle={styles.loadingContainer}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadScorecard({ isRefresh: true })} colors={[OFFICER_COLORS.accent]} tintColor={OFFICER_COLORS.accent} />}
      >
        <Text style={{ color: OFFICER_COLORS.textSecondary }}>{error}</Text>
      </ScrollView>
    );
  }

  if (!scorecard) return null;

  let warningColor = OFFICER_COLORS.success;
  let warningText = 'Excellent';
  if (scorecard.warningLevel === 1) {
    warningColor = OFFICER_COLORS.medium;
    warningText = 'Warning Level 1';
  } else if (scorecard.warningLevel === 2) {
    warningColor = OFFICER_COLORS.critical;
    warningText = 'Critical Warning';
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadScorecard({ isRefresh: true })} colors={[OFFICER_COLORS.accent]} tintColor={OFFICER_COLORS.accent} />}
    >
      <Text style={styles.sectionTitle}>Performance Analytics</Text>

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Ionicons name="folder-open" size={26} color={OFFICER_COLORS.accent} />
          <Text style={styles.gridValue}>{scorecard.totalComplaints}</Text>
          <Text style={styles.gridLabel}>Total Handled</Text>
        </View>

        <View style={styles.gridItem}>
          <Ionicons name="checkmark-circle" size={26} color={OFFICER_COLORS.success} />
          <Text style={styles.gridValue}>{scorecard.slaCompliance.toFixed(1)}%</Text>
          <Text style={styles.gridLabel}>SLA Compliance</Text>
        </View>

        <View style={styles.gridItem}>
          <Ionicons name="refresh-circle" size={26} color={OFFICER_COLORS.high} />
          <Text style={styles.gridValue}>{scorecard.reopenedRate.toFixed(1)}%</Text>
          <Text style={styles.gridLabel}>Reopened Rate</Text>
        </View>

        <View style={[styles.gridItem, { borderColor: warningColor, borderWidth: 1.5 }]}>
          <Ionicons name="warning" size={26} color={warningColor} />
          <Text style={[styles.gridValue, { color: warningColor }]}>{warningText}</Text>
          <Text style={styles.gridLabel}>Admin Status</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: OFFICER_SPACING.md, flexGrow: 1 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: OFFICER_COLORS.textPrimary,
    marginBottom: OFFICER_SPACING.md,
    letterSpacing: 0.2,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: OFFICER_SPACING.md },
  gridItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: OFFICER_COLORS.glassBg,
    borderRadius: 16,
    padding: OFFICER_SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: OFFICER_COLORS.glassBorder,
  },
  gridValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: OFFICER_COLORS.textPrimary,
    marginTop: OFFICER_SPACING.sm,
  },
  gridLabel: {
    fontSize: 12,
    color: OFFICER_COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
