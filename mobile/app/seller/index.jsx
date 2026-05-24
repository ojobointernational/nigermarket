import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Alert, Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../config/api';

const G = '#16a34a';

export default function SellerDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shopName, setShopName] = useState('My Shop');

  const load = async () => {
    try {
      const [pr, st, userStr] = await Promise.all([
        api.get('/seller/products'),
        api.get('/seller/dashboard'),
        AsyncStorage.getItem('user'),
      ]);
      setProducts(pr.data);
      setStats(st.data);
      if (userStr) setShopName(JSON.parse(userStr).shop_name || 'My Shop');
    } catch (e) { console.error(e.message); }
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const del = (id, name) => Alert.alert('Delete', `Delete "${name}"?`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      try {
        await api.delete(`/seller/products/${id}`);
        setProducts(p => p.filter(x => x.id !== id));
      } catch { Alert.alert('Error', 'Could not delete.'); }
    }},
  ]);

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    router.replace('/login');
  };

  if (loading) return <View style={s.ctr}><ActivityIndicator size="large" color={G}/></View>;

  return (
    <View style={s.wrap}>
      <View style={s.header}>
        <View>
          <Text style={s.shopLabel}>🏪 {shopName}</Text>
          <Text style={s.shopSub}>Seller Dashboard</Text>
        </View>
        <View style={s.headerBtns}>
          <TouchableOpacity style={s.ordersBtn} onPress={() => router.push('/seller/orders')}>
            <Text style={s.ordersBtnTxt}>📦 Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.logoutBtn} onPress={logout}>
            <Text style={s.logoutTxt}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      {stats && (
        <View style={s.stats}>
          {[
            { n: stats.total_products, l: 'Products' },
            { n: stats.total_orders,   l: 'Orders' },
            { n: `₦${stats.total_revenue.toLocaleString()}`, l: 'Revenue' },
          ].map((x, i) => (
            <View key={i} style={s.statBox}>
              <Text style={s.statNum}>{x.n}</Text>
              <Text style={s.statLbl}>{x.l}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={s.section}>My Products ({products.length})</Text>

      <FlatList
        data={products}
        keyExtractor={i => i.id.toString()}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: 48 }}>📦</Text>
            <Text style={s.emptyTxt}>No products yet. Add your first one!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            {item.image_url
              ? <Image source={{ uri: item.image_url }} style={s.img} />
              : <View style={[s.img, s.imgPh]}><Text style={{ fontSize: 24 }}>🛍️</Text></View>
            }
            <View style={s.cardBody}>
              <Text style={s.cName} numberOfLines={1}>{item.name}</Text>
              <Text style={s.cPrice}>₦{parseFloat(item.price).toLocaleString()}</Text>
              <Text style={[s.cStock, item.stock===0 && s.cStockLow]}>
                Stock: {item.stock} {item.stock===0 ? '⚠️' : ''}
              </Text>
            </View>
            <View style={s.actions}>
              <TouchableOpacity onPress={() => router.push(`/seller/edit/${item.id}`)}>
                <Text style={{ fontSize: 22 }}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => del(item.id, item.name)}>
                <Text style={{ fontSize: 22 }}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={s.fab} onPress={() => router.push('/seller/add')}>
        <Text style={s.fabTxt}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  shopLabel: { fontSize: 17, fontWeight: '800', color: '#111827' },
  shopSub: { fontSize: 12, color: '#9ca3af' },
  headerBtns: { flexDirection: 'row', gap: 8 },
  ordersBtn: { backgroundColor: '#f0fdf4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  ordersBtnTxt: { color: G, fontWeight: '700', fontSize: 13 },
  logoutBtn: { backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  logoutTxt: { color: '#dc2626', fontWeight: '700', fontSize: 13 },
  stats: { flexDirection: 'row', padding: 16, gap: 10 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', elevation: 1 },
  statNum: { fontSize: 20, fontWeight: '900', color: G },
  statLbl: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  section: { fontSize: 15, fontWeight: '700', color: '#374151', paddingHorizontal: 16, paddingVertical: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: { backgroundColor: '#fff', borderRadius: 12, flexDirection: 'row', padding: 12, marginBottom: 10, elevation: 1 },
  img: { width: 68, height: 68, borderRadius: 8, marginRight: 12 },
  imgPh: { backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, justifyContent: 'center' },
  cName: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 3 },
  cPrice: { fontSize: 14, fontWeight: '800', color: G, marginBottom: 2 },
  cStock: { fontSize: 12, color: '#6b7280' },
  cStockLow: { color: '#ef4444', fontWeight: '700' },
  actions: { justifyContent: 'space-around', paddingVertical: 4 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: G, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  fabTxt: { color: '#fff', fontSize: 32, lineHeight: 36 },
  ctr: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTxt: { fontSize: 14, color: '#9ca3af', marginTop: 10 },
});