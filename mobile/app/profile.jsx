import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

const G = '#16a34a';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useFocusEffect(useCallback(() => {
    api.get('/auth/me')
      .then(r => {
        setUser(r.data);
        setName(r.data.name || '');
        setPhone(r.data.phone || '');
        setAddress(r.data.address || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', { name, phone, address });
      setUser(res.data.user);
      setEditing(false);
      Alert.alert('✅ Saved', 'Profile updated successfully!');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['token', 'user']);
          router.replace('/login');
        },
      },
    ]);
  };

  if (loading) return (
    <View style={s.ctr}>
      <ActivityIndicator size="large" color={G} />
    </View>
  );

  return (
    <ScrollView style={s.wrap}>
      {/* Profile header */}
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={s.userName}>{user?.name}</Text>
        <Text style={s.userEmail}>{user?.email}</Text>
        <View style={s.roleBadge}>
          <Text style={s.roleText}>{user?.role?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Edit form */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Personal Information</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Text style={s.editBtn}>{editing ? 'Cancel' : '✏️ Edit'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.label}>Full Name</Text>
        <TextInput
          style={[s.input, !editing && s.inputDisabled]}
          value={name}
          onChangeText={setName}
          editable={editing}
          placeholder="Your full name"
          placeholderTextColor="#9ca3af"
        />

        <Text style={s.label}>Phone Number</Text>
        <TextInput
          style={[s.input, !editing && s.inputDisabled]}
          value={phone}
          onChangeText={setPhone}
          editable={editing}
          placeholder="08012345678"
          placeholderTextColor="#9ca3af"
          keyboardType="phone-pad"
        />

        <Text style={s.label}>Delivery Address</Text>
        <TextInput
          style={[s.input, s.textarea, !editing && s.inputDisabled]}
          value={address}
          onChangeText={setAddress}
          editable={editing}
          placeholder="Your default delivery address"
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {editing && (
          <TouchableOpacity
            style={[s.saveBtn, saving && s.btnOff]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.saveBtnText}>Save Changes</Text>
            }
          </TouchableOpacity>
        )}
      </View>

      {/* Quick links */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Quick Links</Text>
        {[
          { icon: '📦', label: 'My Orders', route: '/orders' },
          { icon: '🛒', label: 'My Cart', route: '/cart' },
        ].map((item) => (
          <TouchableOpacity
            key={item.route}
            style={s.link}
            onPress={() => router.push(item.route)}
          >
            <Text style={s.linkIcon}>{item.icon}</Text>
            <Text style={s.linkLabel}>{item.label}</Text>
            <Text style={s.linkArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={s.logoutBtn} onPress={logout}>
        <Text style={s.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f3f4f6' },
  ctr: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: G, alignItems: 'center', paddingTop: 40, paddingBottom: 30 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#fff' },
  userName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#bbf7d0', marginBottom: 10 },
  roleBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20 },
  roleText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  section: { backgroundColor: '#fff', margin: 16, borderRadius: 14, padding: 16, elevation: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#111827' },
  editBtn: { color: G, fontWeight: '700', fontSize: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', marginBottom: 14 },
  inputDisabled: { backgroundColor: '#f3f4f6', color: '#6b7280', borderColor: '#f3f4f6' },
  textarea: { height: 80, paddingTop: 12 },
  saveBtn: { backgroundColor: G, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnOff: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  link: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  linkIcon: { fontSize: 22, marginRight: 12 },
  linkLabel: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '600' },
  linkArrow: { fontSize: 22, color: '#9ca3af' },
  logoutBtn: { backgroundColor: '#fff', margin: 16, borderRadius: 14, paddingVertical: 16, alignItems: 'center', elevation: 1, borderWidth: 1.5, borderColor: '#fee2e2' },
  logoutText: { color: '#dc2626', fontSize: 16, fontWeight: '700' },
});