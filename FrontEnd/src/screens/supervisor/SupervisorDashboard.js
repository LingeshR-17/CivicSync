import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import OverviewTab from './tabs/OverviewTab';
import UnassignedTab from './tabs/UnassignedTab';
import EscalatedTab from './tabs/EscalatedTab';
import { SUPERVISOR_COLORS, SUPERVISOR_SPACING } from './supervisorTheme';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../../components/NotificationBell';
import NotificationsScreen from '../NotificationsScreen';

export default function SupervisorDashboard() {
  const [currentTab, setCurrentTab] = useState('OVERVIEW'); // 'OVERVIEW', 'UNASSIGNED', 'ESCALATED'
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logoutUser } = useAuth();

  const tabs = [
    { key: 'OVERVIEW', label: 'Overview', icon: 'stats-chart' },
    { key: 'UNASSIGNED', label: 'Unassigned', icon: 'person-remove' },
    { key: 'ESCALATED', label: 'Escalated', icon: 'warning' },
  ];

  if (showNotifications) {
    return (
      <LinearGradient colors={SUPERVISOR_COLORS.bgGradient} style={styles.gradient}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
          <NotificationsScreen userId={user?.id} onBack={() => setShowNotifications(false)} />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={SUPERVISOR_COLORS.bgGradient} style={styles.gradient}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={[styles.header, { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }]}>
          <View>
            <Text style={styles.headerTitle}>Supervisor Console</Text>
            <Text style={styles.headerSubtitle}>Route unassigned tickets & watch escalations</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <NotificationBell
              userId={user?.id}
              onPress={() => setShowNotifications(true)}
              size={22}
              color={SUPERVISOR_COLORS.textPrimary}
            />
            <TouchableOpacity onPress={logoutUser} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="log-out-outline" size={22} color={SUPERVISOR_COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabContainer}>
          {tabs.map((tab) => {
            const isActive = currentTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabButton}
                onPress={() => setCurrentTab(tab.key)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={tab.icon}
                  size={17}
                  color={isActive ? SUPERVISOR_COLORS.accent : SUPERVISOR_COLORS.textSecondary}
                />
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab.label}</Text>
                {isActive && <View style={styles.activeTabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.contentArea}>
          {currentTab === 'OVERVIEW' && <OverviewTab />}
          {currentTab === 'UNASSIGNED' && <UnassignedTab />}
          {currentTab === 'ESCALATED' && <EscalatedTab />}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  header: {
    paddingHorizontal: SUPERVISOR_SPACING.lg,
    paddingTop: SUPERVISOR_SPACING.md,
    paddingBottom: SUPERVISOR_SPACING.md,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: SUPERVISOR_COLORS.textPrimary, letterSpacing: 0.2 },
  headerSubtitle: { fontSize: 13, color: SUPERVISOR_COLORS.textSecondary, marginTop: 4 },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SUPERVISOR_SPACING.lg,
    backgroundColor: SUPERVISOR_COLORS.glassBg,
    borderWidth: 1,
    borderColor: SUPERVISOR_COLORS.glassBorder,
    borderRadius: 14,
    padding: 4,
    marginBottom: SUPERVISOR_SPACING.md,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: SUPERVISOR_SPACING.xs,
  },
  tabText: { fontSize: 12, fontWeight: '600', color: SUPERVISOR_COLORS.textSecondary },
  activeTabText: { color: SUPERVISOR_COLORS.accent },
  activeTabIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: SUPERVISOR_COLORS.accent,
    alignSelf: 'center',
  },
  contentArea: { flex: 1 },
});
