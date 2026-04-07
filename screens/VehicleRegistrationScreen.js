import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomModal from './CustomModal';

const BACKEND = 'https://api.vahanping.com';
const COLORS = ['White', 'Black', 'Silver', 'Red', 'Blue', 'Grey', 'Green', 'Yellow', 'Orange', 'Other'];

const CarIcon = ({ size = 20, color = '#555' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 17H3a2 2 0 01-2-2v-4l2.5-6h13L19 11v4a2 2 0 01-2 2h-2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx="7.5" cy="17.5" r="2.5" stroke={color} strokeWidth="1.5"/>
    <Circle cx="16.5" cy="17.5" r="2.5" stroke={color} strokeWidth="1.5"/>
    <Path d="M5 11h14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const PhoneIcon = ({ size = 20, color = '#555' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a2 2 0 011.72-2.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 15.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7a2 2 0 011.72 2.03z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const TagIcon = ({ size = 20, color = '#555' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Line x1="7" y1="7" x2="7.01" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round"/>
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

const PhoneCallIcon = ({ size = 20, color = '#555' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15.05 5A5 5 0 0119 8.95M15.05 1A9 9 0 0123 8.94M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a2 2 0 011.72-2.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 15.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7a2 2 0 011.72 2.03z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export default function VehicleRegistrationScreen({ navigation }) {
  const [plate, setPlate] = useState('');
  const [nickname, setNickname] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [phone, setPhone] = useState('');
  const [callEnabled, setCallEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [modal, setModal] = useState({ visible: false, icon: '', title: '', message: '', buttons: [] });

  const showModal = (icon, title, message, buttons) => setModal({ visible: true, icon, title, message, buttons });
  const closeModal = () => setModal(m => ({ ...m, visible: false }));

  const handleRegister = async () => {
    if (!plate.trim() || plate.trim().length < 4) return showModal('⚠️', 'Required', 'Please enter a valid license plate (min 4 characters).', [{ text: 'OK', style: 'primary', onPress: closeModal }]);
    if (!phone.trim()) return showModal('⚠️', 'Required', 'Please enter your phone number for alerts.', [{ text: 'OK', style: 'primary', onPress: closeModal }]);
    if (phone.length !== 10) return showModal('⚠️', 'Invalid', 'Please enter a valid 10 digit phone number.', [{ text: 'OK', style: 'primary', onPress: closeModal }]);
    if (!color) return showModal('⚠️', 'Required', 'Please select your vehicle color.', [{ text: 'OK', style: 'primary', onPress: closeModal }]);

    setLoading(true);
    try {
      const fullPhone = '+91' + phone.trim();
      const vehicleId = generateId();
      const newVehicle = {
        id: vehicleId,
        plate: plate.trim().toUpperCase(),
        nickname: nickname.trim() || plate.trim().toUpperCase(),
        model: model.trim() || 'Vehicle',
        color,
        phone: fullPhone,
        call_enabled: callEnabled,
        token: vehicleId,
        registeredAt: new Date().toISOString(),
      };

      // Save locally first
      const stored = await AsyncStorage.getItem('vehicles');
      const existing = stored ? JSON.parse(stored) : [];
      await AsyncStorage.setItem('vehicles', JSON.stringify([...existing, newVehicle]));

      setPlate(''); setNickname(''); setModel(''); setColor(''); setPhone(''); setCallEnabled(false);

      showModal('🎉', 'Vehicle Registered!', `${newVehicle.plate} is now protected by VahanPing.`, [
        { text: 'View QR Code', style: 'primary', onPress: () => { closeModal(); navigation.navigate('QRCode', { vehicle: newVehicle }); } },
        { text: 'Go Home', onPress: () => { closeModal(); navigation.navigate('Home'); } },
      ]);

      // Sync to backend silently
      fetch(`${BACKEND}/api/v1/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate: newVehicle.plate,
          model: newVehicle.model,
          color,
          phone: fullPhone,
          call_enabled: callEnabled,
        }),
      }).then(async res => {
        if (res.ok) {
          const data = await res.json();
          // Update token if backend returns a different one
          if (data?.token && data.token !== vehicleId) {
            const s = await AsyncStorage.getItem('vehicles');
            const vs = s ? JSON.parse(s) : [];
            const updated = vs.map(v => v.id === vehicleId ? { ...v, token: data.token } : v);
            await AsyncStorage.setItem('vehicles', JSON.stringify(updated));
          }
          // ✅ Sync push token after vehicle registered
          const pushToken = await AsyncStorage.getItem('expo_push_token');
          const finalToken = data?.token || vehicleId;
          if (pushToken && finalToken) {
            fetch(`${BACKEND}/api/v1/push-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ qr_token: finalToken, push_token: pushToken })
            }).catch(() => {});
          }
        }
      }).catch(() => {});

    } catch (e) {
      showModal('❌', 'Error', 'Something went wrong. Please try again.', [
        { text: 'OK', style: 'primary', onPress: closeModal },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <CustomModal visible={modal.visible} icon={modal.icon} title={modal.title} message={modal.message} buttons={modal.buttons} onClose={closeModal} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={s.header}>
            <Text style={s.headerTitle}>Register Vehicle</Text>
            <Text style={s.headerSub}>Set up anonymous contact protection</Text>
          </View>

          <View style={s.infoStrip}>
            <InfoIcon size={14} color="#9D65F5" />
            <Text style={s.infoText}>Your phone number is never revealed to anyone who contacts you</Text>
          </View>

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

          <View style={s.section}>
            <View style={s.sectionHeader}>
              <CarIcon size={15} color="#555" />
              <Text style={s.sectionLabel}>Vehicle Details</Text>
              <Text style={s.optional}>Optional</Text>
            </View>
            <TextInput
              style={[s.input, focusedField === 'nickname' && s.inputFocused]}
              placeholder="Nickname  (e.g. My Swift)"
              placeholderTextColor="#AAAAAA"
              value={nickname}
              onChangeText={setNickname}
              onFocus={() => setFocusedField('nickname')}
              onBlur={() => setFocusedField('')}
            />
            <TextInput
              style={[s.input, { marginTop: 8 }, focusedField === 'model' && s.inputFocused]}
              placeholder="Car model  (e.g. Maruti Swift)"
              placeholderTextColor="#AAAAAA"
              value={model}
              onChangeText={setModel}
              onFocus={() => setFocusedField('model')}
              onBlur={() => setFocusedField('')}
            />
          </View>

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

          <View style={s.section}>
            <TouchableOpacity style={s.toggleCard} onPress={() => setCallEnabled(!callEnabled)} activeOpacity={0.7}>
              <View style={s.toggleLeft}>
                <View style={[s.toggleIconWrap, callEnabled && s.toggleIconWrapActive]}>
                  <PhoneCallIcon size={18} color={callEnabled ? '#9D65F5' : '#444'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.toggleTitle}>Anonymous Calls</Text>
                  <Text style={s.toggleSub}>Allow callers to reach you without revealing your number</Text>
                </View>
              </View>
              <View style={[s.toggle, callEnabled && s.toggleActive]}>
                <View style={[s.toggleThumb, callEnabled && s.toggleThumbActive]} />
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[s.submitBtn, loading && s.submitBtnDisabled]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Register & Get QR Code</Text>}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { padding: 20, paddingBottom: 90 },
  header: { paddingTop: 10, marginBottom: 20 },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.5 },
  headerSub: { color: '#999999', fontSize: 13, marginTop: 4 },
  infoStrip: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(124,58,237,0.06)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.12)', borderRadius: 10, padding: 12, marginBottom: 24 },
  infoText: { color: '#888888', fontSize: 12, flex: 1, lineHeight: 18 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionLabel: { color: '#777777', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, flex: 1 },
  required: { color: '#AAAAAA', fontSize: 10, fontWeight: '600' },
  optional: { color: '#2A2A2A', fontSize: 10, fontWeight: '600' },
  plateInput: { backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 18, color: '#1A1A1A', fontSize: 24, fontWeight: '800', letterSpacing: 6, textAlign: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  input: { backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#1A1A1A', fontSize: 14, borderWidth: 1, borderColor: '#E0E0E0' },
  inputFocused: { borderColor: '#7C3AED' },
  phoneRow: { flexDirection: 'row', alignItems: 'center' },
  countryCode: { backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1, borderColor: '#E0E0E0' },
  countryCodeText: { color: '#888888', fontSize: 14, fontWeight: '600' },
  fieldHint: { color: '#2A2A2A', fontSize: 11, marginTop: 8 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#F5F5F5' },
  colorChipActive: { borderColor: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.08)' },
  colorChipText: { color: '#999999', fontSize: 13 },
  colorChipTextActive: { color: '#9D65F5', fontWeight: '600' },
  toggleCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  toggleIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center' },
  toggleIconWrapActive: { backgroundColor: 'rgba(124,58,237,0.1)' },
  toggleTitle: { color: '#444444', fontSize: 14, fontWeight: '600' },
  toggleSub: { color: '#999999', fontSize: 11, marginTop: 2 },
  toggle: { width: 44, height: 26, borderRadius: 13, backgroundColor: '#CCCCCC', borderWidth: 1, borderColor: '#DDDDDD', justifyContent: 'center', paddingHorizontal: 3 },
  toggleActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  toggleThumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFFFFF' },
  toggleThumbActive: { backgroundColor: '#FFFFFF', alignSelf: 'flex-end' },
  submitBtn: { backgroundColor: '#7C3AED', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
});
