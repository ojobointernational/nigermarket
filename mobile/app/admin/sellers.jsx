import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import api from '../../config/api';

const G = '#16a34a';
const STATUS = {
  pending:  { bg: '#fef9c3', text: '#854d0e', label: '⏳ Pending' },
  approved: { bg: '#dcfce7', text: '#166534', label: '✅ Approved' },
  rejected: { bg: '#fee2e2', text: '#991b1b', label: '❌ Rejected' },
};

export default function SellersScreen() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    api.get('/admin/sellers').then(r => setSellers(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []));

  const approve = (id, name) => Alert.alert('Approve', `Approve ${name}'s shop?`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Approve ✅', onPress: async () => {
      try {
        await api.put(`/admin/sellers/${id}/approve`);
        setSellers(s => s.map(x => x.id===id ? {...x, seller_status:'approved'} : x));
        Alert.alert('✅ Approved!', `${name} can now list products.`);
      } catch { Alert.alert('Error', 'Could not approve.'); }
    }},
  ]);

  const reject = (id, name) => Alert.alert('Reject', `Reject ${name}'s application?`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Reject ❌', style: 'destructive', onPress: async () => {
      try {
        await api.put(`/admin/sellers/${id}/reject`);
        setSellers(s => s.map(x => x.id===id ? {...x, seller_status:'rejected'} : x));
      } catch { Alert.alert('Error', 'Could not reject.'); }
    }},
  ]);

  if (loading) return <View style={s.ctr}><ActivityIndicator size="large" color={G}/></View>;

  const pending  = sellers.filter(x => x.seller_status === 'pending');
  const approved = sellers.filter(x => x.seller_status === 'approved');
  const rejected = sellers.filter(x => x.seller_status === 'rejected');

  return (
    <FlatList
      style={s.wrap}
      contentContainerStyle={s.list}
      data={[...pending, ...approved, ...rejected]}
      keyExtractor={i => i.id.toString()}
      ListHeaderComponent={
        <View style={s.counts}>
          <Text style={s.countTxt}>⏳ {pending.length} pending</Text>
          <Text style={s.countTxt}>✅ {approved.length} approved</Text>
          <Text style={s.countTxt}>❌ {rejected.length} rejected</Text>
        </View>
      }
      ListEmptyComponent={<Text style={s.empty}>No sellers yet.</Text>}
      renderItem={({ item }) => {
        const st = STATUS[item.seller_status] || STATUS.pending;
        return (
          <View style={s.card}>
            <View style={s.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={s.shopName}>🏪 {item.shop_name}</Text>
                <Text style={s.ownerName}>{item.name} · {item.email}</Text>
                {item.phone && <Text style={s.phone}>📞 {item.phone}</Text>}
                {item.shop_description && <Text style={s.desc} numberOfLines={2}>{item.shop_description}</Text>}
              </View>
              <View style={[s.badge, { backgroundColor: st.bg }]}>
                <Text style={[s.badgeTxt, { color: st.text }]}>{st.label}</Text>
              </View>
            </View>
            {item.seller_status === 'pending' && (
              <View style={s.btns}>
                <TouchableOpacity style={s.approveBtn} onPress={() => approve(item.id, item.name)}>
                  <Text style={s.approveTxt}>✅ Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.rejectBtn} onPress={() => reject(item.id, item.name)}>
                  <Text style={s.rejectTxt}>❌ Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f3f4f6' },
  list: { padding: 16 },
  counts: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 14, elevation: 1 },
  countTxt: { fontSize: 13, fontWeight: '600', color: '#374151' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, elevation: 1 },
  cardTop: { flexDirection: 'row', gap: 12 },
  shopName: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 2 },
  ownerName: { fontSize: 13, color: '#6b7280', marginBottom: 2 },
  phone: { fontSize: 12, color: '#9ca3af', marginBottom: 4 },
  desc: { fontSize: 12, color: '#9ca3af' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  btns: { flexDirection: 'row', gap: 10, marginTop: 14 },
  approveBtn: { flex: 1, backgroundColor: '#dcfce7', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  approveTxt: { color: '#166534', fontWeight: '700' },
  rejectBtn: { flex: 1, backgroundColor: '#fee2e2', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  rejectTxt: { color: '#dc2626', fontWeight: '700' },
  ctr: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 60, fontSize: 16 },
});