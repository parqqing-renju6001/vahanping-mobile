import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView, TextInput, FlatList
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const PROFESSIONS = [
  { id: 'doctor', label: 'Doctor', icon: '👨‍⚕️', color: '#EF4444' },
  { id: 'engineer', label: 'Engineer', icon: '👷', color: '#F59E0B' },
  { id: 'teacher', label: 'Teacher', icon: '👩‍🏫', color: '#10B981' },
  { id: 'lawyer', label: 'Lawyer', icon: '⚖️', color: '#6366F1' },
  { id: 'police', label: 'Police', icon: '👮', color: '#3B82F6' },
  { id: 'army', label: 'Army', icon: '🪖', color: '#84CC16' },
  { id: 'pilot', label: 'Pilot', icon: '✈️', color: '#06B6D4' },
  { id: 'ca', label: 'CA', icon: '💼', color: '#8B5CF6' },
  { id: 'nurse', label: 'Nurse', icon: '👩‍⚕️', color: '#EC4899' },
  { id: 'custom', label: 'Custom', icon: '✏️', color: '#9D65F5' },
];

const STICKER_STYLES = [
  { id: 'circle', label: 'Circle Badge', icon: '⭕' },
  { id: 'shield', label: 'Shield', icon: '🛡️' },
  { id: 'plate', label: 'Number Plate', icon: '🪪' },
];

