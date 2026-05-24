import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

const G = '#16a34a';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password)
      return Alert.alert('Required', 'Enter your email and password.');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email: email.trim().toLowerCase(), password,
      });
      await AsyncStorage.multiSet([
        ['token', res.data.token],
        ['user', JSON.stringify(res.data.user)],
      ]);
      const { role, seller_status } = res.data.user;
      if (role === 'admin') router.replace('/admin');
      else if (role === 'seller') {
        if (seller_status === 'pending') {
          Alert.alert('⏳ Pending Approval', 'Your seller account is awaiting admin approval.');
          await AsyncStorage.multiRemove(['token', 'user']);
        } else if (seller_status === 'rejected') {
          Alert.alert('❌ Rejected', 'Your seller account was rejected. Contact support.');
          await AsyncStorage.multiRemove(['token', 'user']);
        } else {
          router.replace('/seller');
        }
      } else {
        router.replace('/home');
      }
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.hero}>
          <Text style={s.icon}>🛒</Text>
          <Text style={s.title}>Naija Market</Text>
          <Text style={s.sub}>Buy & Sell in Nigeria</Text>
        </View>
        <View style={s.card}>
          <Text style={s.heading}>Welcome Back</Text>
          <Text style={s.label}>Email</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail}
            placeholder="you@email.com" placeholderTextColor="#9ca3af"
            keyboardType="email-address" autoCapitalize="none" />
          <Text style={s.label}>Password</Text>
          <View style={s.passRow}>
            <TextInput style={s.passInput} value={password} onChangeText={setPassword}
              placeholder="Password" placeholderTextColor="#9ca3af"
              secureTextEntry={!showPass} />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eye}>
              <Text>{showPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[s.btn, loading && s.btnOff]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Sign In</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/register')} style={s.link}>
            <Text style={s.linkTxt}>Don't have an account? <Text style={s.linkBold}>Register</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: G },
  scroll: { flexGrow: 1 },
  hero: { alignItems: 'center', paddingTop: 60, paddingBottom: 32 },
  icon: { fontSize: 72, marginBottom: 12 },
  title: { fontSize: 32, fontWeight: '900', color: '#fff' },
  sub: { fontSize: 14, color: '#bbf7d0', marginTop: 4 },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, flex: 1, padding: 28 },
  heading: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#111827', marginBottom: 14 },
  passRow: { flexDirection: 'row', backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, marginBottom: 22, alignItems: 'center' },
  passInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#111827' },
  eye: { paddingHorizontal: 14 },
  btn: { backgroundColor: G, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 14 },
  btnOff: { opacity: 0.6 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  link: { alignItems: 'center' },
  linkTxt: { fontSize: 14, color: '#6b7280' },
  linkBold: { color: G, fontWeight: '700' },
});