import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
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
  const [refreshing, setRefreshing] = useState(false);

  // 🔥 FIX: reusable fetch function
  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load when screen is focused
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchOrders();
    }, [])
  );

  // 🔥 FIX: Pull-to-refresh support
  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  if (loading) {
    return (
      <View style={s.ctr}>
        <ActivityIndicator size="large" color={G} />
      </View>
    );
  }

  return (
    <FlatList
      style={s.wrap}
      contentContainerStyle={s.list}
      data={orders}
      keyExtractor={item => item.id.toString()}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
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
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>

            <Text style={s.address} numberOfLines={2}>
              📍 {item.delivery_address}
            </Text>

            <View style={s.cardBottom}>
              <Text style={s.total}>
                ₦{parseFloat(item.total_amount).toLocaleString()}
              </Text>

              <View
                style={[
                  s.payBadge,
                  item.payment_status === 'paid'
                    ? { backgroundColor: '#dcfce7' }
                    : { backgroundColor: '#fef9c3' },
                ]}
              >
                <Text
                  style={[
                    s.payTxt,
                    item.payment_status === 'paid'
                      ? { color: '#166534' }
                      : { color: '#854d0e' },
                  ]}
                >
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