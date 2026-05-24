import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
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

  const handlePay = async () => {
    if (!address.trim()) return Alert.alert('Required', 'Enter your delivery address.');
    if (!phone.trim()) return Alert.alert('Required', 'Enter your phone number.');

    setLoading(true);
    try {
      // Initialize payment
      const res = await api.post('/payment/initialize', {
        delivery_address: address.trim(),
        phone: phone.trim(),
        notes: notes.trim() || undefined,
      });

      const { authorization_url, reference, order_id } = res.data;

      // Open Paystack payment page in browser
      const result = await WebBrowser.openAuthSessionAsync(
        authorization_url,
        'naijamarket://' // deep link back to app
      );

      // After browser closes, verify payment
      setLoading(true);
      try {
        const verify = await api.post('/payment/verify', { reference });
        Alert.alert(
          '🎉 Order Confirmed!',
          `Your order #${order_id} has been placed and payment confirmed!`,
          [{ text: 'View Orders', onPress: () => router.replace('/orders') }]
        );
      } catch (verifyErr) {
        Alert.alert(
          'Payment Check',
          'Payment may still be processing. Check your orders in a few minutes.',
          [{ text: 'View Orders', onPress: () => router.replace('/orders') }]
        );
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not process payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
      <View style={s.form}>
        {/* Order summary */}
        {cart && (
          <View style={s.summary}>
            <Text style={s.sumTitle}>Order Summary</Text>
            <View style={s.sumRow}>
              <Text style={s.sumLabel}>{cart.count} item(s)</Text>
              <Text style={s.sumTotal}>₦{parseFloat(cart.total).toLocaleString()}</Text>
            </View>
          </View>
        )}

        <Text style={s.section}>📍 Delivery Information</Text>

        <Text style={s.label}>Delivery Address *</Text>
        <TextInput
          style={[s.input, s.textarea]}
          value={address} onChangeText={setAddress}
          placeholder="House number, street, city, state&#10;e.g. 12 Broad Street, Lagos Island, Lagos"
          placeholderTextColor="#9ca3af"
          multiline numberOfLines={3}
          textAlignVertical="top"
        />

        <Text style={s.label}>Phone Number *</Text>
        <TextInput
          style={s.input}
          value={phone} onChangeText={setPhone}
          placeholder="08012345678"
          placeholderTextColor="#9ca3af"
          keyboardType="phone-pad"
        />

        <Text style={s.label}>Order Notes (Optional)</Text>
        <TextInput
          style={[s.input, { height: 70 }]}
          value={notes} onChangeText={setNotes}
          placeholder="Any special instructions..."
          placeholderTextColor="#9ca3af"
          multiline textAlignVertical="top"
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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  form: { padding: 20 },
  summary: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 20, elevation: 1 },
  sumTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sumLabel: { fontSize: 14, color: '#6b7280' },
  sumTotal: { fontSize: 18, fontWeight: '800', color: G },
  section: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', marginBottom: 16 },
  textarea: { height: 90, paddingTop: 12 },
  payNotice: { flexDirection: 'row', backgroundColor: '#f0fdf4', padding: 14, borderRadius: 10, marginBottom: 20, gap: 10, alignItems: 'flex-start' },
  payNoticeIcon: { fontSize: 18 },
  payNoticeText: { flex: 1, fontSize: 13, color: '#166534', lineHeight: 20 },
  btn: { backgroundColor: G, borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  btnOff: { opacity: 0.6 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});