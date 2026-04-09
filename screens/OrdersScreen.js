import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, RefreshControl, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';

const BACKEND = 'https://api.vahanping.com';
const ACCENT  = '#7C3AED';
const LIGHT   = '#9D65F5';

const BackIcon = ({ color = '#888' }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const PackageIcon = ({ color = '#888', size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   bg: '#2D1F00', text: '#F59E0B' },
  paid:      { label: 'Paid',      bg: '#052E16', text: '#34D399' },
  shipped:   { label: 'Shipped',   bg: '#0C1A4E', text: '#60A5FA' },
  delivered: { label: 'Delivered', bg: '#052E16', text: '#34D399' },
  completed: { label: 'Completed', bg: '#052E16', text: '#34D399' },
  cancelled: { label: 'Cancelled', bg: '#2D0A0A', text: '#F87171' },
};

const TEMPLATE_COLORS = {
  gold:     '#C9A84C',
  silver:   '#C0C0C0',
  titanium: '#B0B0B0',
};

function OrderCard({ order }) {
  const status = (order.status || 'pending').toLowerCase();
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const templateColor = TEMPLATE_COLORS[(order.sticker_template || 'gold').toLowerCase()] || '#C9A84C';

  const date = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <View style={s.card}>
      {/* Header row */}
      <View style={s.cardHeader}>
        <View style={s.orderIdWrap}>
          <Text style={s.orderIdLabel}>ORDER</Text>
          <Text style={s.orderId}>#{order.order_id}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: statusCfg.bg }]}>
          <Text style={[s.statusText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
        </View>
      </View>

      <View style={s.divider} />

      {/* Template + Plate */}
      <View style={s.row}>
        <View style={s.infoBlock}>
          <Text style={s.infoLabel}>Sticker</Text>
          <Text style={[s.infoValue, { color: templateColor, textTransform: 'capitalize', fontWeight: '800' }]}>
            {order.sticker_template || 'Gold'}
          </Text>
        </View>
        <View style={s.infoBlock}>
          <Text style={s.infoLabel}>Vehicle</Text>
          <Text style={[s.infoValue, { fontFamily: 'monospace', letterSpacing: 1 }]}>
            {order.vehicle_plate || '—'}
          </Text>
        </View>
        <View style={s.infoBlock}>
          <Text style={s.infoLabel}>Amount</Text>
          <Text style={[s.infoValue, { color: '#34D399', fontWeight: '800' }]}>₹{order.amount}</Text>
        </View>
      </View>

      {/* Address */}
      <View style={s.addressRow}>
        <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" style={{ marginTop: 1 }}>
          <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="#555" strokeWidth="1.8"/>
          <Path d="M12 13a3 3 0 100-6 3 3 0 000 6z" stroke="#555" strokeWidth="1.8"/>
        </Svg>
        <Text style={s.addressText} numberOfLines={1}>
          {[order.address_line1, order.city, order.state, order.pincode].filter(Boolean).join(', ')}
        </Text>
      </View>

      {/* Date */}
      <Text style={s.dateText}>{date}</Text>
    </View>
  );
}

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState(null);
  const [phone, setPhone]       = useState('');

  const fetchOrders = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);

      const storedPhone = await AsyncStorage.getItem('user_phone');
      if (!storedPhone) {
        setError('no_phone');
        return;
      }
      setPhone(storedPhone);

      const queryPhone = storedPhone.replace(/^\+91/, '');
      const res = await fetch(`${BACKEND}/api/v1/orders/user/${encodeURIComponent(queryPhone)}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (e) {
      setError('fetch_failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchOrders(); }, [fetchOrders]));

  const renderEmpty = () => (
    <View style={s.emptyWrap}>
      <PackageIcon color="#333" size={56} />
      <Text style={s.emptyTitle}>No Orders Yet</Text>
      <Text style={s.emptySubtitle}>Your sticker orders will appear here after purchase.</Text>
      <TouchableOpacity style={s.shopBtn} onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}>
        <Text style={s.shopBtnText}>Browse Vehicles</Text>
      </TouchableOpacity>
    </View>
  );

  const renderError = () => (
    <View style={s.emptyWrap}>
      <Text style={s.emptyTitle}>
        {error === 'no_phone' ? 'Not Logged In' : 'Could Not Load Orders'}
      </Text>
      <Text style={s.emptySubtitle}>
        {error === 'no_phone'
          ? 'Please log in to view your orders.'
          : 'Check your connection and try again.'}
      </Text>
      <TouchableOpacity style={s.shopBtn} onPress={() => fetchOrders()}>
        <Text style={s.shopBtnText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <BackIcon color="#888" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.headerTitle}>My Orders</Text>
          <Text style={s.headerSub}>
            {loading ? 'Loading…' : `${orders.length} order${orders.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={s.loadingText}>Fetching your orders…</Text>
        </View>
      ) : error ? renderError() : (
        <FlatList
          data={orders}
          keyExtractor={item => String(item.order_id)}
          renderItem={({ item }) => <OrderCard order={item} />}
          contentContainerStyle={[s.list, orders.length === 0 && { flex: 1 }]}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchOrders(true)}
              tintColor={ACCENT}
              colors={[ACCENT]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#080808' },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  backBtn:      { width: 38, height: 38, borderRadius: 10, backgroundColor: '#0E0E0E', borderWidth: 1, borderColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 22, fontWeight: '700', color: '#FFF', letterSpacing: -0.3 },
  headerSub:    { color: '#444', fontSize: 12, marginTop: 2 },

  list:         { padding: 16, paddingBottom: 40 },

  card:         { backgroundColor: '#0E0E0E', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#1A1A1A' },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderIdWrap:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderIdLabel: { fontSize: 10, color: '#444', fontWeight: '700', letterSpacing: 1 },
  orderId:      { fontSize: 14, color: '#FFF', fontWeight: '800' },
  statusBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText:   { fontSize: 11, fontWeight: '700' },

  divider:      { height: 1, backgroundColor: '#1A1A1A', marginBottom: 12 },

  row:          { flexDirection: 'row', marginBottom: 12 },
  infoBlock:    { flex: 1 },
  infoLabel:    { fontSize: 10, color: '#444', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  infoValue:    { fontSize: 14, color: '#FFF', fontWeight: '600' },

  addressRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 8 },
  addressText:  { flex: 1, fontSize: 12, color: '#555', lineHeight: 16 },
  dateText:     { fontSize: 11, color: '#333', textAlign: 'right' },

  loadingWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:  { color: '#444', fontSize: 13 },

  emptyWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: '#FFF', marginTop: 8 },
  emptySubtitle:{ fontSize: 13, color: '#555', textAlign: 'center', lineHeight: 20 },
  shopBtn:      { marginTop: 16, backgroundColor: ACCENT, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  shopBtnText:  { color: '#FFF', fontWeight: '700', fontSize: 14 },
});
