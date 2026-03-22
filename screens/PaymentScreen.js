import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';

const RAZORPAY_KEY = 'rzp_test_SUHS20b7ZKOzJ5';
const BACKEND = 'https://parkping-wwur.onrender.com';

const PLANS = [
  {
    id: 'sticker',
    name: '📦 Physical QR Sticker',
    price: 199,
    description: 'Premium weatherproof QR sticker delivered to your door',
    color: '#FF6B00',
  },
  {
    id: 'sms_pack',
    name: '💬 SMS Pack (50 alerts)',
    price: 99,
    description: '50 SMS alerts for your vehicles',
    color: '#2196F3',
  },
  {
    id: 'call_pack',
    name: '📞 Call Pack (20 calls)',
    price: 99,
    description: '20 anonymous call credits',
    color: '#4CAF50',
  },
];

export default function PaymentScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async (plan) => {
    setLoading(true);
    try {
      const options = {
        description: plan.name,
        image: 'https://vahanping.com/logo.png',
        currency: 'INR',
        key: RAZORPAY_KEY,
        amount: plan.price * 100, // in paise
        name: 'VahanPing',
        prefill: {
          email: '',
          contact: '',
          name: ''
        },
        theme: { color: '#FF6B00' }
      };

      const data = await RazorpayCheckout.open(options);
      
      // Payment successful
      Alert.alert(
        '✅ Payment Successful!',
        `Payment ID: ${data.razorpay_payment_id}\n\nYour ${plan.name} has been activated!`,
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
      );

    } catch (error) {
      if (error.code !== 2) { // 2 = user cancelled
        Alert.alert('Payment Failed', error.description || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Upgrade VahanPing</Text>
          <Text style={styles.headerSub}>Choose a plan to unlock features</Text>
        </View>

        {PLANS.map(plan => (
          <View key={plan.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={[styles.priceBadge, { backgroundColor: plan.color }]}>
                <Text style={styles.priceText}>₹{plan.price}</Text>
              </View>
            </View>
            <Text style={styles.planDesc}>{plan.description}</Text>
            <TouchableOpacity
              style={[styles.buyBtn, { backgroundColor: plan.color }]}
              onPress={() => handlePayment(plan)}
              disabled={loading}
            >
              <Text style={styles.buyBtnText}>Buy Now →</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.secureNote}>
          <Text style={styles.secureText}>🔒 Secured by Razorpay</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  scroll: { padding: 20 },
  header: { marginBottom: 24, paddingTop: 10 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  headerSub: { color: '#666', fontSize: 14, marginTop: 4 },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: { color: '#FFF', fontSize: 16, fontWeight: '700', flex: 1 },
  priceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priceText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  planDesc: { color: '#888', fontSize: 13, marginBottom: 16, lineHeight: 20 },
  buyBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  secureNote: { alignItems: 'center', marginTop: 8 },
  secureText: { color: '#444', fontSize: 13 },
});

