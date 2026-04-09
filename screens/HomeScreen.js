import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, RefreshControl, StatusBar, Platform,
  Switch, Modal, ScrollView,
} from 'react-native';
import Svg, { Path, Rect, Circle, Line, Polyline, G } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import CustomModal from './CustomModal';

const BACKEND = 'https://api.vahanping.com';


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
const DESIGN_ELIGIBLE = ['Car', 'Scooter', 'Bike'];

export default function HomeScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [pushToken, setPushToken] = useState('');
  const [deleteModal, setDeleteModal] = useState({ visible: false, vehicleId: null, plate: '' });
  const [activeBtn, setActiveBtn] = useState(null);
  const [settingsModal, setSettingsModal] = useState({ visible: false, vehicle: null });
  const [settingsToggles, setSettingsToggles] = useState({ push: true, whatsapp: false, call: false, sms: false });
  const [hasBundlePlan, setHasBundlePlan] = useState(false);
  const [upsellModal, setUpsellModal] = useState({ visible: false, feature: '' });

  useEffect(() => {
    AsyncStorage.getItem('expo_push_token').then(t => { if (t) setPushToken(t); });
  }, []);

  const loadVehicles = async () => {
    try {
      const stored = await AsyncStorage.getItem('vehicles');
      if (stored) setVehicles(JSON.parse(stored));
    } catch (e) { console.log(e); }
  };

  useFocusEffect(useCallback(() => {
    loadVehicles();
    setActiveBtn(null);
  }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVehicles();
    setRefreshing(false);
  };

  const confirmDelete = (id, plate) => {
    setDeleteModal({ visible: true, vehicleId: id, plate });
  };

  const executeDelete = async () => {
    const id = deleteModal.vehicleId;
    setDeleteModal({ visible: false, vehicleId: null, plate: '' });
    const updated = vehicles.filter(v => v.id !== id);
    setVehicles(updated);
    await AsyncStorage.setItem('vehicles', JSON.stringify(updated));
  };

  const openSettings = async (vehicle) => {
    const bundlePurchased = await AsyncStorage.getItem('bundle_purchased');
    setHasBundlePlan(bundlePurchased === 'true');
    const stored = await AsyncStorage.getItem(`prefs_${vehicle.id}`);
    setSettingsToggles(stored ? JSON.parse(stored) : { push: true, whatsapp: false, call: false, sms: false });
    setSettingsModal({ visible: true, vehicle });
  };

  const handleToggle = (key, value) => {
    if ((key === 'call' || key === 'whatsapp' || key === 'sms') && value && !hasBundlePlan) {
      const featureName = key === 'call' ? 'anonymous calls' : key === 'whatsapp' ? 'WhatsApp alerts' : 'SMS alerts';
      setUpsellModal({ visible: true, feature: featureName });
      return;
    }
    const newToggles = { ...settingsToggles, [key]: value };
    setSettingsToggles(newToggles);
    savePrefs(settingsModal.vehicle, newToggles);
  };

  const savePrefs = async (vehicle, toggles) => {
    if (!vehicle) return;
    await AsyncStorage.setItem(`prefs_${vehicle.id}`, JSON.stringify(toggles));
    try {
      await fetch(`${BACKEND}/api/v1/update-preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_token: vehicle.token,
          push_enabled: toggles.push,
          whatsapp_enabled: toggles.whatsapp,
          call_enabled: toggles.call,
          sms_enabled: toggles.sms,
        }),
      });
    } catch (e) { console.log('Prefs save error:', e); }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const renderVehicle = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openSettings(item)} activeOpacity={0.92}>
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

        {DESIGN_ELIGIBLE.includes(item.vehicleType) && (
          <TouchableOpacity
            style={styles.stickerBtn}
            onPress={() => navigation.navigate('StickerDesign', { vehicle: item })}
          >
            <Text style={styles.stickerBtnText}>Design</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => confirmDelete(item.id, item.plate)}
        >
          <TrashIcon size={18} color="#555" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <CustomModal
        visible={deleteModal.visible}
        title="Remove Vehicle"
        message={`Remove ${deleteModal.plate} from VahanPing? This cannot be undone.`}
        buttons={[
          { text: 'Cancel', onPress: () => setDeleteModal({ visible: false, vehicleId: null, plate: '' }) },
          { text: 'Remove', style: 'destructive', onPress: executeDelete },
        ]}
        onClose={() => setDeleteModal({ visible: false, vehicleId: null, plate: '' })}
      />

      {/* Upsell Modal */}
      <CustomModal
        visible={upsellModal.visible}
        title="Bundle Required"
        message={`Purchase Bundle ₹299 to enable ${upsellModal.feature}.`}
        buttons={[
          { text: 'Maybe Later', onPress: () => setUpsellModal({ visible: false, feature: '' }) },
          { text: 'View Bundle →', style: 'primary', onPress: () => { setUpsellModal({ visible: false, feature: '' }); setSettingsModal({ visible: false, vehicle: null }); navigation.navigate('Payment'); } },
        ]}
        onClose={() => setUpsellModal({ visible: false, feature: '' })}
      />

      {/* Vehicle Settings Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={settingsModal.visible}
        onRequestClose={() => setSettingsModal({ visible: false, vehicle: null })}
      >
        <View style={styles.settingsOverlay}>
          <TouchableOpacity style={styles.settingsDismiss} activeOpacity={1} onPress={() => setSettingsModal({ visible: false, vehicle: null })} />
          <View style={styles.settingsSheet}>
            <View style={styles.settingsHandle} />

            {/* Header */}
            <View style={styles.settingsHeader}>
              <View>
                <Text style={styles.settingsPlate}>{settingsModal.vehicle?.plate}</Text>
                <Text style={styles.settingsSubtitle}>Vehicle Settings</Text>
              </View>
              <TouchableOpacity style={styles.settingsCloseBtn} onPress={() => setSettingsModal({ visible: false, vehicle: null })}>
                <Text style={styles.settingsCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Info section */}
              <Text style={styles.settingsSectionLabel}>Vehicle Info</Text>
              <View style={styles.settingsInfoCard}>
                {[
                  { label: 'Phone', value: settingsModal.vehicle?.phone || '—' },
                  { label: 'Color', value: settingsModal.vehicle?.color || '—' },
                  { label: 'Type', value: settingsModal.vehicle?.vehicleType || '—' },
                  { label: 'Registered', value: formatDate(settingsModal.vehicle?.registeredAt) },
                ].map((row, i, arr) => (
                  <View key={row.label} style={[styles.settingsInfoRow, i < arr.length - 1 && styles.settingsInfoRowBorder]}>
                    <Text style={styles.settingsInfoLabel}>{row.label}</Text>
                    <Text style={styles.settingsInfoValue}>{row.value}</Text>
                  </View>
                ))}
              </View>

              {/* Toggles section */}
              <Text style={styles.settingsSectionLabel}>Notifications & Features</Text>
              <View style={styles.settingsInfoCard}>
                {[
                  { key: 'push',     label: 'Push Notifications', sub: 'Free — instant in-app alerts',        paid: false },
                  { key: 'whatsapp', label: 'WhatsApp Alerts',     sub: 'Bundle plan required',                paid: true  },
                  { key: 'call',     label: 'Anonymous Call',      sub: 'Bundle plan required',                paid: true  },
                  { key: 'sms',      label: 'SMS Alerts',          sub: 'Bundle plan required',                paid: true  },
                ].map((item, i, arr) => (
                  <View key={item.key} style={[styles.settingsToggleRow, i < arr.length - 1 && styles.settingsInfoRowBorder]}>
                    <View style={styles.settingsToggleLeft}>
                      <View>
                        <View style={styles.settingsToggleLabelRow}>
                          <Text style={styles.settingsToggleLabel}>{item.label}</Text>
                          {!item.paid && <View style={styles.freeBadge}><Text style={styles.freeBadgeText}>FREE</Text></View>}
                          {item.paid && !hasBundlePlan && <View style={styles.paidBadge}><Text style={styles.paidBadgeText}>BUNDLE</Text></View>}
                        </View>
                        <Text style={styles.settingsToggleSub}>{item.sub}</Text>
                      </View>
                    </View>
                    <Switch
                      value={settingsToggles[item.key]}
                      onValueChange={(v) => handleToggle(item.key, v)}
                      trackColor={{ false: '#E0E0E0', true: '#7C3AED' }}
                      thumbColor={settingsToggles[item.key] ? '#fff' : '#f4f3f4'}
                      ios_backgroundColor="#E0E0E0"
                    />
                  </View>
                ))}
              </View>

              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
        <View style={styles.headerBtnGroup}>
          <TouchableOpacity
            style={[styles.groupBtn, activeBtn === 'orders' && styles.groupBtnActive]}
            onPress={() => { setActiveBtn('orders'); navigation.navigate('Orders'); }}
          >
            <Text style={[styles.groupBtnText, activeBtn === 'orders' && styles.groupBtnTextActive]}>Orders</Text>
          </TouchableOpacity>
          <View style={styles.groupBtnDivider} />
          <TouchableOpacity
            style={[styles.groupBtn, activeBtn === 'shop' && styles.groupBtnActive]}
            onPress={() => { setActiveBtn('shop'); require('react-native').Linking.openURL('https://www.vahanping.com/shop'); }}
          >
            <Text style={[styles.groupBtnText, activeBtn === 'shop' && styles.groupBtnTextActive]}>Shop</Text>
          </TouchableOpacity>
          <View style={styles.groupBtnDivider} />
          <TouchableOpacity
            style={[styles.groupBtn, activeBtn === 'upgrade' && styles.groupBtnActive]}
            onPress={() => { setActiveBtn('upgrade'); navigation.navigate('Payment'); }}
          >
            <BoltIcon size={13} color={activeBtn === 'upgrade' ? '#fff' : '#C9A84C'} />
            <Text style={[styles.groupBtnText, styles.groupBtnUpgradeText, activeBtn === 'upgrade' && styles.groupBtnTextActive]}>Upgrade</Text>
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
  headerBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    overflow: 'hidden',
  },
  groupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  groupBtnActive: {
    backgroundColor: '#7C3AED',
  },
  groupBtnDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#2A2A2A',
  },
  groupBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9D9D9D',
  },
  groupBtnUpgradeText: {
    color: '#C9A84C',
  },
  groupBtnTextActive: {
    color: '#FFFFFF',
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

  // Settings Modal
  settingsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  settingsDismiss: { flex: 1 },
  settingsSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%', borderTopWidth: 1, borderColor: '#E0E0E0' },
  settingsHandle: { width: 36, height: 4, backgroundColor: '#DDDDDD', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  settingsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  settingsPlate: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', letterSpacing: 2 },
  settingsSubtitle: { fontSize: 12, color: '#999', marginTop: 2 },
  settingsCloseBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center' },
  settingsCloseBtnText: { fontSize: 14, color: '#888', fontWeight: '700' },
  settingsSectionLabel: { fontSize: 10, fontWeight: '700', color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  settingsInfoCard: { backgroundColor: '#F8F8F8', borderRadius: 14, borderWidth: 1, borderColor: '#EEEEEE', marginBottom: 20, overflow: 'hidden' },
  settingsInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  settingsInfoRowBorder: { borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
  settingsInfoLabel: { fontSize: 13, color: '#888888', fontWeight: '500' },
  settingsInfoValue: { fontSize: 13, color: '#1A1A1A', fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  settingsToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13 },
  settingsToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingsToggleIcon: { fontSize: 20 },
  settingsToggleLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingsToggleLabel: { fontSize: 14, color: '#1A1A1A', fontWeight: '600' },
  settingsToggleSub: { fontSize: 11, color: '#AAAAAA', marginTop: 2 },
  freeBadge: { backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  freeBadgeText: { fontSize: 9, fontWeight: '800', color: '#10B981', letterSpacing: 0.5 },
  paidBadge: { backgroundColor: 'rgba(124,58,237,0.1)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.25)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  paidBadgeText: { fontSize: 9, fontWeight: '800', color: '#7C3AED', letterSpacing: 0.5 },
});


