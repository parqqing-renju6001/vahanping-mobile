import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, RefreshControl, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const BACKEND = 'https://parkping-wwur.onrender.com';

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'blocking',
    message: 'Someone says your car is blocking their exit!',
    plate: 'KL 01 AB 1234',
    time: new Date(Date.now() - 5 * 60000).toISOString(),
    read: false,
  },
  {
    id: '2',
    type: 'lights',
    message: "Your headlights are on — battery might drain!",
    plate: 'KL 01 AB 1234',
    time: new Date(Date.now() - 32 * 60000).toISOString(),
    read: false,
  },
  {
    id: '3',
    type: 'scan',
    message: 'Someone scanned your QR code',
    plate: 'KL 01 AB 1234',
    time: new Date(Date.now() - 3 * 3600000).toISOString(),
    read: true,
  },
];

const TYPE_CONFIG = {
  blocking: { emoji: '🚨', color: '#FF3B30', label: 'Blocking' },
  lights:   { emoji: '💡', color: '#FFD60A', label: 'Lights On' },
  scan:     { emoji: '📲', color: '#30D158', label: 'QR Scanned' },
  urgent:   { emoji: '⚠️', color: '#FF9F0A', label: 'Urgent' },
  other:    { emoji: '💬', color: '#0A84FF', label: 'Message' },
};

function timeAgo(isoTime) {
  const diff = Math.floor((Date.now() - new Date(isoTime).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      // Try fetching from backend
      const vehicles = await AsyncStorage.getItem('vehicles');
      const parsedVehicles = vehicles ? JSON.parse(vehicles) : [];

      if (parsedVehicles.length > 0) {
        // Fetch notifications for each vehicle token
        let allNotifs = [];
        for (const v of parsedVehicles) {
          try {
            const res = await fetch(`${BACKEND}/api/notifications/${v.token}`, {
              headers: { 'Content-Type': 'application/json' },
            });
            if (res.ok) {
              const data = await res.json();
              const notifs = (data.notifications || data || []).map(n => ({
                ...n,
                plate: v.plate,
              }));
              allNotifs = [...allNotifs, ...notifs];
            }
          } catch {}
        }

        if (allNotifs.length > 0) {
          allNotifs.sort((a, b) => new Date(b.time || b.createdAt) - new Date(a.time || a.createdAt));
          setNotifications(allNotifs);
          return;
        }
      }

      // Fall back to locally stored notifications
      const stored = await AsyncStorage.getItem('notifications');
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        // Show mock data if no vehicles registered yet
        if (parsedVehicles.length === 0) {
          setNotifications(MOCK_NOTIFICATIONS);
        }
      }
    } catch (e) {
      const stored = await AsyncStorage.getItem('notifications');
      if (stored) setNotifications(JSON.parse(stored));
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markRead = async (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    await AsyncStorage.setItem('notifications', JSON.stringify(updated));
  };

  const clearAll = () => {
    Alert.alert('Clear All', 'Remove all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive',
        onPress: async () => {
          setNotifications([]);
          await AsyncStorage.removeItem('notifications');
        }
      }
    ]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const config = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.other;

  const renderItem = ({ item }) => {
    const cfg = config(item.type);
    return (
      <TouchableOpacity
        style={[styles.card, !item.read && styles.cardUnread]}
        onPress={() => markRead(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBubble, { backgroundColor: cfg.color + '22' }]}>
          <Text style={styles.iconText}>{cfg.emoji}</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <View style={[styles.typeBadge, { backgroundColor: cfg.color + '22' }]}>
              <Text style={[styles.typeLabel, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            <Text style={styles.timeText}>{timeAgo(item.time || item.createdAt)}</Text>
          </View>
          <Text style={styles.messageText}>{item.message}</Text>
          <View style={styles.platePill}>
            <Text style={styles.platePillText}>🚗 {item.plate}</Text>
          </View>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🔔 Alerts</Text>
          <Text style={styles.headerSub}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </Text>
        </View>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔕</Text>
          <Text style={styles.emptyTitle}>No alerts yet</Text>
          <Text style={styles.emptyText}>
            When someone scans your car's QR code,{'\n'}you'll get notified here instantly.
          </Text>
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerBtnText}>Register a Vehicle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />
          }
          ListHeaderComponent={
            unreadCount > 0 ? (
              <TouchableOpacity
                style={styles.markAllBtn}
                onPress={async () => {
                  const updated = notifications.map(n => ({ ...n, read: true }));
                  setNotifications(updated);
                  await AsyncStorage.setItem('notifications', JSON.stringify(updated));
                }}
              >
                <Text style={styles.markAllText}>✓ Mark all as read</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSub: {
    color: '#666',
    fontSize: 13,
    marginTop: 2,
  },
  clearBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  clearBtnText: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 13,
  },
  list: { padding: 16 },
  markAllBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  markAllText: {
    color: '#7C3AED',
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#12121A',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#22223A',
    position: 'relative',
  },
  cardUnread: {
    borderColor: '#7C3AED44',
    backgroundColor: '#1F1A14',
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: { fontSize: 20 },
  cardContent: { flex: 1 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeText: {
    color: '#555',
    fontSize: 12,
  },
  messageText: {
    color: '#DDDDDD',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  platePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#1A1A26',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  platePillText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7C3AED',
    position: 'absolute',
    top: 14,
    right: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: { fontSize: 72, marginBottom: 20 },
  emptyTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
  },
  emptyText: {
    color: '#666',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  registerBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  registerBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
