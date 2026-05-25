import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Alert, Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../config/api';

const G = '#16a34a';

export default function CartScreen() {
  const router = useRouter();
  const [cart, setCart] = useState({ items: [], total: '0.00', count: 0 });
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      setCart(res.data);
    } catch (err) {
      console.error('Cart error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchCart(); }, []));

  const removeItem = (productId, name) => {
    Alert.alert('Remove', `Remove "${name}" from cart?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/cart/${productId}`);
            fetchCart();
          } catch {
            Alert.alert('Error', 'Could not remove item.');
          }
        },
      },
    ]);
  };

  const updateQty = async (productId, qty) => {
    if (qty < 1) return;
    try {
      await api.put(`/cart/${productId}`, { quantity: qty });
      fetchCart();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not update.');
    }
  };

  if (loading) return (
    <View style={s.ctr}>
      <ActivityIndicator size="large" color={G} />
    </View>
  );

  if (cart.items.length === 0) return (
    <View style={s.empty}>
      <Text style={s.emptyIcon}>🛒</Text>
      <Text style={s.emptyTitle}>Your cart is empty</Text>
      <Text style={s.emptySub}>Add some products to get started</Text>
      <TouchableOpacity style={s.shopBtn} onPress={() => router.push('/home')}>
        <Text style={s.shopBtnTxt}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={s.wrap}>
      <FlatList
        data={cart.items}
        keyExtractor={(item) => item.product_id.toString()}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <View style={s.card}>
            {item.image_url
              ? <Image source={{ uri: item.image_url }} style={s.img} />
              : <View style={[s.img, s.imgPh]}><Text style={{ fontSize: 24 }}>🛍️</Text></View>
            }
            <View style={s.cardBody}>
              <Text style={s.itemName} numberOfLines={2}>{item.name}</Text>
              <Text style={s.shopName}>{item.seller_shop_name}</Text>
              <Text style={s.itemPrice}>₦{parseFloat(item.price).toLocaleString()}</Text>
              <View style={s.qtyRow}>
                <TouchableOpacity style={s.qtyBtn} onPress={() => updateQty(item.product_id, item.quantity - 1)}>
                  <Text style={s.qtyBtnTxt}>−</Text>
                </TouchableOpacity>
                <Text style={s.qtyNum}>{item.quantity}</Text>
                <TouchableOpacity style={s.qtyBtn} onPress={() => updateQty(item.product_id, item.quantity + 1)}>
                  <Text style={s.qtyBtnTxt}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={s.cardRight}>
              <Text style={s.subtotal}>₦{(parseFloat(item.price) * item.quantity).toLocaleString()}</Text>
              <TouchableOpacity onPress={() => removeItem(item.product_id, item.name)}>
                <Text style={{ fontSize: 22 }}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <View style={s.summary}>
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Total ({cart.count} items)</Text>
          <Text style={s.summaryTotal}>₦{parseFloat(cart.total).toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={s.checkoutBtn} onPress={() => router.push('/checkout')}>
          <Text style={s.checkoutBtnTxt}>Proceed to Checkout →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f3f4f6' },
  list: { padding: 16, paddingBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, flexDirection: 'row', padding: 12, marginBottom: 10, elevation: 1 },
  img: { width: 72, height: 72, borderRadius: 8, marginRight: 12 },
  imgPh: { backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  shopName: { fontSize: 11, color: '#9ca3af', marginBottom: 4 },
  itemPrice: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { width: 28, height: 28, backgroundColor: '#f3f4f6', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  qtyBtnTxt: { fontSize: 16, fontWeight: '700', color: '#374151' },
  qtyNum: { fontSize: 15, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  cardRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  subtotal: { fontSize: 15, fontWeight: '800', color: G },
  summary: { backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  summaryLabel: { fontSize: 15, color: '#6b7280' },
  summaryTotal: { fontSize: 18, fontWeight: '800', color: '#111827' },
  checkoutBtn: { backgroundColor: G, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  checkoutBtnTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
  ctr: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 72, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  shopBtn: { backgroundColor: G, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  shopBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});