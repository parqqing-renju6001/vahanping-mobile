import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomModal from './CustomModal';

const BACKEND = 'https://parkping-wwur.onrender.com';
const COLORS = ['White', 'Black', 'Silver', 'Red', 'Blue', 'Grey', 'Green', 'Yellow', 'Orange', 'Other'];

export default function VehicleRegistrationScreen({ navigation }) {
  const [plate, setPlate] = useState('');
  const [nickname, setNickname] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [phone, setPhone] = useState('');
  const [callEnabled, setCallEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  // Custom modal state
  const [modal, setModal] = useState({ visible: false, icon: '', title: '', message: '', buttons: [] });

  const showModal = (icon, title, message, buttons) => {
    setModal({ visible: true, icon, title, message, buttons });
  };
  const closeModal = () => setModal(m => ({ ...m, visible: false }));

  const handleRegister = async () => {
    if (!plate.trim()) return showModal('⚠️', 'Required', 'Please enter your license plate number.', [{ text: 'OK', style: 'primary', onPress: closeModal }]);
    if (!phone.trim()) return showModal('⚠️', 'Required', 'Please enter your phone number for alerts.', [{ text: 'OK', style: 'primary', onPress: closeModal }]);
    if (phone.length !== 10) return showModal('⚠️', 'Invalid', 'Please enter a valid 10 digit phone number.', [{ text: 'OK', style: 'primary', onPress: closeModal }]);
    if (!color) return showModal('⚠️', 'Required', 'Please select your vehicle color.', [{ text: 'OK', style: 'primary', onPress: closeModal }]);

    setLoading(true);
    try {
      const fullPhone = '+91' + phone.trim();

      const response = await fetch(`${BACKEND}/api/v1/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate: plate.trim().toUpperCase(),
          model: model.trim(),
          color,
          phone: fullPhone,
          call_enabled: callEnabled,
        }),
      });

      let backendData = null;
      if (response.ok) {
        backendData = await response.json();
      }

      const vehicleId = backendData?.id || backendData?.token || generateId();
      const newVehicle = {
        id: vehicleId,
        plate: plate.trim().toUpperCase(),
        nickname: nickname.trim() || plate.trim().toUpperCase(),
        model: model.trim() || 'Vehicle',
        color,
        phone: fullPhone,
        call_enabled: callEnabled,
        token: backendData?.token || vehicleId,
        registeredAt: new Date().toISOString(),
      };

      const stored = await AsyncStorage.getItem('vehicles');
      const existing = stored ? JSON.parse(stored) : [];
      await AsyncStorage.setItem('vehicles', JSON.stringify([...existing, newVehicle]));

      setPlate(''); setNickname(''); setModel(''); setColor(''); setPhone(''); setCallEnabled(false);

      showModal('🎉', 'Vehicle Registered!', `${newVehicle.plate} is now live on VahanPing. Get your QR sticker!`, [
        { text: 'View QR Code', style: 'primary', onPress: () => { closeModal(); navigation.navigate('QRCode', { vehicle: newVehicle }); } },
        { text: 'Go Home', onPress: () => { closeModal(); navigation.navigate('Home'); } },
      ]);

    } catch (e) {
      const vehicleId = generateId();
      const newVehicle = {
        id: vehicleId,
        plate: plate.trim().toUpperCase(),
        nickname: nickname.trim() || plate.trim().toUpperCase(),
        model: model.trim() || 'Vehicle',
        color,
        phone: '+91' + phone.trim(),
        call_enabled: callEnabled,
        token: vehicleId,
        registeredAt: new Date().toISOString(),
      };

      const stored = await AsyncStorage.getItem('vehicles');
      const existing = stored ? JSON.parse(stored) : [];
      await AsyncStorage.setItem('vehicles', JSON.stringify([...existing, newVehicle]));

      showModal('✅', 'Saved Locally', `Vehicle saved. It will sync when you're online.`, [
        { text: 'View QR Code', style: 'primary', onPress: () => { closeModal(); navigation.navigate('QRCode', { vehicle: newVehicle }); } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomModal
        visible={modal.visible}
        icon={modal.icon}
        title={modal.title}
        message={modal.message}
        buttons={modal.buttons}
        onClose={closeModal}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Register Vehicle</Text>
            <Text style={styles.headerSub}>Get a QR sticker for your car window</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>How VahanPing works</Text>
            <Text style={styles.infoText}>
              📋 Register your car below{'\n'}
              📲 Get a QR code to print as a sticker{'\n'}
              🚗 Stick it on your windshield{'\n'}
              🔔 People scan it to contact you anonymously
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>License Plate *</Text>
              <TextInput
                style={[styles.input, styles.plateInput]}
                placeholder="KL01AB1234"
                placeholderTextColor="#444"
                value={plate}
                onChangeText={t => {
                  const cleaned = t.replace(/[^A-Z0-9]/g, '');
                  if (cleaned.length <= 10) setPlate(cleaned);
                }}
                autoCapitalize="characters"
                maxLength={10}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Nickname (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. My Swift, Dad's Car"
                placeholderTextColor="#444"
                value={nickname}
                onChangeText={setNickname}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Car Model</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Maruti Swift, Honda City"
                placeholderTextColor="#444"
                value={model}
                onChangeText={setModel}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Color *</Text>
              <View style={styles.colorGrid}>
                {COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorChip, color === c && styles.colorChipActive]}
                    onPress={() => setColor(c)}
                  >
                    <Text style={[styles.colorChipText, color === c && styles.colorChipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Phone Number *</Text>
              <Text style={styles.labelHint}>Used for urgent alerts only — never shown publicly</Text>
              <View style={styles.phoneRow}>
                <View style={styles.phonePrefix}>
                  <Text style={styles.phonePrefixText}>+91</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.phoneInput]}
                  placeholder="98765 43210"
                  placeholderTextColor="#444"
                  value={phone}
                  onChangeText={text => {
                    const cleaned = text.replace(/[^0-9]/g, '');
                    if (cleaned.length <= 10) setPhone(cleaned);
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>

            <View style={styles.field}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.label}>Enable Anonymous Calls 📞</Text>
                  <Text style={styles.labelHint}>Allow people to call you anonymously via VahanPing</Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggle, callEnabled && styles.toggleActive]}
                  onPress={() => setCallEnabled(!callEnabled)}
                >
                  <Text style={styles.toggleText}>{callEnabled ? 'ON' : 'OFF'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Register & Get QR Code →</Text>}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  scroll: { padding: 20, paddingBottom: 90 },
  header: { marginBottom: 20, paddingTop: 10 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  headerSub: { color: '#666', fontSize: 14, marginTop: 4 },
  infoBox: {
    backgroundColor: '#12121A', borderRadius: 14, padding: 16,
    marginBottom: 24, borderLeftWidth: 3, borderLeftColor: '#7C3AED',
  },
  infoTitle: { color: '#7C3AED', fontWeight: '700', fontSize: 13, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  infoText: { color: '#AAA', fontSize: 14, lineHeight: 24 },
  form: { gap: 20 },
  field: { marginBottom: 4 },
  label: { color: '#CCC', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  labelHint: { color: '#555', fontSize: 12, marginBottom: 8, marginTop: -4 },
  input: {
    backgroundColor: '#12121A', borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 14, color: '#FFF', fontSize: 15, borderWidth: 1, borderColor: '#22223A',
  },
  plateInput: { fontSize: 20, fontWeight: '800', letterSpacing: 3, textAlign: 'center', color: '#7C3AED' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  phonePrefix: {
    backgroundColor: '#12121A', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 14, borderWidth: 1, borderColor: '#22223A',
  },
  phonePrefixText: { color: '#7C3AED', fontSize: 15, fontWeight: '700' },
  phoneInput: { flex: 1 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#22223A', backgroundColor: '#12121A' },
  colorChipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  colorChipText: { color: '#888', fontSize: 13, fontWeight: '600' },
  colorChipTextActive: { color: '#FFF' },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#12121A', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#22223A',
  },
  toggleInfo: { flex: 1, marginRight: 16 },
  toggle: { backgroundColor: '#1A1A26', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, minWidth: 60, alignItems: 'center' },
  toggleActive: { backgroundColor: '#7C3AED' },
  toggleText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  submitBtn: { backgroundColor: '#7C3AED', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});
