import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomModal from './CustomModal';

const BACKEND = 'https://api.vahanping.com';
const COLORS = ['White', 'Black', 'Silver', 'Red', 'Blue', 'Grey', 'Green', 'Yellow', 'Orange', 'Other'];
const VEHICLE_TYPES = ['Car', 'Bike', 'Scooter', 'Van', 'Truck', 'Auto Rickshaw', 'Bus', 'Other'];

// ── Icons ────────────────────────────────────────────────────────
const StickerIcon = ({ size = 20, color = '#555' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="2" width="20" height="20" rx="4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M7 7h3v3H7zM14 7h3v3h-3zM7 14h3v3H7z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M14 14h3v3h-3z" fill={color}/>
  </Svg>
);

const TagIcon = ({ size = 20, color = '#555' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Line x1="7" y1="7" x2="7.01" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

const PhoneIcon = ({ size = 20, color = '#555' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a2 2 0 011.72-2.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 15.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7a2 2 0 011.72 2.03z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const TruckIcon = ({ size = 20, color = '#555' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="1.5"/>
    <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="1.5"/>
  </Svg>
);

const PaletteIcon = ({ size = 20, color = '#555' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
    <Circle cx="8.5" cy="9" r="1.5" fill={color}/>
    <Circle cx="15.5" cy="9" r="1.5" fill={color}/>
    <Circle cx="12" cy="15" r="1.5" fill={color}/>
  </Svg>
);

const InfoIcon = ({ size = 16, color = '#555' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
    <Line x1="12" y1="8" x2="12" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Line x1="12" y1="16" x2="12.01" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

const CheckIcon = ({ size = 12, color = '#9D65F5' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ChevronDownIcon = ({ size = 18, color = '#999', rotated = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={rotated ? { transform: [{ rotate: '180deg' }] } : {}}>
    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const BackIcon = ({ size = 22, color = '#1A1A1A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 5l-7 7 7 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export default function ActivateStickerScreen({ navigation }) {
  // Step 1 — token entry
  const [token, setToken]           = useState('');
  const [tokenChecked, setTokenChecked] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState('');

  // Step 2 — vehicle details
  const [plate, setPlate]           = useState('');
  const [model, setModel]           = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [typeOpen, setTypeOpen]     = useState(false);
  const [color, setColor]           = useState('');
  const [phone, setPhone]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [modal, setModal]           = useState({ visible: false, icon: '', title: '', message: '', buttons: [] });

  const showModal = (icon, title, message, buttons) => setModal({ visible: true, icon, title, message, buttons });
  const closeModal = () => setModal(m => ({ ...m, visible: false }));

  // Validate token against backend
  const handleCheckToken = async () => {
    const t = token.trim();
    if (!t) { setTokenError('Please enter the code from your sticker.'); return; }
    setTokenLoading(true);
    setTokenError('');
    try {
      const res = await fetch(`${BACKEND}/api/v1/contact/scan/${encodeURIComponent(t)}`);
      const data = await res.json();
      if (data.status === 'unregistered') {
        setTokenChecked(true);
      } else if (data.status === 'active') {
        setTokenError('This sticker is already activated for a vehicle.');
      } else if (res.status === 404) {
        setTokenError('Token not found. Check the code printed on your sticker.');
      } else {
        setTokenError(data.error || 'Something went wrong. Try again.');
      }
    } catch {
      setTokenError('Network error. Check your connection and try again.');
    }
    setTokenLoading(false);
  };

  const handleActivate = async () => {
    if (!plate.trim() || plate.trim().length < 4)
      return showModal('', 'Required', 'Please enter a valid license plate (min 4 characters).', [{ text: 'OK', style: 'primary', onPress: closeModal }]);
    if (!vehicleType)
      return showModal('', 'Required', 'Please select your vehicle type.', [{ text: 'OK', style: 'primary', onPress: closeModal }]);
    if (!color)
      return showModal('', 'Required', 'Please select your vehicle color.', [{ text: 'OK', style: 'primary', onPress: closeModal }]);
    if (!phone.trim())
      return showModal('', 'Required', 'Please enter your phone number for alerts.', [{ text: 'OK', style: 'primary', onPress: closeModal }]);
    if (phone.length !== 10)
      return showModal('', 'Invalid', 'Please enter a valid 10-digit phone number.', [{ text: 'OK', style: 'primary', onPress: closeModal }]);

    setLoading(true);
    try {
      const fullPhone = '+91' + phone.trim();
      const res = await fetch(`${BACKEND}/api/v1/qr/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          plate: plate.trim().toUpperCase(),
          model: model.trim() || 'Vehicle',
          vehicle_type: vehicleType,
          color,
          phone: fullPhone,
          call_enabled: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showModal('', 'Error', data.error || 'Activation failed. Please try again.', [{ text: 'OK', style: 'primary', onPress: closeModal }]);
        return;
      }

      // Save vehicle locally
      const vehicleId = generateId();
      const newVehicle = {
        id: vehicleId,
        plate: plate.trim().toUpperCase(),
        nickname: plate.trim().toUpperCase(),
        model: model.trim() || 'Vehicle',
        vehicleType,
        color,
        phone: fullPhone,
        call_enabled: false,
        token: data.token,
        registeredAt: new Date().toISOString(),
      };
      const stored = await AsyncStorage.getItem('vehicles');
      const existing = stored ? JSON.parse(stored) : [];
      await AsyncStorage.setItem('vehicles', JSON.stringify([...existing, newVehicle]));

      // Sync push token
      const pushToken = await AsyncStorage.getItem('expo_push_token');
      if (pushToken && data.token) {
        fetch(`${BACKEND}/api/v1/push-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qr_token: data.token, push_token: pushToken }),
        }).catch(() => {});
      }

      // Reset all form state before navigating so the screen is fresh if revisited
      setToken('');
      setTokenChecked(false);
      setTokenError('');
      setPlate('');
      setModel('');
      setVehicleType('');
      setTypeOpen(false);
      setColor('');
      setPhone('');

      navigation.navigate('Home');
    } catch {
      showModal('', 'Error', 'Something went wrong. Please try again.', [{ text: 'OK', style: 'primary', onPress: closeModal }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <CustomModal visible={modal.visible} icon={modal.icon} title={modal.title} message={modal.message} buttons={modal.buttons} onClose={closeModal} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
              <BackIcon size={20} color="#1A1A1A" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>Activate Sticker</Text>
              <Text style={s.headerSub}>Link your QR sticker to your vehicle</Text>
            </View>
          </View>

          {/* Info strip */}
          <View style={s.infoStrip}>
            <InfoIcon size={14} color="#9D65F5" />
            <Text style={s.infoText}>Enter the unique code printed on your VahanPing sticker to activate it</Text>
          </View>

          {/* Step 1 — Token entry */}
          <View style={s.stepCard}>
            <View style={s.stepBody}>
              <View style={s.sectionHeader}>
                <StickerIcon size={15} color="#555" />
                <Text style={s.sectionLabel}>Sticker Code</Text>
                {tokenChecked && (
                  <View style={s.verifiedPill}>
                    <CheckIcon size={10} color="#059669" />
                    <Text style={s.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>

              <View style={s.tokenRow}>
                <TextInput
                  style={[s.tokenInput, focusedField === 'token' && s.inputFocused, tokenChecked && s.inputVerified]}
                  placeholder="e.g. VP-A3X9K2"
                  placeholderTextColor="#AAAAAA"
                  value={token}
                  onChangeText={t => { setToken(t); setTokenChecked(false); setTokenError(''); }}
                  onFocus={() => setFocusedField('token')}
                  onBlur={() => setFocusedField('')}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!tokenChecked}
                />
                {!tokenChecked && (
                  <TouchableOpacity style={s.verifyBtn} onPress={handleCheckToken} disabled={tokenLoading}>
                    {tokenLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.verifyBtnText}>Verify</Text>}
                  </TouchableOpacity>
                )}
              </View>

              {tokenError ? <Text style={s.errorText}>{tokenError}</Text> : null}
              <Text style={s.fieldHint}>Find this code on the back of your sticker or in the packaging.</Text>
            </View>
          </View>

          {/* Step 2 — Vehicle details (shown only after token verified) */}
          {tokenChecked && (
            <View style={s.stepCard}>
              <View style={[s.stepBody, { flex: 1 }]}>
                <Text style={s.stepTitle}>Vehicle Details</Text>

                {/* License plate */}
                <View style={s.section}>
                  <View style={s.sectionHeader}>
                    <TagIcon size={15} color="#555" />
                    <Text style={s.sectionLabel}>License Plate</Text>
                    <Text style={s.required}>Required</Text>
                  </View>
                  <TextInput
                    style={[s.plateInput, focusedField === 'plate' && s.inputFocused]}
                    placeholder="KL 01 AB 1234"
                    placeholderTextColor="#AAAAAA"
                    value={plate}
                    onChangeText={t => { const c = t.replace(/[^A-Z0-9]/g, ''); if (c.length <= 10) setPlate(c); }}
                    onFocus={() => setFocusedField('plate')}
                    onBlur={() => setFocusedField('')}
                    autoCapitalize="characters"
                    maxLength={10}
                  />
                </View>

                {/* Vehicle type */}
                <View style={s.section}>
                  <View style={s.sectionHeader}>
                    <TruckIcon size={15} color="#555" />
                    <Text style={s.sectionLabel}>Vehicle Type</Text>
                    <Text style={s.required}>Required</Text>
                  </View>
                  <TouchableOpacity
                    style={[s.dropdownTrigger, typeOpen && s.dropdownTriggerOpen, vehicleType && s.dropdownTriggerSelected]}
                    onPress={() => setTypeOpen(o => !o)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.dropdownTriggerText, vehicleType && s.dropdownTriggerTextSelected]}>
                      {vehicleType || 'Select vehicle type'}
                    </Text>
                    <ChevronDownIcon size={18} color={vehicleType ? '#7C3AED' : '#AAAAAA'} rotated={typeOpen} />
                  </TouchableOpacity>
                  {typeOpen && (
                    <View style={s.dropdownList}>
                      {VEHICLE_TYPES.map((type, idx) => (
                        <TouchableOpacity
                          key={type}
                          style={[s.dropdownItem, vehicleType === type && s.dropdownItemActive, idx === VEHICLE_TYPES.length - 1 && s.dropdownItemLast]}
                          onPress={() => { setVehicleType(type); setTypeOpen(false); }}
                          activeOpacity={0.6}
                        >
                          <Text style={[s.dropdownItemText, vehicleType === type && s.dropdownItemTextActive]}>{type}</Text>
                          {vehicleType === type && <CheckIcon size={13} color="#7C3AED" />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Model */}
                <View style={s.section}>
                  <View style={s.sectionHeader}>
                    <TruckIcon size={15} color="#555" />
                    <Text style={s.sectionLabel}>Vehicle Model</Text>
                    <Text style={s.optional}>Optional</Text>
                  </View>
                  <TextInput
                    style={[s.input, focusedField === 'model' && s.inputFocused]}
                    placeholder="e.g. Maruti Swift"
                    placeholderTextColor="#AAAAAA"
                    value={model}
                    onChangeText={setModel}
                    onFocus={() => setFocusedField('model')}
                    onBlur={() => setFocusedField('')}
                  />
                </View>

                {/* Color */}
                <View style={s.section}>
                  <View style={s.sectionHeader}>
                    <PaletteIcon size={15} color="#555" />
                    <Text style={s.sectionLabel}>Vehicle Color</Text>
                    <Text style={s.required}>Required</Text>
                  </View>
                  <View style={s.colorGrid}>
                    {COLORS.map(c => (
                      <TouchableOpacity key={c} style={[s.colorChip, color === c && s.colorChipActive]} onPress={() => setColor(c)}>
                        {color === c && <CheckIcon size={11} color="#9D65F5" />}
                        <Text style={[s.colorChipText, color === c && s.colorChipTextActive]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Phone */}
                <View style={s.section}>
                  <View style={s.sectionHeader}>
                    <PhoneIcon size={15} color="#555" />
                    <Text style={s.sectionLabel}>Alert Phone Number</Text>
                    <Text style={s.required}>Required</Text>
                  </View>
                  <View style={s.phoneRow}>
                    <View style={s.countryCode}>
                      <Text style={s.countryCodeText}>+91</Text>
                    </View>
                    <TextInput
                      style={[s.input, { flex: 1, marginLeft: 8 }, focusedField === 'phone' && s.inputFocused]}
                      placeholder="98765 43210"
                      placeholderTextColor="#AAAAAA"
                      value={phone}
                      onChangeText={t => { const c = t.replace(/[^0-9]/g, ''); if (c.length <= 10) setPhone(c); }}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField('')}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>
                  <Text style={s.fieldHint}>Used only for receiving alerts. Never shared publicly.</Text>
                </View>

                <TouchableOpacity style={[s.submitBtn, loading && s.submitBtnDisabled]} onPress={handleActivate} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Activate Sticker</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { padding: 20, paddingBottom: 90 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 10, marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.5 },
  headerSub: { color: '#999999', fontSize: 12, marginTop: 2 },

  infoStrip: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(124,58,237,0.06)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.12)', borderRadius: 10, padding: 12, marginBottom: 24 },
  infoText: { color: '#888888', fontSize: 12, flex: 1, lineHeight: 18 },

  stepCard: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  stepBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  stepNum: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },

  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionLabel: { color: '#777777', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, flex: 1 },
  required: { color: '#AAAAAA', fontSize: 10, fontWeight: '600' },
  optional: { color: '#BBBBBB', fontSize: 10, fontWeight: '600' },

  verifiedPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#BBF7D0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  verifiedText: { color: '#059669', fontSize: 10, fontWeight: '700' },

  tokenRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  tokenInput: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, color: '#1A1A1A', fontSize: 13, borderWidth: 1, borderColor: '#E0E0E0', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  inputFocused: { borderColor: '#7C3AED' },
  inputVerified: { borderColor: '#059669', backgroundColor: '#F0FDF4' },
  verifyBtn: { backgroundColor: '#7C3AED', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', minWidth: 80 },
  verifyBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 6 },
  fieldHint: { color: '#AAAAAA', fontSize: 11, marginTop: 8 },

  plateInput: { backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 18, color: '#1A1A1A', fontSize: 24, fontWeight: '800', letterSpacing: 6, textAlign: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  input: { backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#1A1A1A', fontSize: 14, borderWidth: 1, borderColor: '#E0E0E0' },
  phoneRow: { flexDirection: 'row', alignItems: 'center' },
  countryCode: { backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1, borderColor: '#E0E0E0' },
  countryCodeText: { color: '#888888', fontSize: 14, fontWeight: '600' },

  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#F5F5F5' },
  colorChipActive: { borderColor: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.08)' },
  colorChipText: { color: '#999999', fontSize: 13 },
  colorChipTextActive: { color: '#9D65F5', fontWeight: '600' },

  // Dropdown
  dropdownTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#E0E0E0' },
  dropdownTriggerOpen: { borderColor: '#7C3AED', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  dropdownTriggerSelected: { borderColor: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.04)' },
  dropdownTriggerText: { fontSize: 14, color: '#AAAAAA' },
  dropdownTriggerTextSelected: { color: '#1A1A1A', fontWeight: '600' },
  dropdownList: { backgroundColor: '#FFFFFF', borderWidth: 1, borderTopWidth: 0, borderColor: '#7C3AED', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, overflow: 'hidden' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  dropdownItemLast: { borderBottomWidth: 0 },
  dropdownItemActive: { backgroundColor: 'rgba(124,58,237,0.06)' },
  dropdownItemText: { fontSize: 14, color: '#555555' },
  dropdownItemTextActive: { color: '#7C3AED', fontWeight: '600' },

  submitBtn: { backgroundColor: '#7C3AED', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
});
