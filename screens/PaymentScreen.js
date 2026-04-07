import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Modal, TextInput, ActivityIndicator
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RAZORPAY_KEY = 'rzp_test_SUHS20b7ZKOzJ5';
const BACKEND = 'https://api.vahanping.com';

const INDIVIDUAL_PLANS = [
  { id: 'whatsapp', icon: '💬', name: 'WhatsApp Alerts', price: 99,  description: 'Instant WhatsApp notification when someone scans your QR', highlight: 'Most Popular', needsAddress: false },
  { id: 'call',     icon: '📞', name: 'Anonymous Call',  price: 199, description: 'Masked call so people reach you without knowing your number', highlight: null, needsAddress: false },
  { id: 'sticker',  icon: '📦', name: 'QR Sticker',      price: 199, description: 'Premium weatherproof QR sticker delivered to your door', highlight: null, needsAddress: true },
  { id: 'sms',      icon: '📩', name: 'SMS Alerts',      price: 199, description: 'Get SMS notifications when your vehicle is contacted', highlight: null, needsAddress: false },
];

const BUNDLE = { id: 'bundle', name: 'Complete Protection Bundle', price: 399, needsAddress: true };
const EMPTY_ADDRESS = { name: '', phone: '', line1: '', city: '', state: '', pincode: '' };

