import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ActiveTasksTab from './tabs/ActiveTasksTab';
import HistoryLogsTab from './tabs/HistoryLogsTab';
import ScorecardTab from './tabs/ScorecardTab';
import { OFFICER_COLORS, OFFICER_SPACING } from './officerTheme';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../../components/NotificationBell';
import NotificationsScreen from '../NotificationsScreen';

export default function OfficerDashboard() {
  const [currentTab, setCurrentTab] = useState('ACTIVE'); // 'ACTIVE', 'LOGS', 'SCORECARD'
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logoutUser } = useAuth();

  const tabs = [
    { key: 'ACTIVE', label: 'Active', icon: 'briefcase' },
    { key: 'LOGS', label: 'Logs', icon: 'archive' },
    { key: 'SCORECARD', label: 'Scorecard', icon: 'bar-chart' },
  ];

  if (showNotifications) {
    return (
      <LinearGradient colors={OFFICER_COLORS.bgGradient} style={styles.gradient}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
          <NotificationsScreen userId={user?.id} onBack={() => setShowNotifications(false)} />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={OFFICER_COLORS.bgGradient} style={styles.gradient}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={[styles.header, { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }]}>
          <View>
            <Text style={styles.headerTitle}>Field Operations</Text>
            <Text style={styles.headerSubtitle}>Manage assigned civic tickets</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <NotificationBell
              userId={user?.id}
              onPress={() => setShowNotifications(true)}
              size={22}
              color={OFFICER_COLORS.textPrimary}
            />
            <TouchableOpacity onPress={logoutUser} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="log-out-outline" size={24} color={OFFICER_COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Selectors */}
        <View style={styles.tabContainer}>
          {tabs.map(tab => {
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
                  size={18}
                  color={isActive ? OFFICER_COLORS.accent : OFFICER_COLORS.textSecondary}
                />
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab.label}</Text>
                {isActive && <View style={styles.activeTabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Content Area */}
        <View style={styles.contentArea}>
          {currentTab === 'ACTIVE' && <ActiveTasksTab />}
          {currentTab === 'LOGS' && <HistoryLogsTab />}
          {currentTab === 'SCORECARD' && <ScorecardTab />}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  header: {
    paddingHorizontal: OFFICER_SPACING.lg,
    paddingTop: OFFICER_SPACING.md,
    paddingBottom: OFFICER_SPACING.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: OFFICER_COLORS.textPrimary,
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: OFFICER_COLORS.textSecondary,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: OFFICER_SPACING.lg,
    backgroundColor: OFFICER_COLORS.glassBg,
    borderWidth: 1,
    borderColor: OFFICER_COLORS.glassBorder,
    borderRadius: 14,
    padding: 4,
    marginBottom: OFFICER_SPACING.md,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: OFFICER_SPACING.xs,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: OFFICER_COLORS.textSecondary,
  },
  activeTabText: {
    color: OFFICER_COLORS.accent,
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: OFFICER_COLORS.accent,
    alignSelf: 'center',
  },
  contentArea: {
    flex: 1,
  },
});
