import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';

const RAZORPAY_KEY = 'rzp_test_SUHS20b7ZKOzJ5';
const BACKEND = 'https://parkping-wwur.onrender.com';

const INDIVIDUAL_PLANS = [
  {
    id: 'whatsapp',
    icon: '💬',
    name: 'WhatsApp Alerts',
    price: 99,
    description: 'Instant WhatsApp notification when someone scans your QR',
    highlight: 'Most Popular',
  },
  {
    id: 'call',
    icon: '📞',
    name: 'Anonymous Call',
    price: 199,
    description: 'Masked call so people reach you without knowing your number',
    highlight: null,
  },
  {
    id: 'sticker',
    icon: '📦',
    name: 'QR Sticker',
    price: 199,
    description: 'Premium weatherproof QR sticker delivered to your door',
    highlight: null,
  },
  {
    id: 'sms',
    icon: '📩',
    name: 'SMS Alerts',
    price: 199,
    description: 'Get SMS notifications when your vehicle is contacted',
    highlight: null,
  },
];

export default function PaymentScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handlePayment = async (plan) => {
    setLoading(true);
    try {
      const options = {
        description: plan.name,
        image: 'https://vahanping.com/logo.png',
        currency: 'INR',
        key: RAZORPAY_KEY,
        amount: plan.price * 100,
        name: 'VahanPing',
        prefill: { email: '', contact: '', name: '' },
        theme: { color: '#7C3AED' }
      };

      const data = await RazorpayCheckout.open(options);
      Alert.alert(
        '✅ Payment Successful!',
        `Payment ID: ${data.razorpay_payment_id}\n\n${plan.name} has been activated!`,
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
      );
    } catch (error) {
      if (error.code !== 2) {
        Alert.alert('Payment Failed', 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Upgrade VahanPing</Text>
          <Text style={styles.headerSub}>Protect your vehicle with premium features</Text>
        </View>

        {/* Bundle Card */}
        <View style={styles.bundleCard}>
          <View style={styles.bundleBadge}>
            <Text style={styles.bundleBadgeText}>⚡ BEST VALUE</Text>
          </View>
          <Text style={styles.bundleTitle}>Complete Protection Bundle</Text>
          <Text style={styles.bundleDesc}>
            WhatsApp Alerts + Anonymous Call + QR Sticker + SMS Alerts
          </Text>

          <View style={styles.bundleFeatures}>
            {['💬 WhatsApp Alerts', '📞 Anonymous Call', '📦 QR Sticker', '📩 SMS Alerts'].map(f => (
              <View key={f} style={styles.bundleFeatureRow}>
                <View style={styles.checkCircle}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
                <Text style={styles.bundleFeatureText}>{f}</Text>
              </View>
            ))}
          </View>

          <View style={styles.bundlePriceRow}>
            <View>
              <Text style={styles.originalPrice}>₹796</Text>
              <Text style={styles.saveText}>Save ₹397 (50% off)</Text>
            </View>
            <View style={styles.bundlePriceBadge}>
              <Text style={styles.bundlePrice}>₹399</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.bundleBtn}
            onPress={() => handlePayment({ id: 'bundle', name: 'Complete Protection Bundle', price: 399 })}
            disabled={loading}
          >
            <Text style={styles.bundleBtnText}>Get Bundle — ₹399 →</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or choose individually</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Individual Plans */}
        {INDIVIDUAL_PLANS.map(plan => (
          <View key={plan.id} style={styles.planCard}>
            {plan.highlight && (
              <View style={styles.highlightBadge}>
                <Text style={styles.highlightText}>{plan.highlight}</Text>
              </View>
            )}
            <View style={styles.planTop}>
              <View style={styles.planIconWrap}>
                <Text style={styles.planIcon}>{plan.icon}</Text>
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planDesc}>{plan.description}</Text>
              </View>
              <Text style={styles.planPrice}>₹{plan.price}</Text>
            </View>
            <TouchableOpacity
              style={styles.buyBtn}
              onPress={() => handlePayment(plan)}
              disabled={loading}
            >
              <Text style={styles.buyBtnText}>Buy Now →</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Push Notifications - Coming Soon */}
        <View style={[styles.planCard, styles.comingSoonCard]}>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonBadgeText}>🔜 COMING SOON</Text>
          </View>
          <View style={styles.planTop}>
            <View style={[styles.planIconWrap, styles.planIconWrapDim]}>
              <Text style={styles.planIcon}>🔔</Text>
            </View>
            <View style={styles.planInfo}>
              <Text style={[styles.planName, styles.dimText]}>Push Notifications</Text>
              <Text style={styles.planDesc}>In-app push alerts — coming soon, will be free!</Text>
            </View>
            <Text style={[styles.planPrice, styles.dimText]}>Free</Text>
          </View>
        </View>

        {/* Secure note */}
        <View style={styles.secureNote}>
          <Text style={styles.secureText}>🔒 Secured by Razorpay · 100% Safe</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  scroll: { padding: 20 },

  header: { marginBottom: 24, paddingTop: 10 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  headerSub: { color: '#666', fontSize: 14, marginTop: 4 },

  // Bundle Card
  bundleCard: {
    backgroundColor: '#12121A',
    borderRadius: 20,
    padding: 22,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    position: 'relative',
    overflow: 'hidden',
  },
  bundleBadge: {
    backgroundColor: '#7C3AED',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 14,
  },
  bundleBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  bundleTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', marginBottom: 6 },
  bundleDesc: { color: '#888', fontSize: 13, lineHeight: 20, marginBottom: 16 },

  bundleFeatures: { marginBottom: 20 },
  bundleFeatureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  checkCircle: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderWidth: 1, borderColor: '#7C3AED',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  checkText: { color: '#9D65F5', fontSize: 11, fontWeight: '800' },
  bundleFeatureText: { color: '#CCC', fontSize: 14 },

  bundlePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  originalPrice: { color: '#555', fontSize: 16, textDecorationLine: 'line-through' },
  saveText: { color: '#9D65F5', fontSize: 12, marginTop: 2, fontWeight: '600' },
  bundlePriceBadge: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderWidth: 1, borderColor: '#7C3AED',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
  },
  bundlePrice: { color: '#9D65F5', fontSize: 24, fontWeight: '900' },

  bundleBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  bundleBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#22223A' },
  dividerText: { color: '#555', fontSize: 12, marginHorizontal: 12 },

  // Individual Plan Cards
  planCard: {
    backgroundColor: '#12121A',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#22223A',
    position: 'relative',
    overflow: 'hidden',
  },
  highlightBadge: {
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20, marginBottom: 12,
  },
  highlightText: { color: '#9D65F5', fontSize: 10, fontWeight: '700' },

  planTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  planIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  planIcon: { fontSize: 22 },
  planInfo: { flex: 1 },
  planName: { color: '#FFF', fontSize: 15, fontWeight: '700', marginBottom: 3 },
  planDesc: { color: '#888', fontSize: 12, lineHeight: 18 },
  planPrice: { color: '#9D65F5', fontSize: 20, fontWeight: '900', marginLeft: 8 },

  buyBtn: {
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)',
    borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  buyBtnText: { color: '#9D65F5', fontWeight: '700', fontSize: 14 },

  // Coming Soon
  comingSoonCard: { borderColor: '#22223A', opacity: 0.7 },
  comingSoonBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20, marginBottom: 12,
  },
  comingSoonBadgeText: { color: '#555', fontSize: 10, fontWeight: '700' },
  planIconWrapDim: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: '#333' },
  dimText: { color: '#555' },

  secureNote: { alignItems: 'center', marginTop: 8 },
  secureText: { color: '#444', fontSize: 13 },
});