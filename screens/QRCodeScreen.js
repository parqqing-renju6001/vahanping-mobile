import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Share, ScrollView,
  TextInput, Modal, ActivityIndicator
} from 'react-native';
import Svg, { Path, Circle, Line, Rect, Polyline, G } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import CustomModal from './CustomModal';

const BACKEND = 'https://api.vahanping.com';
const CALLER_WEB = 'https://vahanping.com';

// ── SVG Icons ────────────────────────────────────────────────────
const ArrowLeftIcon = ({ size = 20, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ShareIcon = ({ size = 18, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="18" cy="5" r="3" stroke={color} strokeWidth="1.5"/>
    <Circle cx="6" cy="12" r="3" stroke={color} strokeWidth="1.5"/>
    <Circle cx="18" cy="19" r="3" stroke={color} strokeWidth="1.5"/>
    <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke={color} strokeWidth="1.5"/>
    <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke={color} strokeWidth="1.5"/>
  </Svg>
);

const CopyIcon = ({ size = 18, color = '#888' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="9" y="9" width="13" height="13" rx="2" stroke={color} strokeWidth="1.5"/>
    <Path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const PackageIcon = ({ size = 18, color = '#9D65F5' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Line x1="12" y1="22.08" x2="12" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const CheckCircleIcon = ({ size = 18, color = '#9D65F5' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Polyline points="22 4 12 14.01 9 11.01" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CarIcon = ({ size = 16, color = '#555' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 17H3a2 2 0 01-2-2v-4l2.5-6h13L19 11v4a2 2 0 01-2 2h-2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx="7.5" cy="17.5" r="2.5" stroke={color} strokeWidth="1.5"/>
    <Circle cx="16.5" cy="17.5" r="2.5" stroke={color} strokeWidth="1.5"/>
    <Path d="M5 11h14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const XIcon = ({ size = 20, color = '#555' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const LinkIcon = ({ size = 14, color = '#555' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

// ── Component ────────────────────────────────────────────────────
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
        message: `VahanPing — Scan to contact me about my vehicle ${vehicle.plate}\n\n${scanUrl}`,
        title: `VahanPing QR — ${vehicle.plate}`,
      });
    } catch (e) {
      showModal('❌', 'Share Failed', e.message, [{ text: 'OK', style: 'primary', onPress: closeModal }]);
    }
  };

  const copyLink = async () => {
    try {
      const Clipboard = require('@react-native-clipboard/clipboard').default;
      Clipboard.setString(scanUrl);
      showModal('✅', 'Copied', 'Scan link copied to clipboard', [{ text: 'OK', style: 'primary', onPress: closeModal }]);
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
          vehicle_plate: vehicle.plate, qr_token: vehicle.token,
          name: address.name, phone: address.phone,
          address_line1: address.line1, city: address.city,
          state: address.state, pincode: address.pincode, amount: 199,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowOrderModal(false);
        setAddress({ name: '', phone: '', line1: '', city: '', state: '', pincode: '' });
        showModal('🎉', 'Order Placed', `Your QR sticker will be delivered to ${address.city} within 5–7 business days.`, [{ text: 'Done', style: 'primary', onPress: closeModal }]);
      } else {
        showModal('❌', 'Error', data.error || 'Something went wrong', [{ text: 'OK', style: 'primary', onPress: closeModal }]);
      }
    } catch {
      showModal('❌', 'Error', 'Failed to place order. Please try again.', [{ text: 'OK', style: 'primary', onPress: closeModal }]);
    } finally { setOrderLoading(false); }
  };

  return (
    <SafeAreaView style={s.container}>
      <CustomModal visible={modal.visible} icon={modal.icon} title={modal.title} message={modal.message} buttons={modal.buttons} onClose={closeModal} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <ArrowLeftIcon size={20} color="#888" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>QR Code</Text>
          <TouchableOpacity style={s.shareHeaderBtn} onPress={shareQR}>
            <ShareIcon size={16} color="#9D65F5" />
          </TouchableOpacity>
        </View>

        {/* Vehicle strip */}
        <View style={s.vehicleStrip}>
          <View style={s.plateWrap}>
            <Text style={s.plateText}>{vehicle.plate}</Text>
          </View>
          <View style={s.vehicleStripRight}>
            <View style={s.vehicleStripRow}>
              <CarIcon size={13} color="#555" />
              <Text style={s.vehicleMeta}>{vehicle.color} · {vehicle.model || 'Vehicle'}</Text>
            </View>
            <View style={s.activePill}>
              <View style={s.activeDot} />
              <Text style={s.activeText}>PROTECTED</Text>
            </View>
          </View>
        </View>

        {/* QR Card */}
        <View style={s.qrCard}>
          <View style={s.qrCardHeader}>
            <Text style={s.qrCardBrand}>VahanPing</Text>
            <Text style={s.qrCardSub}>Scan to contact owner anonymously</Text>
          </View>
          <View style={s.qrWrapper}>
            <QRCode value={scanUrl} size={200} color="#000" backgroundColor="#fff" getRef={qrRef} />
          </View>
          <View style={s.qrCardFooter}>
            <Text style={s.qrPlate}>{vehicle.plate}</Text>
            <View style={s.qrFooterBadges}>
              <View style={s.qrBadge}><Text style={s.qrBadgeText}>Anonymous</Text></View>
              <View style={s.qrBadge}><Text style={s.qrBadgeText}>No App Needed</Text></View>
            </View>
          </View>
        </View>

        {/* Order Sticker CTA */}
        <TouchableOpacity style={s.orderCard} onPress={() => navigation.navigate('StickerDesign', { vehicle })}>
          <View style={s.orderCardLeft}>
            <View style={s.orderIconWrap}>
              <PackageIcon size={20} color="#9D65F5" />
            </View>
            <View>
              <Text style={s.orderCardTitle}>Order Physical Sticker</Text>
              <Text style={s.orderCardSub}>Weatherproof · Delivered to your door</Text>
            </View>
          </View>
          <Text style={s.orderPrice}>₹199</Text>
        </TouchableOpacity>

        {/* How to use */}
        <View style={s.stepsCard}>
          <Text style={s.stepsTitle}>How to use this QR</Text>
          {[
            'Screenshot or download this QR code',
            'Print and stick on your windshield',
            'Anyone can scan to contact you anonymously',
            'You receive an instant notification',
          ].map((step, i) => (
            <View key={i} style={s.step}>
              <View style={s.stepNum}>
                <Text style={s.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={s.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Scan URL */}
        <View style={s.urlCard}>
          <View style={s.urlCardHeader}>
            <LinkIcon size={12} color="#555" />
            <Text style={s.urlLabel}>Scan URL</Text>
          </View>
          <Text style={s.urlText} numberOfLines={1}>{scanUrl}</Text>
        </View>

        {/* Actions */}
        <TouchableOpacity style={s.shareBtn} onPress={shareQR}>
          <ShareIcon size={18} color="#fff" />
          <Text style={s.shareBtnText}>Share QR Code</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.copyBtn} onPress={copyLink}>
          <CopyIcon size={16} color="#666" />
          <Text style={s.copyBtnText}>Copy Scan Link</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Order Modal */}
      <Modal visible={showOrderModal} animationType="slide" transparent onRequestClose={() => setShowOrderModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            {/* Handle */}
            <View style={s.modalHandle} />

            <View style={s.modalHeaderRow}>
              <View>
                <Text style={s.modalTitle}>Order QR Sticker</Text>
                <Text style={s.modalSub}>Weatherproof · Delivered pan-India</Text>
              </View>
              <TouchableOpacity onPress={() => setShowOrderModal(false)} style={s.modalCloseBtn}>
                <XIcon size={18} color="#555" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { key: 'name', label: 'Full Name', placeholder: 'Renjith R', keyboard: 'default' },
                { key: 'phone', label: 'Phone Number', placeholder: '9876543210', keyboard: 'phone-pad' },
                { key: 'line1', label: 'Address', placeholder: 'House No, Street, Area', keyboard: 'default' },
                { key: 'city', label: 'City', placeholder: 'Thrissur', keyboard: 'default' },
                { key: 'state', label: 'State', placeholder: 'Kerala', keyboard: 'default' },
                { key: 'pincode', label: 'Pincode', placeholder: '680001', keyboard: 'phone-pad' },
              ].map(field => (
                <View key={field.key} style={s.inputField}>
                  <Text style={s.inputLabel}>{field.label}</Text>
                  <TextInput
                    style={s.modalInput}
                    placeholder={field.placeholder}
                    placeholderTextColor="#AAAAAA"
                    value={address[field.key]}
                    onChangeText={t => setAddress(prev => ({ ...prev, [field.key]: t }))}
                    keyboardType={field.keyboard}
                    maxLength={field.key === 'pincode' ? 6 : undefined}
                  />
                </View>
              ))}

              {/* Order summary */}
              <View style={s.summaryCard}>
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>QR Sticker × 1</Text>
                  <Text style={s.summaryValue}>₹199</Text>
                </View>
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Delivery</Text>
                  <Text style={s.summaryFree}>Free</Text>
                </View>
                <View style={s.summaryDivider} />
                <View style={s.summaryRow}>
                  <Text style={s.summaryTotal}>Total</Text>
                  <Text style={s.summaryTotalValue}>₹199</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[s.placeOrderBtn, orderLoading && { opacity: 0.6 }]}
                onPress={handleOrderSticker}
                disabled={orderLoading}
              >
                {orderLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.placeOrderBtnText}>Place Order — ₹199</Text>}
              </TouchableOpacity>

              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { padding: 20 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingTop: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#1A1A1A', fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  shareHeaderBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(124,58,237,0.1)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)', alignItems: 'center', justifyContent: 'center' },

  vehicleStrip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#E0E0E0' },
  plateWrap: { backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#E0E0E0', marginRight: 14 },
  plateText: { color: '#1A1A1A', fontWeight: '800', fontSize: 18, letterSpacing: 3 },
  vehicleStripRight: { flex: 1, gap: 6 },
  vehicleStripRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vehicleMeta: { color: '#888888', fontSize: 12 },
  activePill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: 'rgba(124,58,237,0.08)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  activeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#7C3AED' },
  activeText: { color: '#7C3AED', fontSize: 9, fontWeight: '700', letterSpacing: 1 },

  qrCard: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 16, elevation: 8 },
  qrCardHeader: { backgroundColor: '#FFFFFF', padding: 16, alignItems: 'center' },
  qrCardBrand: { color: '#9D65F5', fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  qrCardSub: { color: '#999999', fontSize: 11, marginTop: 3, letterSpacing: 0.2 },
  qrWrapper: { alignItems: 'center', paddingVertical: 28, backgroundColor: '#fff' },
  qrCardFooter: { backgroundColor: '#F8F8F8', padding: 16, alignItems: 'center', gap: 8 },
  qrPlate: { color: '#000', fontWeight: '900', fontSize: 22, letterSpacing: 4 },
  qrFooterBadges: { flexDirection: 'row', gap: 8 },
  qrBadge: { backgroundColor: '#EFEFEF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  qrBadgeText: { color: '#666666', fontSize: 10, fontWeight: '600' },

  orderCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F5F5F5', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)' },
  orderCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  orderIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(124,58,237,0.1)', alignItems: 'center', justifyContent: 'center' },
  orderCardTitle: { color: '#444444', fontSize: 14, fontWeight: '600' },
  orderCardSub: { color: '#888888', fontSize: 12, marginTop: 2 },
  orderPrice: { color: '#9D65F5', fontSize: 18, fontWeight: '800' },

  stepsCard: { backgroundColor: '#F5F5F5', borderRadius: 14, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  stepsTitle: { color: '#666666', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 },
  step: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  stepNum: { width: 22, height: 22, borderRadius: 6, backgroundColor: 'rgba(124,58,237,0.15)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0, marginTop: 1 },
  stepNumText: { color: '#9D65F5', fontSize: 11, fontWeight: '700' },
  stepText: { color: '#777777', fontSize: 13, lineHeight: 22, flex: 1 },

  urlCard: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  urlCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  urlLabel: { color: '#999999', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  urlText: { color: '#AAAAAA', fontSize: 12 },

  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#7C3AED', borderRadius: 12, paddingVertical: 16, marginBottom: 10 },
  shareBtnText: { color: '#1A1A1A', fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#F5F5F5', borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderColor: '#E0E0E0' },
  copyBtnText: { color: '#777777', fontSize: 14, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '92%', borderWidth: 1, borderColor: '#E0E0E0' },
  modalHandle: { width: 36, height: 4, backgroundColor: '#222', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalTitle: { color: '#1A1A1A', fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  modalSub: { color: '#999999', fontSize: 12, marginTop: 4 },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#EBEBEB', borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center' },

  inputField: { marginBottom: 14 },
  inputLabel: { color: '#888888', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  modalInput: { backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, color: '#1A1A1A', fontSize: 14, borderWidth: 1, borderColor: '#E0E0E0' },

  summaryCard: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, marginTop: 8, marginBottom: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { color: '#888888', fontSize: 13 },
  summaryValue: { color: '#444444', fontSize: 13, fontWeight: '600' },
  summaryFree: { color: '#7C3AED', fontSize: 13, fontWeight: '600' },
  summaryDivider: { height: 1, backgroundColor: '#EBEBEB', marginVertical: 8 },
  summaryTotal: { color: '#1A1A1A', fontSize: 15, fontWeight: '700' },
  summaryTotalValue: { color: '#9D65F5', fontSize: 15, fontWeight: '800' },

  placeOrderBtn: { backgroundColor: '#7C3AED', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  placeOrderBtnText: { color: '#1A1A1A', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
});
