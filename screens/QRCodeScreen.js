import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView, Share, ScrollView,
  TextInput, Modal, ActivityIndicator
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import CustomModal from './CustomModal';

const BACKEND = 'https://parkping-wwur.onrender.com';
const CALLER_WEB = 'https://www.vahanping.com';

export default function QRCodeScreen({ route, navigation }) {
  const { vehicle } = route.params;
  const qrRef = useRef();
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [address, setAddress] = useState({ name: '', phone: '', line1: '', city: '', state: '', pincode: '' });

  const [modal, setModal] = useState({ visible: false, icon: '', title: '', message: '', buttons: [] });
  const showModal = (icon, title, message, buttons) => setModal({ visible: true, icon, title, message, buttons });
  const closeModal = () => setModal(m => ({ ...m, visible: false }));

  const scanUrl = `${CALLER_WEB}/scan/${vehicle.token}`;

  const shareQR = async () => {
    try {
      await Share.share({
        message: `🅿️ VahanPing - Scan to contact me about my vehicle ${vehicle.plate}\n\n${scanUrl}`,
        title: `VahanPing QR - ${vehicle.plate}`,
      });
    } catch (e) {
      showModal('❌', 'Share Failed', e.message, [{ text: 'OK', style: 'primary', onPress: closeModal }]);
    }
  };

  const copyLink = async () => {
    try {
      const Clipboard = require('@react-native-clipboard/clipboard').default;
      Clipboard.setString(scanUrl);
      showModal('✅', 'Copied!', 'Scan link copied to clipboard', [{ text: 'OK', style: 'primary', onPress: closeModal }]);
    } catch {
      showModal('🔗', 'Scan URL', scanUrl, [{ text: 'OK', style: 'primary', onPress: closeModal }]);
    }
  };

  const handleOrderSticker = async () => {
    if (!address.name.trim()) return showModal('⚠️', 'Required', 'Please enter your name', [{ text: 'OK', style: 'primary', onPress: closeModal }]);
    if (!address.phone.trim()) return showModal('⚠️', 'Required', 'Please enter your phone', [{ text: 'OK', style: 'primary', onPress: closeModal }]);
    if (!address.line1.trim()) return showModal('⚠️', 'Required', 'Please enter your address', [{ text: 'OK', style: 'primary', onPress: closeModal }]);
    if (!address.city.trim()) return showModal('⚠️', 'Required', 'Please enter your city', [{ text: 'OK', style: 'primary', onPress: closeModal }]);
    if (!address.pincode.trim() || address.pincode.length !== 6) return showModal('⚠️', 'Required', 'Please enter a valid 6-digit pincode', [{ text: 'OK', style: 'primary', onPress: closeModal }]);

    setOrderLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/v1/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_plate: vehicle.plate,
          qr_token: vehicle.token,
          name: address.name,
          phone: address.phone,
          address_line1: address.line1,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          amount: 199,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowOrderModal(false);
        setAddress({ name: '', phone: '', line1: '', city: '', state: '', pincode: '' });
        showModal(
          '🎉',
          'Order Placed!',
          `Your VahanPing QR sticker will be delivered to ${address.city} within 5-7 business days!`,
          [{ text: 'Great!', style: 'primary', onPress: closeModal }]
        );
      } else {
        showModal('❌', 'Error', data.error || 'Something went wrong', [{ text: 'OK', style: 'primary', onPress: closeModal }]);
      }
    } catch (e) {
      showModal('❌', 'Error', 'Failed to place order. Please try again.', [{ text: 'OK', style: 'primary', onPress: closeModal }]);
    } finally {
      setOrderLoading(false);
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

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>QR Code</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Plate badge */}
        <View style={styles.plateRow}>
          <View style={styles.plateBadge}>
            <Text style={styles.plateText}>{vehicle.plate}</Text>
          </View>
          <View style={styles.vehicleDetails}>
            <Text style={styles.vehicleName}>{vehicle.nickname || vehicle.model}</Text>
            <Text style={styles.vehicleColor}>{vehicle.color} • {vehicle.model}</Text>
          </View>
        </View>

        {/* QR Code Card */}
        <View style={styles.qrCard}>
          <View style={styles.qrHeader}>
            <Text style={styles.qrHeaderTitle}>VahanPing</Text>
            <Text style={styles.qrHeaderSub}>Scan to contact owner</Text>
          </View>
          <View style={styles.qrWrapper}>
            <QRCode value={scanUrl} size={220} color="#000000" backgroundColor="#FFFFFF" getRef={qrRef} />
          </View>
          <View style={styles.qrFooter}>
            <Text style={styles.qrPlate}>{vehicle.plate}</Text>
            <Text style={styles.qrFooterText}>Anonymous • No app needed</Text>
          </View>
        </View>

        {/* Order Sticker Button */}
        <TouchableOpacity style={styles.orderBtn} onPress={() => navigation.navigate('StickerDesign', { vehicle })}>
        <Text style={styles.orderBtnTitle}>📦 Design & Order QR Sticker</Text>
        <Text style={styles.orderBtnSub}>Choose your profession style — ₹199 delivered</Text>
        </TouchableOpacity>

        {/* Instructions */}
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>📌 How to use this QR</Text>
          {[
            'Share or screenshot this QR code',
            'Print it and stick on your windshield',
            'Anyone can scan it to message you anonymously',
            'You get notified instantly on your phone',
          ].map((step, i) => (
            <View key={i} style={styles.step}>
              <Text style={styles.stepNum}>{i + 1}</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Scan URL */}
        <View style={styles.urlBox}>
          <Text style={styles.urlLabel}>Scan URL</Text>
          <Text style={styles.urlText} numberOfLines={1}>{scanUrl}</Text>
        </View>

        <TouchableOpacity style={styles.shareBtn} onPress={shareQR}>
          <Text style={styles.shareBtnText}>📤 Share QR Code</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.copyBtn} onPress={copyLink}>
          <Text style={styles.copyBtnText}>🔗 Copy Scan Link</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Order Modal */}
      <Modal visible={showOrderModal} animationType="slide" transparent={true} onRequestClose={() => setShowOrderModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📦 Order QR Sticker</Text>
              <TouchableOpacity onPress={() => setShowOrderModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSub}>Deliver to:</Text>

              {[
                { key: 'name', label: 'Full Name', placeholder: 'Renjith R' },
                { key: 'phone', label: 'Phone', placeholder: '9876543210' },
                { key: 'line1', label: 'Address', placeholder: 'House No, Street, Area' },
                { key: 'city', label: 'City', placeholder: 'Thrissur' },
                { key: 'state', label: 'State', placeholder: 'Kerala' },
                { key: 'pincode', label: 'Pincode', placeholder: '680001' },
              ].map(field => (
                <View key={field.key} style={styles.inputField}>
                  <Text style={styles.inputLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={field.placeholder}
                    placeholderTextColor="#444"
                    value={address[field.key]}
                    onChangeText={t => setAddress(prev => ({ ...prev, [field.key]: t }))}
                    keyboardType={field.key === 'phone' || field.key === 'pincode' ? 'phone-pad' : 'default'}
                    maxLength={field.key === 'pincode' ? 6 : undefined}
                  />
                </View>
              ))}

              <View style={styles.orderSummary}>
                <Text style={styles.orderSummaryTitle}>Order Summary</Text>
                <View style={styles.orderSummaryRow}>
                  <Text style={styles.orderSummaryLabel}>QR Sticker x1</Text>
                  <Text style={styles.orderSummaryValue}>₹199</Text>
                </View>
                <View style={styles.orderSummaryRow}>
                  <Text style={styles.orderSummaryLabel}>Delivery</Text>
                  <Text style={styles.orderSummaryValueFree}>FREE</Text>
                </View>
                <View style={[styles.orderSummaryRow, { borderTopWidth: 1, borderTopColor: '#22223A', paddingTop: 8, marginTop: 4 }]}>
                  <Text style={styles.orderSummaryTotal}>Total</Text>
                  <Text style={styles.orderSummaryTotalValue}>₹199</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.placeOrderBtn, orderLoading && { opacity: 0.6 }]}
                onPress={handleOrderSticker}
                disabled={orderLoading}
              >
                {orderLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.placeOrderBtnText}>Place Order — ₹199 →</Text>}
              </TouchableOpacity>

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  scroll: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingTop: 10 },
  backBtn: { padding: 4 },
  backText: { color: '#7C3AED', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  plateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, backgroundColor: '#12121A', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#22223A' },
  plateBadge: { backgroundColor: '#7C3AED', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginRight: 14 },
  plateText: { color: '#FFF', fontWeight: '900', fontSize: 18, letterSpacing: 2 },
  vehicleDetails: { flex: 1 },
  vehicleName: { color: '#FFF', fontWeight: '700', fontSize: 17 },
  vehicleColor: { color: '#888', fontSize: 13, marginTop: 3 },
  qrCard: { backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', marginBottom: 20, elevation: 8 },
  qrHeader: { backgroundColor: '#0A0A0F', padding: 16, alignItems: 'center' },
  qrHeaderTitle: { color: '#7C3AED', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  qrHeaderSub: { color: '#888', fontSize: 12, marginTop: 2 },
  qrWrapper: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 28, backgroundColor: '#FFFFFF' },
  qrFooter: { backgroundColor: '#F5F5F5', padding: 14, alignItems: 'center' },
  qrPlate: { color: '#000', fontWeight: '900', fontSize: 20, letterSpacing: 3 },
  qrFooterText: { color: '#999', fontSize: 11, marginTop: 3 },
  orderBtn: { backgroundColor: '#12121A', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: '#7C3AED' },
  orderBtnTitle: { color: '#7C3AED', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  orderBtnSub: { color: '#888', fontSize: 13 },
  instructionsBox: { backgroundColor: '#12121A', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#22223A' },
  instructionsTitle: { color: '#FFF', fontWeight: '700', fontSize: 15, marginBottom: 14 },
  step: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#7C3AED', color: '#FFF', fontWeight: '800', fontSize: 12, textAlign: 'center', lineHeight: 24, marginRight: 12 },
  stepText: { color: '#AAA', fontSize: 14, flex: 1, lineHeight: 24 },
  urlBox: { backgroundColor: '#12121A', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#22223A' },
  urlLabel: { color: '#7C3AED', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  urlText: { color: '#888', fontSize: 12 },
  shareBtn: { backgroundColor: '#7C3AED', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  shareBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  copyBtn: { backgroundColor: '#12121A', borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#22223A' },
  copyBtnText: { color: '#CCC', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0A0A0F', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%', borderWidth: 1, borderColor: '#22223A' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  modalClose: { color: '#666', fontSize: 20, fontWeight: '600' },
  modalSub: { color: '#666', fontSize: 13, marginBottom: 16 },
  inputField: { marginBottom: 14 },
  inputLabel: { color: '#CCC', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: '#12121A', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#FFF', fontSize: 15, borderWidth: 1, borderColor: '#22223A' },
  orderSummary: { backgroundColor: '#12121A', borderRadius: 12, padding: 16, marginTop: 8, marginBottom: 16, borderWidth: 1, borderColor: '#22223A' },
  orderSummaryTitle: { color: '#FFF', fontWeight: '700', fontSize: 14, marginBottom: 12 },
  orderSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  orderSummaryLabel: { color: '#888', fontSize: 14 },
  orderSummaryValue: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  orderSummaryValueFree: { color: '#7C3AED', fontSize: 14, fontWeight: '600' },
  orderSummaryTotal: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  orderSummaryTotalValue: { color: '#7C3AED', fontSize: 16, fontWeight: '800' },
  placeOrderBtn: { backgroundColor: '#7C3AED', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  placeOrderBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
