import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Dimensions, Animated, Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: '🚗',
    title: 'Welcome to\nVahanPing',
    subtitle: 'India\'s smartest anonymous vehicle contact system',
    color: '#7C3AED',
    bg: '#12121A',
  },
  {
    id: '2',
    icon: '📲',
    title: 'Register Your\nVehicle',
    subtitle: 'Add your car details and get a unique QR code in under 2 minutes',
    color: '#9D65F5',
    bg: '#12121A',
  },
  {
    id: '3',
    icon: '🔒',
    title: '100% Anonymous\nAlways',
    subtitle: 'Your phone number is never revealed. Complete privacy on both sides',
    color: '#10B981',
    bg: '#12121A',
  },
  {
    id: '4',
    icon: '🔔',
    title: 'Instant WhatsApp\nAlerts',
    subtitle: 'Get notified instantly when someone scans your QR code',
    color: '#F59E0B',
    bg: '#12121A',
  },
  {
    id: '5',
    icon: '📦',
    title: 'Premium QR\nStickers',
    subtitle: 'Order weatherproof stickers delivered to your doorstep for just ₹199',
    color: '#EF4444',
    bg: '#12121A',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleDone = async () => {
    await AsyncStorage.setItem('onboarding_done', 'true');
    navigation.replace('Home');
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleDone();
    }
  };

  const handleSkip = () => handleDone();

  const renderSlide = ({ item, index }) => (
    <View style={[styles.slide, { width }]}>
      {/* Logo at top */}
      <View style={styles.logoWrap}>
        <Image source={require('../assets/icon.png')} style={styles.logo} resizeMode="contain"/>
        <Text style={styles.logoText}>Vahan<Text style={{ color: item.color }}>Ping</Text></Text>
      </View>

      {/* Icon */}
      <View style={[styles.iconCircle, { borderColor: item.color, backgroundColor: `${item.color}20` }]}>
        <Text style={styles.slideIcon}>{item.icon}</Text>
      </View>

      {/* Text */}
      <Text style={[styles.slideTitle, { color: '#FFF' }]}>{item.title}</Text>
      <Text style={styles.slideSubtitle}>{item.subtitle}</Text>

      {/* Step indicator */}
      <Text style={[styles.stepText, { color: item.color }]}>{index + 1} / {SLIDES.length}</Text>
    </View>
  );

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
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
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
                backgroundColor: SLIDES[currentIndex].color
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
          {currentIndex === SLIDES.length - 1 ? '🚀 Get Started' : 'Next →'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', alignItems: 'center' },

  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  skipText: { color: '#666', fontSize: 14, fontWeight: '600' },

  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    paddingTop: 100,
  },

  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 48,
  },
  logo: { width: 40, height: 40, borderRadius: 10 },
  logoText: { fontSize: 22, fontWeight: '800', color: '#FFF' },

  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  slideIcon: { fontSize: 56 },

  slideTitle: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 300,
    marginBottom: 24,
  },
  stepText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },

  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },

  nextBtn: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 50,
    marginBottom: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});