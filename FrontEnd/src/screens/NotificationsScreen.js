import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchNotifications,
  markAllNotificationsRead,
} from '../api/api';

const TYPE_ICON = {
  CONFIRMATION_REQUEST: 'help-circle',
  ESCALATION: 'warning',
  STATUS_UPDATE: 'information-circle',
  SYSTEM: 'megaphone',
};

const TYPE_COLOR = {
  CONFIRMATION_REQUEST: '#38bdf8',
  ESCALATION: '#f97316',
  STATUS_UPDATE: '#a5f3fc',
  SYSTEM: '#a78bfa',
};

function timeAgo(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/**
 * 🔔 In-app notification feed. Works for both citizens and officers — pass in
 * whichever id is logged in as `userId`. No push/SMS infra required; this is
 * polled/pulled by the bell badge and refreshed on open.
 */
export default function NotificationsScreen({ userId, onBack }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    const data = await fetchNotifications(userId);
    setNotifications(data || []);
  }, [userId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
      // Opening the list is treated as "seen" — clears the bell badge.
      markAllNotificationsRead(userId);
    })();
  }, [load, userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 30 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#a5f3fc" style={{ marginTop: 60 }} />
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={40} color="#475569" />
          <Text style={styles.emptyText}>You're all caught up. Nothing here yet.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a5f3fc" />}
          renderItem={({ item }) => {
            const iconName = TYPE_ICON[item.type] || 'notifications';
            const iconColor = TYPE_COLOR[item.type] || '#a5f3fc';
            return (
              <View style={[styles.card, !item.isRead && styles.cardUnread]}>
                <View style={[styles.iconCircle, { backgroundColor: iconColor + '22', borderColor: iconColor + '55' }]}>
                  <Ionicons name={iconName} size={16} color={iconColor} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardMessage}>{item.message}</Text>
                  <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
                </View>
                {!item.isRead ? <View style={styles.unreadDot} /> : null}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07161b' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginTop: 60,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  cardUnread: {
    borderColor: 'rgba(165,243,252,0.3)',
    backgroundColor: 'rgba(165,243,252,0.05)',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: '#f1f5f9',
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 3,
  },
  cardMessage: {
    color: '#94a3b8',
    fontSize: 12.5,
    lineHeight: 17,
  },
  cardTime: {
    color: '#475569',
    fontSize: 11,
    marginTop: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38bdf8',
    marginLeft: 8,
    marginTop: 4,
  },
});