export default function PaymentScreen({ navigation, route }) {
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState({ visible: false, planName: '', paymentId: '' });
  const [failModal, setFailModal] = useState({ visible: false, planName: '' });
  const [alertModal, setAlertModal] = useState({ visible: false, message: '' });
  const [addressModal, setAddressModal] = useState({ visible: false, plan: null });
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // Auto-open address modal if coming from sticker designer
  useEffect(() => {
    if (route?.params?.autoOpenPlan === 'sticker') {
      const stickerPlan = INDIVIDUAL_PLANS.find(p => p.id === 'sticker');
      if (stickerPlan) setTimeout(() => openAddressModal(stickerPlan), 300);
    }
  }, []);

  const showAlert = (message) => setAlertModal({ visible: true, message });
  const openAddressModal = (plan) => { setAddress(EMPTY_ADDRESS); setAddressModal({ visible: true, plan }); };
  const closeAddressModal = () => setAddressModal({ visible: false, plan: null });
  const handleBuy = (plan) => { if (plan.needsAddress) openAddressModal(plan); else handlePayment(plan); };

  // Auto-populate city and state from pincode
  const handlePincodeChange = async (pin) => {
    setAddress(prev => ({ ...prev, pincode: pin, city: '', state: '' }));
    if (pin.length === 6) {
      setPincodeLoading(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await res.json();
        if (data[0]?.Status === 'Success') {
          const post = data[0].PostOffice[0];
          setAddress(prev => ({ ...prev, city: post.District || prev.city, state: post.State || prev.state }));
        }
      } catch (e) { console.log('Pincode lookup failed:', e); }
      finally { setPincodeLoading(false); }
    }
  };

  const submitAddressAndPay = async () => {
    if (!address.name.trim()) return showAlert('Please enter your full name');
    if (!address.phone.trim() || address.phone.length < 10) return showAlert('Please enter a valid 10-digit phone number');
    if (!address.line1.trim()) return showAlert('Please enter your address');
    if (!address.city.trim()) return showAlert('Please enter your city');
    if (!address.state.trim()) return showAlert('Please enter your state');
    if (!address.pincode.trim() || address.pincode.length !== 6) return showAlert('Please enter a valid 6-digit pincode');
    closeAddressModal();
    await handlePayment(addressModal.plan, address);
  };

  const handlePayment = async (plan, deliveryAddress = null) => {
    setLoading(true);
    try {
      const options = {
        description: plan.name,
        image: 'https://vahanping.com/logo.png',
        currency: 'INR',
        key: RAZORPAY_KEY,
        amount: plan.price * 100,
        name: 'VahanPing',
        prefill: { email: '', contact: deliveryAddress?.phone || '', name: deliveryAddress?.name || '' },
        theme: { color: '#7C3AED' },
      };
      const data = await RazorpayCheckout.open(options);
      if (deliveryAddress && (plan.id === 'sticker' || plan.id === 'bundle')) {
        try {
          await fetch(`${BACKEND}/api/v1/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              plan_id: plan.id,
              sticker_template: route?.params?.stickerTemplate || 'gold',
              vehicle_plate: route?.params?.vehiclePlate || '',
              qr_token: route?.params?.vehicleToken || '',
              name: deliveryAddress.name,
              phone: deliveryAddress.phone,
              address_line1: deliveryAddress.line1,
              city: deliveryAddress.city,
              state: deliveryAddress.state,
              pincode: deliveryAddress.pincode,
              amount: plan.price,
              payment_id: data.razorpay_payment_id,
            }),
          });
        } catch (e) { console.log('Order save error:', e); }
      }
      // Enable feature for all registered vehicles
      try {
        const stored = await AsyncStorage.getItem('vehicles');
        const vehicleList = stored ? JSON.parse(stored) : [];
        for (const v of vehicleList) {
          await fetch(`${BACKEND}/api/v1/enable-feature`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              qr_token: v.token,
              plan_id: plan.id,
              payment_id: data.razorpay_payment_id,
            }),
          });
        }
      } catch (e) { console.log('Enable feature error:', e); }

      setSuccessModal({ visible: true, planName: plan.name, paymentId: data.razorpay_payment_id });
    } catch (error) {
      if (error.code !== 2) setFailModal({ visible: true, planName: plan.name });
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Alert Modal */}
      <Modal transparent animationType="fade" visible={alertModal.visible} onRequestClose={() => setAlertModal({ visible: false, message: '' })}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconWrap, { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: '#F59E0B' }]}>
              <Text style={styles.modalIcon}>⚠️</Text>
            </View>
            <Text style={styles.modalTitle}>Required</Text>
            <Text style={styles.modalMsg}>{alertModal.message}</Text>
            <TouchableOpacity style={styles.modalBtnSuccess} onPress={() => setAlertModal({ visible: false, message: '' })}>
              <Text style={styles.modalBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal transparent animationType="fade" visible={successModal.visible} onRequestClose={() => setSuccessModal({ ...successModal, visible: false })}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconWrap, { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: '#10B981' }]}>
              <Text style={styles.modalIcon}>✅</Text>
            </View>
            <Text style={styles.modalTitle}>Payment Successful!</Text>
            <Text style={styles.modalMsg}>{successModal.planName} has been activated!</Text>
            {successModal.paymentId ? (
              <View style={styles.paymentIdBox}>
                <Text style={styles.paymentIdLabel}>Payment ID</Text>
                <Text style={styles.paymentIdValue} numberOfLines={1}>{successModal.paymentId}</Text>
              </View>
            ) : null}
            <TouchableOpacity style={styles.modalBtnSuccess} onPress={() => { setSuccessModal({ ...successModal, visible: false }); navigation.navigate('Home'); }}>
              <Text style={styles.modalBtnText}>Go to Home →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Fail Modal */}
      <Modal transparent animationType="fade" visible={failModal.visible} onRequestClose={() => setFailModal({ ...failModal, visible: false })}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconWrap, { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#EF4444' }]}>
              <Text style={styles.modalIcon}>❌</Text>
            </View>
            <Text style={styles.modalTitle}>Payment Failed</Text>
            <Text style={styles.modalMsg}>Something went wrong. Please try again.</Text>
            <View style={styles.modalBtnsRow}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setFailModal({ ...failModal, visible: false })}>
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnRetry} onPress={() => setFailModal({ ...failModal, visible: false })}>
                <Text style={styles.modalBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Address Modal */}
      <Modal transparent animationType="slide" visible={addressModal.visible} onRequestClose={closeAddressModal}>
        <View style={styles.addressOverlay}>
          <View style={styles.addressSheet}>
            <View style={styles.addressHandle} />
            <Text style={styles.addressTitle}>Delivery Address</Text>
            <Text style={styles.addressSub}>Where should we deliver your sticker?</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {[
                { key: 'name',  label: 'Full Name',     placeholder: 'Your Full Name',             keyboard: 'default',   max: undefined },
                { key: 'phone', label: 'Phone Number',  placeholder: '9876543210',            keyboard: 'phone-pad', max: 10 },
                { key: 'line1', label: 'Address',       placeholder: 'House No, Street, Area', keyboard: 'default',   max: undefined },
              ].map(field => (
                <View key={field.key} style={styles.addressField}>
                  <Text style={styles.addressFieldLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.addressInput}
                    placeholder={field.placeholder}
                    placeholderTextColor="#333"
                    value={address[field.key]}
                    onChangeText={t => setAddress(p => ({ ...p, [field.key]: t }))}
                    keyboardType={field.keyboard}
                    maxLength={field.max}
                  />
                </View>
              ))}

              {/* Pincode — auto-fills city & state */}
              <View style={styles.addressField}>
                <Text style={styles.addressFieldLabel}>Pincode</Text>
                <View>
                  <TextInput
                    style={styles.addressInput}
                    placeholder="680001"
                    placeholderTextColor="#333"
                    value={address.pincode}
                    onChangeText={handlePincodeChange}
                    keyboardType="phone-pad"
                    maxLength={6}
                  />
                  {pincodeLoading && <ActivityIndicator size="small" color="#7C3AED" style={{ position: 'absolute', right: 14, top: 14 }} />}
                </View>
              </View>

              {/* City — auto-filled */}
              <View style={styles.addressField}>
                <Text style={styles.addressFieldLabel}>City / District {address.city ? '✅' : ''}</Text>
                <TextInput style={styles.addressInput} placeholder="Thrissur" placeholderTextColor="#333" value={address.city} onChangeText={t => setAddress(p => ({ ...p, city: t }))} />
              </View>

              {/* State — auto-filled */}
              <View style={styles.addressField}>
                <Text style={styles.addressFieldLabel}>State {address.state ? '✅' : ''}</Text>
                <TextInput style={styles.addressInput} placeholder="Kerala" placeholderTextColor="#333" value={address.state} onChangeText={t => setAddress(p => ({ ...p, state: t }))} />
              </View>

              <View style={styles.orderSummaryBox}>
                <View style={styles.orderSummaryRow}>
                  <Text style={styles.orderSummaryLabel}>{addressModal.plan?.name}</Text>
                  <Text style={styles.orderSummaryValue}>₹{addressModal.plan?.price}</Text>
                </View>
                <View style={styles.orderSummaryRow}>
                  <Text style={styles.orderSummaryLabel}>Delivery</Text>
                  <Text style={{ color: '#7C3AED', fontSize: 14, fontWeight: '600' }}>Free</Text>
                </View>
                <View style={styles.orderSummaryDivider} />
                <View style={styles.orderSummaryRow}>
                  <Text style={styles.orderSummaryTotal}>Total</Text>
                  <Text style={styles.orderSummaryTotalValue}>₹{addressModal.plan?.price}</Text>
                </View>
              </View>

              <TouchableOpacity style={[styles.addressPayBtn, loading && { opacity: 0.6 }]} onPress={submitAddressAndPay} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.addressPayBtnText}>Continue to Payment — ₹{addressModal.plan?.price} →</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.addressCancelBtn} onPress={closeAddressModal}>
                <Text style={styles.addressCancelText}>Cancel</Text>
              </TouchableOpacity>
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Upgrade VahanPing</Text>
          <Text style={styles.headerSub}>Protect your vehicle with premium features</Text>
        </View>

        <View style={styles.bundleCard}>
          <View style={styles.bundleBadge}><Text style={styles.bundleBadgeText}>⚡ BEST VALUE</Text></View>
          <Text style={styles.bundleTitle}>Complete Protection Bundle</Text>
          <Text style={styles.bundleDesc}>WhatsApp Alerts + Anonymous Call + QR Sticker + SMS Alerts</Text>
          <View style={styles.bundleFeatures}>
            {['💬 WhatsApp Alerts', '📞 Anonymous Call', '📦 QR Sticker', '📩 SMS Alerts'].map(f => (
              <View key={f} style={styles.bundleFeatureRow}>
                <View style={styles.checkCircle}><Text style={styles.checkText}>✓</Text></View>
                <Text style={styles.bundleFeatureText}>{f}</Text>
              </View>
            ))}
          </View>
          <View style={styles.bundlePriceRow}>
            <View>
              <Text style={styles.originalPrice}>₹796</Text>
              <Text style={styles.saveText}>Save ₹397 (50% off)</Text>
            </View>
            <View style={styles.bundlePriceBadge}><Text style={styles.bundlePrice}>₹399</Text></View>
          </View>
          <TouchableOpacity style={styles.bundleBtn} onPress={() => handleBuy(BUNDLE)} disabled={loading}>
            <Text style={styles.bundleBtnText}>Get Bundle — ₹399 →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or choose individually</Text>
          <View style={styles.dividerLine} />
        </View>

        {INDIVIDUAL_PLANS.map(plan => (
          <View key={plan.id} style={styles.planCard}>
            {plan.highlight && <View style={styles.highlightBadge}><Text style={styles.highlightText}>{plan.highlight}</Text></View>}
            <View style={styles.planTop}>
              <View style={styles.planIconWrap}><Text style={styles.planIcon}>{plan.icon}</Text></View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planDesc}>{plan.description}</Text>
              </View>
              <Text style={styles.planPrice}>₹{plan.price}</Text>
            </View>
            <TouchableOpacity style={styles.buyBtn} onPress={() => handleBuy(plan)} disabled={loading}>
              <Text style={styles.buyBtnText}>{plan.needsAddress ? 'Order Now →' : 'Buy Now →'}</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={[styles.planCard, styles.comingSoonCard]}>
          <View style={styles.comingSoonBadge}><Text style={styles.comingSoonBadgeText}>🔜 COMING SOON</Text></View>
          <View style={styles.planTop}>
            <View style={[styles.planIconWrap, styles.planIconWrapDim]}><Text style={styles.planIcon}>🔔</Text></View>
            <View style={styles.planInfo}>
              <Text style={[styles.planName, styles.dimText]}>Push Notifications</Text>
              <Text style={styles.planDesc}>In-app push alerts — coming soon, will be free!</Text>
            </View>
            <Text style={[styles.planPrice, styles.dimText]}>Free</Text>
          </View>
        </View>

        <View style={styles.secureNote}><Text style={styles.secureText}>🔒 Secured by Razorpay · 100% Safe</Text></View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  scroll: { padding: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#12121A', borderRadius: 24, padding: 28, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#22223A' },
  modalIconWrap: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  modalIcon: { fontSize: 32 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 10, textAlign: 'center' },
  modalMsg: { fontSize: 14, color: '#888', lineHeight: 22, textAlign: 'center', marginBottom: 20 },
  paymentIdBox: { backgroundColor: '#0A0A0F', borderRadius: 10, padding: 12, width: '100%', marginBottom: 24, borderWidth: 1, borderColor: '#22223A' },
  paymentIdLabel: { fontSize: 11, color: '#555', marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' },
  paymentIdValue: { fontSize: 12, color: '#9D65F5', fontWeight: '600' },
  modalBtnSuccess: { backgroundColor: '#7C3AED', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, width: '100%', alignItems: 'center' },
  modalBtnsRow: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtnCancel: { flex: 1, backgroundColor: '#1A1A26', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#22223A' },
  modalBtnRetry: { flex: 1, backgroundColor: '#7C3AED', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  modalBtnCancelText: { color: '#888', fontWeight: '700', fontSize: 15 },
  addressOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  addressSheet: { backgroundColor: '#0A0A0A', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '92%', borderWidth: 1, borderColor: '#1A1A1A' },
  addressHandle: { width: 36, height: 4, backgroundColor: '#222', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  addressTitle: { color: '#FFF', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  addressSub: { color: '#444', fontSize: 13, marginBottom: 20 },
  addressField: { marginBottom: 14 },
  addressFieldLabel: { color: '#555', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  addressInput: { backgroundColor: '#0E0E0E', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, color: '#FFF', fontSize: 14, borderWidth: 1, borderColor: '#1A1A1A' },
  orderSummaryBox: { backgroundColor: '#0E0E0E', borderRadius: 12, padding: 16, marginTop: 8, marginBottom: 16, borderWidth: 1, borderColor: '#1A1A1A' },
  orderSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderSummaryLabel: { color: '#555', fontSize: 14 },
  orderSummaryValue: { color: '#CCC', fontSize: 14, fontWeight: '600' },
  orderSummaryDivider: { height: 1, backgroundColor: '#141414', marginVertical: 8 },
  orderSummaryTotal: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  orderSummaryTotalValue: { color: '#9D65F5', fontSize: 15, fontWeight: '800' },
  addressPayBtn: { backgroundColor: '#7C3AED', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  addressPayBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  addressCancelBtn: { backgroundColor: '#0E0E0E', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1A1A1A' },
  addressCancelText: { color: '#555', fontSize: 14, fontWeight: '600' },
  header: { marginBottom: 24, paddingTop: 10 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  headerSub: { color: '#666', fontSize: 14, marginTop: 4 },
  bundleCard: { backgroundColor: '#12121A', borderRadius: 20, padding: 22, marginBottom: 24, borderWidth: 1.5, borderColor: '#7C3AED' },
  bundleBadge: { backgroundColor: '#7C3AED', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 14 },
  bundleBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  bundleTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', marginBottom: 6 },
  bundleDesc: { color: '#888', fontSize: 13, lineHeight: 20, marginBottom: 16 },
  bundleFeatures: { marginBottom: 20 },
  bundleFeatureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  checkCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(124,58,237,0.2)', borderWidth: 1, borderColor: '#7C3AED', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkText: { color: '#9D65F5', fontSize: 11, fontWeight: '800' },
  bundleFeatureText: { color: '#CCC', fontSize: 14 },
  bundlePriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  originalPrice: { color: '#555', fontSize: 16, textDecorationLine: 'line-through' },
  saveText: { color: '#9D65F5', fontSize: 12, marginTop: 2, fontWeight: '600' },
  bundlePriceBadge: { backgroundColor: 'rgba(124,58,237,0.2)', borderWidth: 1, borderColor: '#7C3AED', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  bundlePrice: { color: '#9D65F5', fontSize: 24, fontWeight: '900' },
  bundleBtn: { backgroundColor: '#7C3AED', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  bundleBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#22223A' },
  dividerText: { color: '#555', fontSize: 12, marginHorizontal: 12 },
  planCard: { backgroundColor: '#12121A', borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#22223A' },
  highlightBadge: { backgroundColor: 'rgba(124,58,237,0.15)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginBottom: 12 },
  highlightText: { color: '#9D65F5', fontSize: 10, fontWeight: '700' },
  planTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  planIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(124,58,237,0.15)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  planIcon: { fontSize: 22 },
  planInfo: { flex: 1 },
  planName: { color: '#FFF', fontSize: 15, fontWeight: '700', marginBottom: 3 },
  planDesc: { color: '#888', fontSize: 12, lineHeight: 18 },
  planPrice: { color: '#9D65F5', fontSize: 20, fontWeight: '900', marginLeft: 8 },
  buyBtn: { backgroundColor: 'rgba(124,58,237,0.15)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  buyBtnText: { color: '#9D65F5', fontWeight: '700', fontSize: 14 },
  comingSoonCard: { borderColor: '#22223A', opacity: 0.7 },
  comingSoonBadge: { backgroundColor: 'rgba(255,255,255,0.05)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginBottom: 12 },
  comingSoonBadgeText: { color: '#555', fontSize: 10, fontWeight: '700' },
  planIconWrapDim: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: '#333' },
  dimText: { color: '#555' },
  secureNote: { alignItems: 'center', marginTop: 8 },
  secureText: { color: '#444', fontSize: 13 },
});
