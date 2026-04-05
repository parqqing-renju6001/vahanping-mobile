import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, RefreshControl, Alert, StatusBar, Platform
} from 'react-native';
import Svg, { Path, Rect, Circle, Line, Polyline, G } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import CustomModal from './CustomModal';


// ── Custom SVG Icons ────────────────────────────────────────────
const CarIcon = ({ size = 24, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 17H3a2 2 0 01-2-2v-4l2.5-6h13L19 11v4a2 2 0 01-2 2h-2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx="7.5" cy="17.5" r="2.5" stroke={color} strokeWidth="1.5"/>
    <Circle cx="16.5" cy="17.5" r="2.5" stroke={color} strokeWidth="1.5"/>
    <Path d="M5 11h14M9 5l-1 6M15 5l1 6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const QRIcon = ({ size = 24, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5"/>
    <Rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5"/>
    <Rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5"/>
    <Rect x="5" y="5" width="3" height="3" fill={color}/>
    <Rect x="16" y="5" width="3" height="3" fill={color}/>
    <Rect x="5" y="16" width="3" height="3" fill={color}/>
    <Path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 20h3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const TrashIcon = ({ size = 20, color = '#666' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="3 6 5 6 21 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const BoltIcon = ({ size = 16, color = '#C9A84C' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ShieldIcon = ({ size = 20, color = '#7C3AED' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const PlusIcon = ({ size = 20, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const BellIcon = ({ size = 18, color = '#888' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

// ── Component ────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [pushToken, setPushToken] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('expo_push_token').then(t => { if (t) setPushToken(t); });
  }, []);

  const loadVehicles = async () => {
    try {
      const stored = await AsyncStorage.getItem('vehicles');
      if (stored) setVehicles(JSON.parse(stored));
    } catch (e) { console.log(e); }
  };

  useFocusEffect(useCallback(() => { loadVehicles(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVehicles();
    setRefreshing(false);
  };

  const deleteVehicle = (id) => {
    Alert.alert('Remove Vehicle', 'Remove this vehicle from VahanPing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          const updated = vehicles.filter(v => v.id !== id);
          setVehicles(updated);
          await AsyncStorage.setItem('vehicles', JSON.stringify(updated));
        }
      }
    ]);
  };

  const renderVehicle = ({ item }) => (
    <View style={styles.card}>
      {/* Top row */}
      <View style={styles.cardTop}>
        <View style={styles.plateWrap}>
          <Text style={styles.plateText}>{item.plate}</Text>
        </View>
        <View style={styles.activePill}>
          <View style={styles.activeDot} />
          <Text style={styles.activeText}>ACTIVE</Text>
        </View>
      </View>

      {/* Vehicle info */}
      <View style={styles.vehicleInfoRow}>
        <CarIcon size={16} color="#555" />
        <Text style={styles.vehicleMeta}>{item.color} · {item.model || 'Vehicle'}</Text>
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.qrBtn}
          onPress={() => navigation.navigate('QRCode', { vehicle: item })}
        >
          <QRIcon size={16} color="#fff" />
          <Text style={styles.qrBtnText}>View QR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.stickerBtn}
          onPress={() => navigation.navigate('StickerDesign', { vehicle: item })}
        >
          <Text style={styles.stickerBtnText}>Design</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => deleteVehicle(item.id)}
        >
          <TrashIcon size={18} color="#555" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoMark}>
            <ShieldIcon size={18} color="#9D65F5" />
          </View>
          <View>
            <Text style={styles.headerTitle}>VahanPing</Text>
            <Text style={styles.headerSub}>Vehicle Protection</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={styles.ordersBtn}
            onPress={() => navigation.navigate('Orders')}
          >
            <Text style={styles.ordersBtnText}>📦 Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => require('react-native').Linking.openURL('https://www.vahanping.com/shop')}
          >
            <Text style={styles.shopBtnText}>🏪 Shop</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => navigation.navigate('Payment')}
          >
            <BoltIcon size={13} color="#C9A84C" />
            <Text style={styles.upgradeBtnText}>Upgrade</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{vehicles.length}</Text>
          <Text style={styles.statLabel}>Vehicles</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{vehicles.length > 0 ? 'ON' : 'OFF'}</Text>
          <Text style={styles.statLabel}>Protection</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <BellIcon size={16} color={pushToken ? '#9D65F5' : '#444'} />
          <Text style={styles.statLabel}>Alerts</Text>
        </View>
      </View>

      {vehicles.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <CarIcon size={40} color="#333" />
          </View>
          <Text style={styles.emptyTitle}>No vehicles registered</Text>
          <Text style={styles.emptyText}>
            Register your vehicle and get a QR sticker.{'\n'}
            People can contact you anonymously when needed.
          </Text>
          <TouchableOpacity
            style={styles.addFirstBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <PlusIcon size={18} color="#fff" />
            <Text style={styles.addFirstBtnText}>Register Vehicle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={item => item.id}
          renderItem={renderVehicle}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
          ListFooterComponent={
            <TouchableOpacity
              style={styles.addMoreBtn}
              onPress={() => navigation.navigate('Register')}
            >
              <PlusIcon size={16} color="#555" />
              <Text style={styles.addMoreText}>Register Another Vehicle</Text>
            </TouchableOpacity>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 8 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0F0A1E',
    borderWidth: 1,
    borderColor: '#1E1030',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.2,
  },
  headerSub: {
    fontSize: 11,
    color: '#999999',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  ordersBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#2A2A2A' },
  shopBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#C9A84C' },
  shopBtnText: { fontSize: 12, fontWeight: '700', color: '#C9A84C' },
  ordersBtnText: { fontSize: 12, fontWeight: '700', color: '#9D65F5' },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F0C00',
    borderWidth: 1,
    borderColor: '#2A2200',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  upgradeBtnText: {
    color: '#C9A84C',
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.2,
  },

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statLabel: {
    color: '#999999',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#EBEBEB',
  },

  // List
  list: {
    padding: 16,
    paddingBottom: 100,
    gap: 12,
  },

  // Card
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  plateWrap: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  plateText: {
    color: '#1A1A1A',
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 3,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#7C3AED',
  },
  activeText: {
    color: '#7C3AED',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  vehicleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  vehicleMeta: {
    color: '#888888',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#EBEBEB',
    marginBottom: 14,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  qrBtnText: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  deleteBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    paddingBottom: 100,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    color: '#1A1A1A',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  emptyText: {
    color: '#999999',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 280,
  },
  addFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addFirstBtnText: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
  },

  // Add more
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  addMoreText: {
    color: '#999999',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.2,
  },

  stickerBtn: {
    backgroundColor: '#EBEBEB',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  stickerBtnText: {
    color: '#777777',
    fontWeight: '600',
    fontSize: 13,
  },

});


