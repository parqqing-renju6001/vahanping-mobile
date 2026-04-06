  import React, { useState, useRef } from 'react';
  import {
    View, Text, StyleSheet, TouchableOpacity,
    SafeAreaView, ScrollView, TextInput, Image
  } from 'react-native';
  import Svg, { Path } from 'react-native-svg';
  import QRCode from 'react-native-qrcode-svg';
  import ViewShot from 'react-native-view-shot';
  import * as MediaLibrary from 'expo-media-library';
  import CustomModal from './CustomModal';

  const PROFESSIONS = [
    { id: 'doctor',   label: 'Doctor',   image: require('../assets/prof_doctor.jpg') },
    { id: 'engineer', label: 'Engineer', image: require('../assets/prof_engineer.jpg') },
    { id: 'teacher',  label: 'Teacher',  image: require('../assets/prof_teacher.jpg') },
    { id: 'lawyer',   label: 'Advocate', image: require('../assets/prof_lawyer.jpg') },
    { id: 'police',   label: 'Police',   image: require('../assets/prof_police.jpg') },
    { id: 'army',     label: 'Army',     image: require('../assets/prof_army.jpg') },
    { id: 'pilot',    label: 'Pilot',    image: require('../assets/prof_pilot.jpg') },
    { id: 'ca',       label: 'CA',       image: require('../assets/prof_ca.jpg') },
    { id: 'nurse',    label: 'Nurse',    image: require('../assets/prof_nurse.jpg') },
    { id: 'custom',   label: 'Custom',   image: null },
  ];

  const TEMPLATES = [
    { id: 'blackgold', label: 'Black Gold',  image: require('../assets/sticker_blackgold.jpg'),  textColor: '#C9A84C', qrBorder: '#C9A84C' },
    { id: 'bluegold',  label: 'Blue Gold',   image: require('../assets/sticker_bluegold.jpg'),   textColor: '#C9A84C', qrBorder: '#4A90D9' },
    { id: 'greengold', label: 'Green Gold',  image: require('../assets/sticker_greengold.jpg'),  textColor: '#C9A84C', qrBorder: '#2D7A3A' },
    { id: 'pinggold',  label: 'Rose Gold',   image: require('../assets/sticker_pinggold.jpg'),   textColor: '#C9A84C', qrBorder: '#C9A484' },
    { id: 'puregold',  label: 'Pure Gold',   image: require('../assets/sticker_puregold.jpg'),   textColor: '#C9A84C', qrBorder: '#C9A84C' },
    { id: 'redgold',   label: 'Red Gold',    image: require('../assets/sticker_redgold.jpg'),    textColor: '#C9A84C', qrBorder: '#8B1A1A' },
  ];

  const STICKER_SIZE = 300;

  const ArrowLeftIcon = ({ color = '#888' }) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );

  // ── Curved letter helper (ellipse-aware) ─────────────────────────
  const getCurvedLetters = (text) => {
    const cx = 150, cy = 148;
    const rx = 120;
    const ry = 115;
    const chars = text.toUpperCase().split('');
    const charAngle = Math.min(6.5, 48 / chars.length);
    const startAngle = 270 - ((chars.length - 1) / 2) * charAngle;
    return chars.map((char, i) => {
      const angle = startAngle + i * charAngle;
      const rad = angle * Math.PI / 180;
      const x = cx + rx * Math.cos(rad);
      const y = cy + ry * Math.sin(rad);
      // Tangent angle of ellipse — keeps each letter perpendicular to the curve
      const rot = Math.atan2(rx * Math.cos(rad), -(ry * Math.sin(rad))) * 180 / Math.PI;
      return { char, x, y, rot };
    });
  };

  // ── Square Sticker ──────────────────────────────────────────────
  // Template layout:
  //   Top ~20% = profession image area
  //   Middle ~55% = dark QR rectangle area
  //   Bottom ~25% = VahanPing branding strip
  const CircleBadgeSticker = ({ label, template, qrUrl, hasImage, professionImage }) => {
    const { image, qrBorder } = template;
    const SIZE = STICKER_SIZE; // square

    // QR area sits in the middle dark rectangle
    // Top padding ~20%, bottom strip ~22%, so QR area is from 20% to 78%
    const topPad = Math.round(SIZE * 0.20);
    const qrAreaH = Math.round(SIZE * 0.58);
    const qrSize = hasImage ? 90 : 110;

    return (
      <View style={{ width: SIZE, height: SIZE, position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
        {/* Background template image */}
        <Image
          source={image}
          style={{ width: SIZE, height: SIZE, position: 'absolute' }}
          resizeMode="cover"
        />

        {/* Profession image + label — top strip */}
        <View style={{
          position: 'absolute',
          top: Math.round(SIZE * 0.04),
          left: 0, right: 0,
          height: Math.round(SIZE * 0.22),
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 16,
          gap: 10,
        }}>
          {hasImage && professionImage && (
            <Image
              source={professionImage}
              style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: qrBorder }}
              resizeMode="cover"
            />
          )}
          {label ? (
            <Text style={{
              color: qrBorder,
              fontSize: 13,
              fontWeight: '900',
              letterSpacing: 2,
              textTransform: 'uppercase',
              textShadowColor: 'rgba(0,0,0,0.9)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            }}>
              {label.toUpperCase()}
            </Text>
          ) : null}
        </View>

        {/* QR code — centered in dark rectangle area */}
        <View style={{
          position: 'absolute',
          top: topPad,
          left: 0, right: 0,
          height: qrAreaH,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <View style={{
            backgroundColor: '#fff',
            padding: 5,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: qrBorder,
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 4,
          }}>
            <QRCode value={qrUrl} size={qrSize} backgroundColor="white" color="#000" />
          </View>
        </View>
      </View>
    );
  };

  // ── Main Screen ───────────────────────────────────────────────────
  export default function StickerDesignScreen({ route, navigation }) {
    const { vehicle } = route.params;
    const [selectedProfession, setSelectedProfession] = useState(null);
    const [customText, setCustomText] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
    const [saving, setSaving] = useState(false);
    const [modal, setModal] = useState({ visible: false, icon: '', title: '', message: '' });
    const viewShotRef = useRef();

    const closeModal = () => setModal(m => ({ ...m, visible: false }));
    const showModal = (icon, title, message) => setModal({ visible: true, icon, title, message });

    const qrUrl = `https://www.vahanping.com/scan/${vehicle.token}`;
    const professionLabel = selectedProfession?.id === 'custom' ? customText : selectedProfession?.label || '';
    const isCustom = selectedProfession?.id === 'custom';
    const hasImage = !!(selectedProfession?.image && !isCustom);

    const saveDigital = async () => {
      try {
        setSaving(true);
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          showModal('⚠️', 'Permission Needed', 'Please allow access to save images.');
          return;
        }
        const uri = await viewShotRef.current.capture();
        await MediaLibrary.saveToLibraryAsync(uri);
        showModal('✅', 'Saved!', 'Sticker saved to your gallery.');
      } catch (e) {
        showModal('❌', 'Error', 'Could not save. Please try again.');
      } finally {
        setSaving(false);
      }
    };

    return (
      <SafeAreaView style={s.container}>

        <CustomModal
          visible={modal.visible}
          icon={modal.icon}
          title={modal.title}
          message={modal.message}
          buttons={[{ text: 'OK', style: 'primary', onPress: closeModal }]}
          onClose={closeModal}
        />

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          <View style={s.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <ArrowLeftIcon color="#888" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={s.headerTitle}>Design Your Sticker</Text>
              <Text style={s.headerSub}>Choose your premium sticker style</Text>
            </View>
          </View>

          {/* 01 — Template */}
          <View style={s.sectionCard}>
            <Text style={s.sectionLabel}>01 — Choose Template</Text>
            <View style={s.templateRow}>
              {TEMPLATES.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[s.templateChip, selectedTemplate.id === t.id && s.templateChipActive]}
                  onPress={() => setSelectedTemplate(t)}
                >
                  <Image source={t.image} style={s.templateThumb} resizeMode="cover" />
                  <Text style={[s.templateLabel, selectedTemplate.id === t.id && { color: '#FFF' }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 02 — Profession */}
          <View style={s.sectionCard}>
            <Text style={s.sectionLabel}>02 — Profession</Text>
            <View style={s.professionGrid}>
              {PROFESSIONS.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[s.professionChip, selectedProfession?.id === p.id && s.professionChipActive]}
                  onPress={() => setSelectedProfession(p)}
                >
                  {p.image ? (
                    <Image source={p.image} style={s.profChipImage} resizeMode="cover" />
                  ) : (
                    <View style={s.profChipCustom}>
                      <Text style={{ color: '#9D65F5', fontSize: 10, fontWeight: '800' }}>ABC</Text>
                    </View>
                  )}
                  <Text style={[s.professionLabel, selectedProfession?.id === p.id && s.professionLabelActive]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedProfession?.id === 'custom' && (
              <TextInput
                style={s.customInput}
                placeholder="Enter your profession..."
                placeholderTextColor="#333"
                value={customText}
                onChangeText={setCustomText}
                maxLength={12}
                autoCapitalize="words"
              />
            )}
          </View>

          {/* 03 — Preview */}
          <View style={s.sectionCard}>
            <Text style={s.sectionLabel}>03 — Preview</Text>
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
                <CircleBadgeSticker
                  label={professionLabel}
                  template={selectedTemplate}
                  qrUrl={qrUrl}
                  hasImage={hasImage}
                  professionImage={selectedProfession?.image}
                />
              </ViewShot>
            </View>
          </View>

          <TouchableOpacity style={s.orderBtn} onPress={() => navigation.navigate('Payment', { autoOpenPlan: 'sticker', stickerTemplate: selectedTemplate.id, vehiclePlate: vehicle.plate, vehicleToken: vehicle.token })}>
            <Text style={s.orderBtnText}>Order This Sticker — ₹199</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.saveDigitalBtn} onPress={saveDigital} disabled={saving}>
            <Text style={s.saveDigitalText}>{saving ? 'Saving...' : 'Save as Digital Copy'}</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#080808' },
    scroll: { padding: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingTop: 10 },
    backBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#0E0E0E', borderWidth: 1, borderColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFF', letterSpacing: -0.3 },
    headerSub: { color: '#444', fontSize: 12, marginTop: 2 },
    sectionCard: { backgroundColor: '#0E0E0E', borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#1A1A1A' },
    sectionLabel: { color: '#555', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 14 },
    templateRow: { flexDirection: 'row', gap: 10 },
    templateChip: { flex: 1, alignItems: 'center', gap: 8, backgroundColor: '#141414', borderRadius: 12, borderWidth: 1, borderColor: '#1A1A1A', padding: 10 },
    templateChipActive: { borderColor: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.08)' },
    templateThumb: { width: 60, height: 60, borderRadius: 30 },
    templateLabel: { color: '#555', fontSize: 11, fontWeight: '700' },
    professionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    professionChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#141414', borderRadius: 50, borderWidth: 1, borderColor: '#1A1A1A', paddingHorizontal: 10, paddingVertical: 7 },
    professionChipActive: { borderColor: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.08)' },
    profChipImage: { width: 24, height: 24, borderRadius: 12 },
    profChipCustom: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(157,101,245,0.1)', alignItems: 'center', justifyContent: 'center' },
    professionLabel: { fontSize: 12, color: '#666', fontWeight: '600' },
    professionLabelActive: { color: '#9D65F5' },
    customInput: { backgroundColor: '#141414', borderRadius: 10, borderWidth: 1, borderColor: '#7C3AED', color: '#FFF', fontSize: 14, padding: 12, marginTop: 12 },
    orderBtn: { backgroundColor: '#7C3AED', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
    orderBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
    saveDigitalBtn: { backgroundColor: '#0E0E0E', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1A1A1A' },
    saveDigitalText: { color: '#9D65F5', fontSize: 14, fontWeight: '600' },
  });
