import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../config/api';

const G = '#16a34a';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    api.get('/admin/dashboard')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []));

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    router.replace('/login');
  };

  if (loading) return <View style={s.ctr}><ActivityIndicator size="large" color={G}/></View>;

  return (
    <ScrollView style={s.wrap}>
      <View style={s.header}>
        <Text style={s.title}>⚙️ Admin Panel</Text>
        <TouchableOpacity onPress={logout} style={s.logout}>
          <Text style={s.logoutTxt}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats grid */}
      {stats && (
        <View style={s.grid}>
          {[
            { icon: '👥', label: 'Customers',   val: stats.total_customers },
            { icon: '🏪', label: 'Sellers',     val: stats.total_sellers },
            { icon: '📦', label: 'Products',    val: stats.total_products },
            { icon: '🧾', label: 'Orders',      val: stats.total_orders },
            { icon: '💰', label: 'Revenue',     val: `₦${stats.total_revenue.toLocaleString()}` },
          ].map((x, i) => (
            <View key={i} style={s.statBox}>
              <Text style={s.statIcon}>{x.icon}</Text>
              <Text style={s.statVal}>{x.val}</Text>
              <Text style={s.statLbl}>{x.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Quick actions */}
      <Text style={s.section}>Quick Actions</Text>
      {[
        { icon: '🏪', label: 'Manage Sellers',   sub: 'Approve or reject seller applications', route: '/admin/sellers' },
        { icon: '🧾', label: 'View All Orders',  sub: 'See and update all customer orders',    route: '/orders' },
      ].map((a) => (
        <TouchableOpacity key={a.route} style={s.action} onPress={() => router.push(a.route)}>
          <Text style={s.actionIcon}>{a.icon}</Text>
          <View style={s.actionBody}>
            <Text style={s.actionLabel}>{a.label}</Text>
            <Text style={s.actionSub}>{a.sub}</Text>
          </View>
          <Text style={s.arrow}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  logout: { backgroundColor: '#fee2e2', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  logoutTxt: { color: '#dc2626', fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  statBox: { width: '47%', backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', elevation: 1 },
  statIcon: { fontSize: 28, marginBottom: 6 },
  statVal: { fontSize: 22, fontWeight: '900', color: G },
  statLbl: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  section: { fontSize: 16, fontWeight: '800', color: '#111827', paddingHorizontal: 16, paddingVertical: 12 },
  action: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, borderRadius: 14, padding: 16, elevation: 1 },
  actionIcon: { fontSize: 28, marginRight: 14 },
  actionBody: { flex: 1 },
  actionLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  actionSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  arrow: { fontSize: 24, color: '#9ca3af' },
  ctr: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});