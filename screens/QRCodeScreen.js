import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, SafeAreaView, Share, Alert, ScrollView,
  TextInput, Modal, ActivityIndicator
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const BACKEND = 'https://parkping-wwur.onrender.com';
const CALLER_WEB = 'https://parkping-omega.vercel.app';

export default function QRCodeScreen({ route, navigation }) {
  const { vehicle } = route.params;
  const qrRef = useRef();
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    line1: '',
    city: '',
    state: '',
    pincode: '',
  });

  const scanUrl = `${CALLER_WEB}/scan/${vehicle.token}`;

  const shareQR = async () => {
    try {
      await Share.share({
        message: `🅿️ VahanPing - Scan to contact me about my vehicle ${vehicle.plate}\n\n${scanUrl}`,
        title: `VahanPing QR - ${vehicle.plate}`,
      });
    } catch (e) {
      Alert.alert('Share failed', e.message);
    }
  };

  const copyLink = async () => {
    try {
      const Clipboard = require('@react-native-clipboard/clipboard').default;
      Clipboard.setString(scanUrl);
      Alert.alert('✅ Copied!', 'Scan link copied to clipboard');
    } catch {
      Alert.alert('Scan URL', scanUrl);
    }
  };

  const handleOrderSticker = async () => {
    if (!address.name.trim()) return Alert.alert('Required', 'Please enter your name');
    if (!address.phone.trim()) return Alert.alert('Required', 'Please enter your phone');
    if (!address.line1.trim()) return Alert.alert('Required', 'Please enter your address');
    if (!address.city.trim()) return Alert.alert('Required', 'Please enter your city');
    if (!address.pincode.trim() || address.pincode.length !== 6) return Alert.alert('Required', 'Please enter a valid 6-digit pincode');

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
        Alert.alert(
          '✅ Order Placed!',
          `Your VahanPing QR sticker will be delivered to ${address.city} within 5-7 business days!`,
          [{ text: 'OK' }]
        );
        setAddress({ name: '', phone: '', line1: '', city: '', state: '', pincode: '' });
      } else {
        Alert.alert('Error', data.error || 'Something went wrong');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setOrderLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
            <QRCode
              value={scanUrl}
              size={220}
              color="#000000"
              backgroundColor="#FFFFFF"
              getRef={qrRef}
            />
          </View>

          <View style={styles.qrFooter}>
            <Text style={styles.qrPlate}>{vehicle.plate}</Text>
            <Text style={styles.qrFooterText}>Anonymous • No app needed</Text>
          </View>
        </View>

        {/* Order Sticker Button */}
        <TouchableOpacity
          style={styles.orderBtn}
          onPress={() => setShowOrderModal(true)}
        >
          <Text style={styles.orderBtnTitle}>📦 Order Physical QR Sticker</Text>
          <Text style={styles.orderBtnSub}>Weatherproof sticker delivered to your door — ₹199</Text>
        </TouchableOpacity>

        {/* Instructions */}
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>📌 How to use this QR</Text>
          <View style={styles.step}>
            <Text style={styles.stepNum}>1</Text>
            <Text style={styles.stepText}>Share or screenshot this QR code</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNum}>2</Text>
            <Text style={styles.stepText}>Print it and stick on your windshield</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNum}>3</Text>
            <Text style={styles.stepText}>Anyone can scan it to message you anonymously</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNum}>4</Text>
            <Text style={styles.stepText}>You get notified instantly on your phone</Text>
          </View>
        </View>

        {/* Scan URL */}
        <View style={styles.urlBox}>
          <Text style={styles.urlLabel}>Scan URL</Text>
          <Text style={styles.urlText} numberOfLines={1}>{scanUrl}</Text>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.shareBtn} onPress={shareQR}>
          <Text style={styles.shareBtnText}>📤 Share QR Code</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.copyBtn} onPress={copyLink}>
          <Text style={styles.copyBtnText}>🔗 Copy Scan Link</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Order Modal */}
      <Modal
        visible={showOrderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOrderModal(false)}
      >
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
                <View style={[styles.orderSummaryRow, { borderTopWidth: 1, borderTopColor: '#2A2A2A', paddingTop: 8, marginTop: 4 }]}>
                  <Text style={styles.orderSummaryTotal}>Total</Text>
                  <Text style={styles.orderSummaryTotalValue}>₹199</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.placeOrderBtn, orderLoading && { opacity: 0.6 }]}
                onPress={handleOrderSticker}
                disabled={orderLoading}
              >
                {orderLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.placeOrderBtnText}>Place Order — ₹199 →</Text>
                )}
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
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  scroll: { padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 10,
  },
  backBtn: { padding: 4 },
  backText: { color: '#FF6B00', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  plateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  plateBadge: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 14,
  },
  plateText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 2,
  },
  vehicleDetails: { flex: 1 },
  vehicleName: { color: '#FFF', fontWeight: '700', fontSize: 17 },
  vehicleColor: { color: '#888', fontSize: 13, marginTop: 3 },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  qrHeader: {
    backgroundColor: '#0F0F0F',
    padding: 16,
    alignItems: 'center',
  },
  qrHeaderTitle: {
    color: '#FF6B00',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  qrHeaderSub: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  qrWrapper: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 28,
    backgroundColor: '#FFFFFF',
  },
  qrFooter: {
    backgroundColor: '#F5F5F5',
    padding: 14,
    alignItems: 'center',
  },
  qrPlate: {
    color: '#000',
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: 3,
  },
  qrFooterText: {
    color: '#999',
    fontSize: 11,
    marginTop: 3,
  },
  orderBtn: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#FF6B00',
  },
  orderBtnTitle: {
    color: '#FF6B00',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  orderBtnSub: {
    color: '#888',
    fontSize: 13,
  },
  instructionsBox: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  instructionsTitle: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 14,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B00',
    color: '#FFF',
    fontWeight: '800',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  stepText: {
    color: '#AAA',
    fontSize: 14,
    flex: 1,
    lineHeight: 24,
  },
  urlBox: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  urlLabel: {
    color: '#FF6B00',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  urlText: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  shareBtn: {
    backgroundColor: '#FF6B00',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  shareBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  copyBtn: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  copyBtnText: {
    color: '#CCC',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F0F0F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  modalClose: {
    color: '#666',
    fontSize: 20,
    fontWeight: '600',
  },
  modalSub: {
    color: '#666',
    fontSize: 13,
    marginBottom: 16,
  },
  inputField: { marginBottom: 14 },
  inputLabel: {
    color: '#CCC',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  orderSummary: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  orderSummaryTitle: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 12,
  },
  orderSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  orderSummaryLabel: { color: '#888', fontSize: 14 },
  orderSummaryValue: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  orderSummaryValueFree: { color: '#4CAF50', fontSize: 14, fontWeight: '600' },
  orderSummaryTotal: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  orderSummaryTotalValue: { color: '#FF6B00', fontSize: 16, fontWeight: '800' },
  placeOrderBtn: {
    backgroundColor: '#FF6B00',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  placeOrderBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
