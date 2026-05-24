import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

const G = '#16a34a';

export default function RegisterScreen() {
  const router = useRouter();
  const [role, setRole] = useState('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopDesc, setShopDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirm)
      return Alert.alert('Required', 'Please fill all required fields.');
    if (password !== confirm) return Alert.alert('Mismatch', 'Passwords do not match.');
    if (password.length < 6) return Alert.alert('Weak', 'Password must be 6+ characters.');
    if (role === 'seller' && !shopName.trim())
      return Alert.alert('Required', 'Shop name is required for sellers.');

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: name.trim(), email: email.trim().toLowerCase(),
        password, phone: phone.trim()||undefined,
        role, shop_name: shopName.trim()||undefined,
        shop_description: shopDesc.trim()||undefined,
      });

      if (role === 'seller') {
        Alert.alert(
          '✅ Registered!',
          'Your seller account is pending admin approval. You will be able to list products once approved.',
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
      } else {
        await AsyncStorage.multiSet([
          ['token', res.data.token],
          ['user', JSON.stringify(res.data.user)],
        ]);
        router.replace('/home');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.hero}>
          <Text style={s.icon}>🛒</Text>
          <Text style={s.title}>Create Account</Text>
        </View>
        <View style={s.card}>
          {/* Role selector */}
          <Text style={s.label}>I want to:</Text>
          <View style={s.roleRow}>
            {[
              { key: 'customer', label: '🛍️ Shop', sub: 'Buy products' },
              { key: 'seller',   label: '🏪 Sell', sub: 'List products' },
            ].map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[s.roleBtn, role === r.key && s.roleBtnActive]}
                onPress={() => setRole(r.key)}
              >
                <Text style={[s.roleBtnLabel, role === r.key && s.roleBtnLabelActive]}>{r.label}</Text>
                <Text style={[s.roleBtnSub, role === r.key && s.roleBtnSubActive]}>{r.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Full Name *</Text>
          <TextInput style={s.input} value={name} onChangeText={setName}
            placeholder="Your full name" placeholderTextColor="#9ca3af" autoCapitalize="words" />

          <Text style={s.label}>Email *</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail}
            placeholder="you@email.com" placeholderTextColor="#9ca3af"
            keyboardType="email-address" autoCapitalize="none" />

          <Text style={s.label}>Phone Number</Text>
          <TextInput style={s.input} value={phone} onChangeText={setPhone}
            placeholder="08012345678" placeholderTextColor="#9ca3af" keyboardType="phone-pad" />

          {role === 'seller' && (
            <>
              <Text style={s.label}>Shop Name *</Text>
              <TextInput style={s.input} value={shopName} onChangeText={setShopName}
                placeholder="e.g. Emeka Electronics" placeholderTextColor="#9ca3af" />
              <Text style={s.label}>Shop Description</Text>
              <TextInput style={[s.input, s.textarea]} value={shopDesc} onChangeText={setShopDesc}
                placeholder="What do you sell?" placeholderTextColor="#9ca3af" multiline />
            </>
          )}

          <Text style={s.label}>Password *</Text>
          <TextInput style={s.input} value={password} onChangeText={setPassword}
            placeholder="At least 6 characters" placeholderTextColor="#9ca3af" secureTextEntry />

          <Text style={s.label}>Confirm Password *</Text>
          <TextInput style={s.input} value={confirm} onChangeText={setConfirm}
            placeholder="Repeat password" placeholderTextColor="#9ca3af" secureTextEntry />

          <TouchableOpacity style={[s.btn, loading && s.btnOff]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <Text style={s.btnTxt}>
                {role === 'seller' ? 'Apply as Seller' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={s.link}>
            <Text style={s.linkTxt}>Have an account? <Text style={s.linkBold}>Sign In</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: G },
  scroll: { flexGrow: 1 },
  hero: { alignItems: 'center', paddingTop: 50, paddingBottom: 24 },
  icon: { fontSize: 56, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '900', color: '#fff' },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, flex: 1, padding: 24 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  roleBtn: { flex: 1, borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, alignItems: 'center' },
  roleBtnActive: { borderColor: G, backgroundColor: '#f0fdf4' },
  roleBtnLabel: { fontSize: 16, fontWeight: '700', color: '#6b7280' },
  roleBtnLabelActive: { color: G },
  roleBtnSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  roleBtnSubActive: { color: '#16a34a' },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', marginBottom: 14 },
  textarea: { height: 80, textAlignVertical: 'top' },
  btn: { backgroundColor: G, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 4, marginBottom: 14 },
  btnOff: { opacity: 0.6 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  link: { alignItems: 'center' },
  linkTxt: { fontSize: 14, color: '#6b7280' },
  linkBold: { color: G, fontWeight: '700' },
});