export default function StickerDesignScreen({ route, navigation }) {
  const { vehicle } = route.params;
  const [selectedProfession, setSelectedProfession] = useState(null);
  const [customText, setCustomText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('circle');
  const [step, setStep] = useState(1); // 1=choose style, 2=choose profession, 3=preview

  const qrUrl = `https://www.vahanping.com/scan/${vehicle.token}`;
  const professionLabel = selectedProfession?.id === 'custom'
    ? customText
    : selectedProfession?.label || '';

  const CircleBadgeSticker = () => (
    <View style={styles.stickerPreview}>
      {/* Outer ring */}
      <View style={[styles.outerRing, { borderColor: selectedProfession?.color || '#7C3AED' }]}>
        {/* Profession arc text - top */}
        <View style={styles.arcTopWrap}>
          <Text style={[styles.arcText, { color: selectedProfession?.color || '#7C3AED' }]}>
            {selectedProfession?.icon || '🚗'} {professionLabel.toUpperCase() || 'VAHANPING'}
          </Text>
        </View>
        {/* QR Code center */}
        <View style={styles.qrCenter}>
          <View style={styles.qrBg}>
            <QRCode
              value={qrUrl}
              size={100}
              backgroundColor="white"
              color="#000"
            />
          </View>
        </View>
        {/* Bottom text */}
        <View style={styles.arcBottomWrap}>
          <Text style={[styles.arcBottomText, { color: selectedProfession?.color || '#7C3AED' }]}>
            SCAN TO CONTACT
          </Text>
        </View>
      </View>
      {/* VahanPing label */}
      <View style={[styles.vahanpingBadge, { backgroundColor: selectedProfession?.color || '#7C3AED' }]}>
        <Text style={styles.vahanpingText}>VahanPing</Text>
      </View>
    </View>
  );

  const ShieldSticker = () => (
    <View style={styles.stickerPreview}>
      <View style={[styles.shieldOuter, { borderColor: selectedProfession?.color || '#7C3AED' }]}>
        {/* Shield top */}
        <View style={[styles.shieldHeader, { backgroundColor: selectedProfession?.color || '#7C3AED' }]}>
          <Text style={styles.shieldHeaderIcon}>{selectedProfession?.icon || '🚗'}</Text>
          <Text style={styles.shieldHeaderText}>{professionLabel.toUpperCase() || 'VAHANPING'}</Text>
        </View>
        {/* QR */}
        <View style={styles.shieldQrWrap}>
          <QRCode value={qrUrl} size={100} backgroundColor="white" color="#000"/>
        </View>
        {/* Bottom */}
        <View style={[styles.shieldFooter, { backgroundColor: selectedProfession?.color || '#7C3AED' }]}>
          <Text style={styles.shieldFooterText}>VahanPing · Scan to Contact</Text>
        </View>
      </View>
    </View>
  );

  const PlateSticker = () => (
    <View style={styles.stickerPreview}>
      <View style={[styles.plateOuter, { borderColor: selectedProfession?.color || '#7C3AED' }]}>
        <View style={styles.plateTop}>
          <Text style={styles.plateTopLeft}>{selectedProfession?.icon || '🚗'}</Text>
          <View>
            <Text style={[styles.plateProfession, { color: selectedProfession?.color || '#7C3AED' }]}>
              {professionLabel.toUpperCase() || 'VAHANPING'}
            </Text>
            <Text style={styles.plateSub}>Scan to Contact Anonymously</Text>
          </View>
          <Text style={styles.plateTopRight}>🇮🇳</Text>
        </View>
        <View style={styles.plateDivider}/>
        <View style={styles.plateBottom}>
          <QRCode value={qrUrl} size={80} backgroundColor="white" color="#000"/>
          <View style={styles.platePlateWrap}>
            <View style={styles.plateNumber}>
              <Text style={styles.plateNumberText}>{vehicle.plate}</Text>
            </View>
            <View style={[styles.vahanpingBadgeSmall, { backgroundColor: selectedProfession?.color || '#7C3AED' }]}>
              <Text style={styles.vahanpingTextSmall}>VahanPing</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderSticker = () => {
    if (selectedStyle === 'circle') return <CircleBadgeSticker />;
    if (selectedStyle === 'shield') return <ShieldSticker />;
    if (selectedStyle === 'plate') return <PlateSticker />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Design Your Sticker</Text>
          <Text style={styles.headerSub}>Customize your QR sticker with your profession</Text>
        </View>

        {/* Step 1 — Choose Style */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>1. Choose Sticker Style</Text>
          <View style={styles.styleRow}>
            {STICKER_STYLES.map(s => (
              <TouchableOpacity
                key={s.id}
                style={[styles.styleChip, selectedStyle === s.id && styles.styleChipActive]}
                onPress={() => setSelectedStyle(s.id)}
              >
                <Text style={styles.styleChipIcon}>{s.icon}</Text>
                <Text style={[styles.styleChipLabel, selectedStyle === s.id && styles.styleChipLabelActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Step 2 — Choose Profession */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>2. Choose Profession</Text>
          <View style={styles.professionGrid}>
            {PROFESSIONS.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[styles.professionChip, selectedProfession?.id === p.id && { borderColor: p.color, backgroundColor: `${p.color}15` }]}
                onPress={() => setSelectedProfession(p)}
              >
                <Text style={styles.professionIcon}>{p.icon}</Text>
                <Text style={[styles.professionLabel, selectedProfession?.id === p.id && { color: p.color }]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedProfession?.id === 'custom' && (
            <TextInput
              style={styles.customInput}
              placeholder="Enter your profession..."
              placeholderTextColor="#444"
              value={customText}
              onChangeText={setCustomText}
              maxLength={20}
              autoCapitalize="words"
            />
          )}
        </View>

        {/* Step 3 — Preview */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>3. Preview</Text>
          {renderSticker()}
        </View>

        {/* Order Button */}
        <TouchableOpacity
          style={[styles.orderBtn, { backgroundColor: selectedProfession?.color || '#7C3AED' }]}
          onPress={() => navigation.navigate('Payment')}
        >
          <Text style={styles.orderBtnText}>Order This Sticker — ₹199 →</Text>
        </TouchableOpacity>

        {/* Save digital */}
        <TouchableOpacity style={styles.saveDigitalBtn}>
          <Text style={styles.saveDigitalText}>💾 Save as Digital Sticker</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  scroll: { padding: 20 },

  header: { marginBottom: 24, paddingTop: 10 },
  backBtn: { marginBottom: 12 },
  backText: { color: '#7C3AED', fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  headerSub: { color: '#666', fontSize: 14 },

  sectionCard: {
    backgroundColor: '#12121A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#22223A',
  },
  sectionTitle: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 16 },

  // Styles
  styleRow: { flexDirection: 'row', gap: 10 },
  styleChip: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#22223A',
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  styleChipActive: { borderColor: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.1)' },
  styleChipIcon: { fontSize: 24 },
  styleChipLabel: { fontSize: 12, color: '#666', fontWeight: '600' },
  styleChipLabelActive: { color: '#9D65F5' },

  // Professions
  professionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  professionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0A0A0F',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#22223A',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  professionIcon: { fontSize: 16 },
  professionLabel: { fontSize: 13, color: '#888', fontWeight: '600' },

  customInput: {
    backgroundColor: '#0A0A0F',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7C3AED',
    color: '#FFF',
    fontSize: 15,
    padding: 14,
    marginTop: 12,
  },

  // Sticker previews
  stickerPreview: { alignItems: 'center', paddingVertical: 16 },

  // Circle style
  outerRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    position: 'relative',
  },
  arcTopWrap: {
    position: 'absolute',
    top: 18,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  arcText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  qrCenter: { alignItems: 'center', justifyContent: 'center' },
  qrBg: { padding: 4, backgroundColor: '#FFF', borderRadius: 8 },
  arcBottomWrap: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  arcBottomText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  vahanpingBadge: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
  },
  vahanpingText: { color: '#FFF', fontSize: 13, fontWeight: '800' },

  // Shield style
  shieldOuter: {
    width: 200,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  shieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
  },
  shieldHeaderIcon: { fontSize: 20 },
  shieldHeaderText: { color: '#FFF', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  shieldQrWrap: { padding: 16, alignItems: 'center', backgroundColor: '#FFF' },
  shieldFooter: { padding: 10, alignItems: 'center' },
  shieldFooterText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  // Plate style
  plateOuter: {
    width: 260,
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  plateTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#F8F8F8',
  },
  plateTopLeft: { fontSize: 20 },
  plateTopRight: { fontSize: 20 },
  plateProfession: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  plateSub: { fontSize: 9, color: '#888', marginTop: 1 },
  plateDivider: { height: 1, backgroundColor: '#E5E5E5' },
  plateBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: '#FFF',
  },
  platePlateWrap: { alignItems: 'center', gap: 8 },
  plateNumber: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  plateNumberText: { fontSize: 16, fontWeight: '900', color: '#000', letterSpacing: 2 },
  vahanpingBadgeSmall: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  vahanpingTextSmall: { color: '#FFF', fontSize: 10, fontWeight: '800' },

  // Buttons
  orderBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  orderBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  saveDigitalBtn: {
    backgroundColor: '#12121A',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#22223A',
  },
  saveDigitalText: { color: '#888', fontSize: 14, fontWeight: '600' },
});