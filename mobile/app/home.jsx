import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, StyleSheet,
  RefreshControl, TouchableOpacity, Image, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../config/api';

const G = '#16a34a';

export default function HomeScreen() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cat, setCat] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const load = async (q = '', c = null) => {
    try {
      const [pr, cr, cart] = await Promise.all([
        api.get(`/products?search=${q}${c ? `&category=${c}` : ''}`),
        api.get('/products/categories'),
        api.get('/cart').catch(() => ({ data: { count: 0 } })),
      ]);
      setProducts(pr.data);
      setCategories(cr.data);
      setCartCount(cart.data.count || 0);
    } catch (e) { console.error(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { load(search, cat); }, []));

  const onSearch = (t) => {
    setSearch(t);
    clearTimeout(global._t);
    global._t = setTimeout(() => load(t, cat), 400);
  };

  const onCat = (id) => {
    const n = cat === id ? null : id;
    setCat(n); load(search, n);
  };

  if (loading) return <View style={s.ctr}><ActivityIndicator size="large" color={G}/></View>;

  return (
    <View style={s.wrap}>
      {/* Top bar */}
      <View style={s.bar}>
        <TextInput style={s.search} placeholder="🔍 Search products..." placeholderTextColor="#9ca3af" value={search} onChangeText={onSearch} />
        <TouchableOpacity style={s.cartBtn} onPress={() => router.push('/cart')}>
          <Text style={s.cartIcon}>🛒</Text>
          {cartCount > 0 && <View style={s.badge}><Text style={s.badgeTxt}>{cartCount}</Text></View>}
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catBar} contentContainerStyle={s.catContent}>
        <TouchableOpacity style={[s.chip, !cat && s.chipOn]} onPress={() => onCat(null)}>
          <Text style={[s.chipTxt, !cat && s.chipTxtOn]}>All</Text>
        </TouchableOpacity>
        {categories.map((c) => (
          <TouchableOpacity key={c.id} style={[s.chip, cat===c.id && s.chipOn]} onPress={() => onCat(c.id)}>
            <Text style={[s.chipTxt, cat===c.id && s.chipTxtOn]}>{c.icon} {c.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products */}
      <FlatList
        data={products}
        keyExtractor={i => i.id.toString()}
        numColumns={2}
        columnWrapperStyle={s.row}
        contentContainerStyle={s.grid}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(search, cat); }} colors={[G]} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: 56 }}>🏪</Text>
            <Text style={s.emptyTxt}>No products found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => router.push(`/product/${item.id}`)} activeOpacity={0.9}>
            {item.image_url
              ? <Image source={{ uri: item.image_url }} style={s.img} />
              : <View style={[s.img, s.imgPh]}><Text style={{ fontSize: 36 }}>🛍️</Text></View>
            }
            <View style={s.info}>
              <Text style={s.pName} numberOfLines={2}>{item.name}</Text>
              <Text style={s.shopName} numberOfLines={1}>🏪 {item.seller_shop_name}</Text>
              <Text style={s.price}>₦{parseFloat(item.price).toLocaleString()}</Text>
              {item.stock === 0 && <Text style={s.oos}>Out of stock</Text>}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Bottom nav */}
      <View style={s.nav}>
        {[
          { icon: '🏠', label: 'Home', route: '/home' },
          { icon: '🛒', label: 'Cart', route: '/cart' },
          { icon: '📦', label: 'Orders', route: '/orders' },
          { icon: '👤', label: 'Profile', route: '/profile' },
        ].map((n) => (
          <TouchableOpacity key={n.route} style={s.navItem} onPress={() => router.push(n.route)}>
            <Text style={s.navIcon}>{n.icon}</Text>
            <Text style={s.navLbl}>{n.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f3f4f6' },
  bar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  search: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827' },
  cartBtn: { position: 'relative', padding: 8 },
  cartIcon: { fontSize: 24 },
  badge: { position: 'absolute', top: 2, right: 2, backgroundColor: '#ef4444', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  badgeTxt: { color: '#fff', fontSize: 10, fontWeight: '800', paddingHorizontal: 3 },
  catBar: { backgroundColor: '#fff', maxHeight: 50 },
  catContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f3f4f6', borderWidth: 1.5, borderColor: '#e5e7eb' },
  chipOn: { backgroundColor: G, borderColor: G },
  chipTxt: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  chipTxtOn: { color: '#fff' },
  grid: { padding: 12, paddingBottom: 80 },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  card: { width: '48.5%', backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  img: { width: '100%', height: 140 },
  imgPh: { backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  info: { padding: 10 },
  pName: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 2 },
  shopName: { fontSize: 11, color: '#9ca3af', marginBottom: 4 },
  price: { fontSize: 15, fontWeight: '800', color: G },
  oos: { fontSize: 11, color: '#ef4444', fontWeight: '600', marginTop: 2 },
  ctr: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTxt: { fontSize: 16, color: '#9ca3af', marginTop: 12 },
  nav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingVertical: 8 },
  navItem: { flex: 1, alignItems: 'center' },
  navIcon: { fontSize: 22 },
  navLbl: { fontSize: 10, color: '#9ca3af', marginTop: 2 },
});
