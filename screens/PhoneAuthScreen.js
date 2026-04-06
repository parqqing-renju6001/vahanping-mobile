import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
  KeyboardAvoidingView, Platform, Image
} from 'react-native';
// WhatsApp OTP auth
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND = 'https://parkping-wwur.onrender.com';

export default function PhoneAuthScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const otpRef = useRef(null);

  const sendOTP = async () => {
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND}/api/v1/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${phone}` }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('otp');
        setTimeout(() => otpRef.current?.focus(), 300);
      } else {
        setError(data.error || 'Failed to send OTP. Please try again.');
      }
    } catch (e) {
      console.log('OTP send error:', e);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND}/api/v1/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${phone}`, otp }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Invalid OTP. Please try again.');
        setLoading(false);
        return;
      }
      const userPhone = data.phone; // +91XXXXXXXXXX

      // Save phone to AsyncStorage
      await AsyncStorage.setItem('user_phone', userPhone);
      await AsyncStorage.setItem('auth_done', 'true');

      // Sync push token and vehicles to backend linked to phone
      const pushToken = await AsyncStorage.getItem('expo_push_token');
      const stored = await AsyncStorage.getItem('vehicles');
      const vehicles = stored ? JSON.parse(stored) : [];

      // Register phone with backend
      await fetch(`${BACKEND}/api/v1/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: userPhone,
          push_token: pushToken || '',
          vehicles: vehicles.map(v => v.token),
        }),
      }).catch(e => console.log('Register error:', e));

      // Fetch vehicles from backend and restore to AsyncStorage
      try {
        const vRes = await fetch(`${BACKEND}/api/v1/user/vehicles/${encodeURIComponent(userPhone)}`);
        const vData = await vRes.json();
        if (vData.vehicles && vData.vehicles.length > 0) {
          const existing = await AsyncStorage.getItem('vehicles');
          const local = existing ? JSON.parse(existing) : [];
          // Merge backend vehicles with local ones
          const merged = [...local];
          for (const bv of vData.vehicles) {
            if (!merged.find(lv => lv.token === bv.qr_token)) {
              merged.push({ id: bv.qr_token, plate: bv.plate, model: bv.model, color: bv.color, token: bv.qr_token });
            }
          }
          await AsyncStorage.setItem('vehicles', JSON.stringify(merged));
        }
      } catch (e) { console.log('Vehicle restore error:', e); }

      navigation.replace('MainTabs');
    } catch (e) {
      console.log('OTP verify error:', e);
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={s.content}>

          {/* Logo */}
          <View style={s.logoWrap}>
            <Image source={require('../assets/icon.png')} style={s.logoIcon} resizeMode="contain" />
            <Text style={s.appName}>VahanPing</Text>
            <Text style={s.appTagline}>Vehicle Protection</Text>
          </View>

          {step === 'phone' ? (
            <View style={s.form}>
              <Text style={s.title}>Enter your mobile number</Text>
              <Text style={s.subtitle}>We'll send you an OTP via WhatsApp</Text>

              <View style={s.phoneRow}>
                <View style={s.countryCode}>
                  <Text style={s.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={s.phoneInput}
                  placeholder="98765 43210"
                  placeholderTextColor="#AAAAAA"
                  value={phone}
                  onChangeText={t => { setPhone(t.replace(/[^0-9]/g, '')); setError(''); }}
                  keyboardType="phone-pad"
                  maxLength={10}
                  autoFocus
                />
              </View>

              {error ? <Text style={s.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[s.btn, (loading || phone.length !== 10) && s.btnDisabled]}
                onPress={sendOTP}
                disabled={loading || phone.length !== 10}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnText}>Send OTP →</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.form}>
              <Text style={s.title}>Enter verification code</Text>
              <Text style={s.subtitle}>Sent to your WhatsApp: +91 {phone}</Text>

              <TextInput
                ref={otpRef}
                style={s.otpInput}
                placeholder="• • • • • •"
                placeholderTextColor="#AAAAAA"
                value={otp}
                onChangeText={t => { setOtp(t.replace(/[^0-9]/g, '')); setError(''); }}
                keyboardType="phone-pad"
                maxLength={6}
                autoFocus
              />

              {error ? <Text style={s.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[s.btn, (loading || otp.length !== 6) && s.btnDisabled]}
                onPress={verifyOTP}
                disabled={loading || otp.length !== 6}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnText}>Verify & Continue →</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setStep('phone'); setOtp(''); setError(''); }} style={s.backBtn}>
                <Text style={s.backBtnText}>← Change number</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={s.disclaimer}>
            Your number is used only for vehicle alerts.{'\n'}Never shared publicly.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, padding: 28, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 48 },
  logoIcon: { width: 72, height: 72, borderRadius: 18, marginBottom: 12 },
  logoText: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  appName: { fontSize: 26, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  appTagline: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  form: { marginBottom: 32 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 28, lineHeight: 22 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  countryCode: { backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  countryCodeText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  phoneInput: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 16, fontSize: 18, fontWeight: '600', borderWidth: 1, borderColor: '#E5E7EB', color: '#111827', letterSpacing: 2 },
  otpInput: { backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 20, fontSize: 28, fontWeight: '700', borderWidth: 1, borderColor: '#E5E7EB', color: '#111827', letterSpacing: 12, textAlign: 'center', marginBottom: 16 },
  error: { color: '#DC2626', fontSize: 13, marginBottom: 16, fontWeight: '500' },
  btn: { backgroundColor: '#7C3AED', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  backBtn: { alignItems: 'center', marginTop: 16 },
  backBtnText: { color: '#7C3AED', fontSize: 14, fontWeight: '600' },
  disclaimer: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
});
