import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

const G = '#16a34a';

export default function CheckoutScreen() {
  const router = useRouter();

  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/cart').then(r => setCart(r.data)).catch(console.error);
  }, []);

  // ─────────────────────────────────────────────
  // PAYSTACK PAYMENT FLOW
  // ─────────────────────────────────────────────
  const handlePay = async () => {
    if (!address.trim())
      return Alert.alert('Required', 'Enter your delivery address.');

    if (!phone.trim())
      return Alert.alert('Required', 'Enter your phone number.');

    setLoading(true);

    try {
      const payload = {
        delivery_address: address.trim(),
        phone: phone.trim(),
        notes: notes.trim() || undefined,

        total_amount: cart.total,

        items: cart.items.map(item => ({
          product_name: item.name,
          product_price: item.price,
          quantity: item.quantity,
        })),
      };

      console.log('PAYMENT PAYLOAD:', payload);

      const res = await api.post('/payment/initialize', payload);

      const { authorization_url, reference, order_id } = res.data;

      // ✅ FIX 1: Save tracking info locally
      await AsyncStorage.setItem('pending_order_id', String(order_id));
      await AsyncStorage.setItem('pending_reference', reference);

      // Open Paystack
      const result = await WebBrowser.openAuthSessionAsync(
        authorization_url,
        'naijamarket://'
      );

      // ─────────────────────────────────────────────
      // PAYMENT VERIFICATION
      // ─────────────────────────────────────────────
      if (result.type === 'success' || result.type === 'dismiss') {
        setLoading(true);

        try {
          const storedRef = await AsyncStorage.getItem('pending_reference');

          const verify = await api.post('/payment/verify', {
            reference: storedRef || reference,
          });

          await AsyncStorage.removeItem('pending_order_id');
          await AsyncStorage.removeItem('pending_reference');

          Alert.alert(
            '🎉 Payment Successful!',
            `Your order #${order_id} has been confirmed.`,
            [{ text: 'View Orders', onPress: () => router.replace('/orders') }]
          );

        } catch (verifyErr) {
          Alert.alert(
            'Payment Pending',
            'Payment may still be processing. Please check your orders later.',
            [{ text: 'View Orders', onPress: () => router.replace('/orders') }]
          );
        }
      }

    } catch (err) {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Could not process payment.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
      <View style={s.form}>

        {/* ORDER SUMMARY */}
        {cart && (
          <View style={s.summary}>
            <Text style={s.sumTitle}>Order Summary</Text>
            <View style={s.sumRow}>
              <Text style={s.sumLabel}>{cart.count} item(s)</Text>
              <Text style={s.sumTotal}>
                ₦{parseFloat(cart.total).toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        <Text style={s.section}>📍 Delivery Information</Text>

        <Text style={s.label}>Delivery Address *</Text>
        <TextInput
          style={[s.input, s.textarea]}
          value={address}
          onChangeText={setAddress}
          placeholder="Enter full delivery address"
          placeholderTextColor="#9ca3af"
          multiline
        />

        <Text style={s.label}>Phone Number *</Text>
        <TextInput
          style={s.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="08012345678"
          keyboardType="phone-pad"
          placeholderTextColor="#9ca3af"
        />

        <Text style={s.label}>Order Notes (Optional)</Text>
        <TextInput
          style={[s.input, { height: 70 }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any special instructions..."
          multiline
          placeholderTextColor="#9ca3af"
        />

        <View style={s.payNotice}>
          <Text style={s.payNoticeIcon}>🔒</Text>
          <Text style={s.payNoticeText}>
            Secure payment powered by Paystack. You will be redirected to complete payment.
          </Text>
        </View>

        <TouchableOpacity
          style={[s.btn, loading && s.btnOff]}
          onPress={handlePay}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.btnTxt}>
              Pay ₦{cart ? parseFloat(cart.total).toLocaleString() : '...'} with Paystack
            </Text>
          )}
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  form: { padding: 20 },

  summary: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    elevation: 1,
  },

  sumTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sumLabel: { fontSize: 14, color: '#6b7280' },
  sumTotal: { fontSize: 18, fontWeight: '800', color: G },

  section: { fontSize: 16, fontWeight: '800', marginBottom: 16, color: '#111827' },

  label: { fontSize: 13, fontWeight: '700', marginBottom: 6, color: '#374151' },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
  },

  textarea: { height: 90 },

  payNotice: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    gap: 10,
  },

  payNoticeIcon: { fontSize: 18 },

  payNoticeText: {
    flex: 1,
    fontSize: 13,
    color: '#166534',
    lineHeight: 20,
  },

  btn: {
    backgroundColor: G,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },

  btnOff: { opacity: 0.6 },

  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});