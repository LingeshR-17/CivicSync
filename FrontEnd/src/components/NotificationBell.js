import React, { useState, useEffect, useCallback } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchUnreadNotificationCount } from '../api/api';

const POLL_MS = 15000;

/**
 * 🔔 Bell icon + unread badge. Polls the backend periodically so a citizen or
 * officer sees new activity (status changes, confirmation requests,
 * escalations) without needing push/SMS infra.
 */
export default function NotificationBell({ userId, onPress, size = 20, color = '#ffffff' }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const count = await fetchUnreadNotificationCount(userId);
    setUnreadCount(count);
  }, [userId]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  return (
    <TouchableOpacity style={styles.wrapper} onPress={onPress} activeOpacity={0.75}>
      <Ionicons name="notifications" size={size} color={color} />
      {unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0f172a',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
});
