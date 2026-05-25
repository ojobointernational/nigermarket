import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import api from '../config/api';

const G = '#16a34a';
const STATUS_COLORS = {
  pending:    { bg: '#fef9c3', text: '#854d0e' },
  confirmed:  { bg: '#dbeafe', text: '#1e40af' },
  processing: { bg: '#fce7f3', text: '#9d174d' },
  shipped:    { bg: '#ede9fe', text: '#5b21b6' },
  delivered:  { bg: '#dcfce7', text: '#166534' },
  cancelled:  { bg: '#fee2e2', text: '#991b1b' },
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    api.get('/orders')
      .then(r => setOrders(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []));

  if (loading) return (
    <View style={s.ctr}>
      <ActivityIndicator size="large" color={G} />
    </View>
  );

  return (
    <FlatList
      style={s.wrap}
      contentContainerStyle={s.list}
      data={orders}
      keyExtractor={item => item.id.toString()}
      ListEmptyComponent={
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📦</Text>
          <Text style={s.emptyTitle}>No orders yet</Text>
          <Text style={s.emptySub}>Your orders will appear here</Text>
        </View>
      }
      renderItem={({ item }) => {
        const sc = STATUS_COLORS[item.status] || STATUS_COLORS.pending;
        return (
          <View style={s.card}>
            <View style={s.cardTop}>
              <Text style={s.orderId}>Order #{item.id}</Text>
              <View style={[s.badge, { backgroundColor: sc.bg }]}>
                <Text style={[s.badgeTxt, { color: sc.text }]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={s.date}>
              {new Date(item.created_at).toLocaleDateString('en-NG', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </Text>
            <Text style={s.address} numberOfLines={2}>📍 {item.delivery_address}</Text>
            <View style={s.cardBottom}>
              <Text style={s.total}>₦{parseFloat(item.total_amount).toLocaleString()}</Text>
              <View style={[s.payBadge, item.payment_status === 'paid'
                ? { backgroundColor: '#dcfce7' }
                : { backgroundColor: '#fef9c3' }
              ]}>
                <Text style={[s.payTxt, item.payment_status === 'paid'
                  ? { color: '#166534' }
                  : { color: '#854d0e' }
                ]}>
                  {item.payment_status === 'paid' ? '✅ Paid' : '⏳ Unpaid'}
                </Text>
              </View>
            </View>
          </View>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f3f4f6' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderId: { fontSize: 16, fontWeight: '800', color: '#111827' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeTxt: { fontSize: 11, fontWeight: '800' },
  date: { fontSize: 13, color: '#9ca3af', marginBottom: 6 },
  address: { fontSize: 13, color: '#4b5563', marginBottom: 12 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
  total: { fontSize: 18, fontWeight: '800', color: G },
  payBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  payTxt: { fontSize: 12, fontWeight: '700' },
  ctr: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#374151' },
  emptySub: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
});