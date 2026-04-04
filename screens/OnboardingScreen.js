import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Dimensions, Animated, Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Rect, Polyline } from 'react-native-svg';

const { width } = Dimensions.get('window');

// SVG Icons for each slide
const CarIcon = ({ color, size = 56 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 17H3a2 2 0 01-2-2v-4l2.5-6h13L19 11v4a2 2 0 01-2 2h-2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx="7.5" cy="17.5" r="2.5" stroke={color} strokeWidth="1.5"/>
    <Circle cx="16.5" cy="17.5" r="2.5" stroke={color} strokeWidth="1.5"/>
    <Path d="M5 11h14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const QRIcon = ({ color, size = 56 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5"/>
    <Rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5"/>
    <Rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5"/>
    <Path d="M14 14h2v2h-2zM18 14h3M14 18h2M18 18h3v3M20 14v2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Rect x="5" y="5" width="3" height="3" rx="0.5" fill={color}/>
    <Rect x="16" y="5" width="3" height="3" rx="0.5" fill={color}/>
    <Rect x="5" y="16" width="3" height="3" rx="0.5" fill={color}/>
  </Svg>
);

const LockIcon = ({ color, size = 56 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="1.5"/>
    <Path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Circle cx="12" cy="16" r="1.5" fill={color}/>
    <Path d="M12 17.5v2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const BellIcon = ({ color, size = 56 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Circle cx="18" cy="5" r="3" fill={color} opacity="0.8"/>
  </Svg>
);

const StickerIcon = ({ color, size = 56 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="2" width="20" height="20" rx="4" stroke={color} strokeWidth="1.5"/>
    <Path d="M2 9h20M9 9v13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Circle cx="15.5" cy="15.5" r="2.5" stroke={color} strokeWidth="1.5"/>
    <Path d="M6 5.5h.01M6 13.5h.01" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

const SLIDES = [
  {
    id: '1',
    Icon: CarIcon,
    title: 'Welcome to\nVahanPing',
    subtitle: 'India\'s smartest anonymous vehicle contact system',
    color: '#7C3AED',
  },
  {
    id: '2',
    Icon: QRIcon,
    title: 'Register Your\nVehicle',
    subtitle: 'Add your car details and get a unique QR code in under 2 minutes',
    color: '#9D65F5',
  },
  {
    id: '3',
    Icon: LockIcon,
    title: '100% Anonymous\nAlways',
    subtitle: 'Your phone number is never revealed. Complete privacy on both sides',
    color: '#10B981',
  },
  {
    id: '4',
    Icon: BellIcon,
    title: 'Instant\nAlerts',
    subtitle: 'Get notified instantly when someone scans your QR code',
    color: '#F59E0B',
  },
  {
    id: '5',
    Icon: StickerIcon,
    title: 'Premium QR\nStickers',
    subtitle: 'Order weatherproof stickers delivered to your doorstep for just ₹199',
    color: '#EF4444',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleDone = async () => {
    await AsyncStorage.setItem('onboarding_done', 'true');
    navigation.replace('PhoneAuth');
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleDone();
    }
  };

  const handleSkip = () => handleDone();

  const renderSlide = ({ item, index }) => {
    const { Icon, color, title, subtitle } = item;
    return (
      <View style={[styles.slide, { width }]}>
        {/* Logo at top */}
        <View style={styles.logoWrap}>
          <Image source={require('../assets/icon.png')} style={styles.logo} resizeMode="contain"/>
          <Text style={styles.logoText}>Vahan<Text style={{ color }}>Ping</Text></Text>
        </View>

        {/* SVG Icon */}
        <View style={[styles.iconCircle, { borderColor: color, backgroundColor: `${color}18` }]}>
          <Icon color={color} size={56} />
        </View>

        {/* Text */}
        <Text style={styles.slideTitle}>{title}</Text>
        <Text style={styles.slideSubtitle}>{subtitle}</Text>

        {/* Step indicator */}
        <Text style={[styles.stepText, { color }]}>{index + 1} / {SLIDES.length}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>

      {/* Skip button */}
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={e => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((slide, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: 'clamp' });
          const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
          return (
            <Animated.View
              key={i}
              style={[styles.dot, {
                width: dotWidth,
                opacity,
                backgroundColor: SLIDES[currentIndex].color,
              }]}
            />
          );
        })}
      </View>

      {/* Next / Get Started button */}
      <TouchableOpacity
        style={[styles.nextBtn, { backgroundColor: SLIDES[currentIndex].color }]}
        onPress={handleNext}
      >
        <Text style={styles.nextBtnText}>
          {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center' },
  skipBtn:     { position: 'absolute', top: 56, right: 24, zIndex: 10, padding: 8 },
  skipText:    { color: '#777777', fontSize: 14, fontWeight: '600' },
  slide:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, paddingTop: 100 },
  logoWrap:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 48 },
  logo:        { width: 40, height: 40, borderRadius: 10 },
  logoText:    { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  iconCircle:  { width: 120, height: 120, borderRadius: 60, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  slideTitle:  { fontSize: 32, fontWeight: '900', textAlign: 'center', lineHeight: 40, marginBottom: 16, letterSpacing: -0.5, color: '#1A1A1A' },
  slideSubtitle: { fontSize: 16, color: '#666666', textAlign: 'center', lineHeight: 26, maxWidth: 300, marginBottom: 24 },
  stepText:    { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  dotsRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  dot:         { height: 8, borderRadius: 4 },
  nextBtn:     { paddingHorizontal: 48, paddingVertical: 16, borderRadius: 50, marginBottom: 16, minWidth: 200, alignItems: 'center' },
  nextBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
