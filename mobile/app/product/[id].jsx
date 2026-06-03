import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
//import api from '../config/api';
import api from '../../config/api';

const G = '#16a34a';
const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${id}`);
      setProduct(res.data);
    } catch (err) {
      Alert.alert('Error', 'Could not load product details.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchProduct(); }, [id]));

  const addToCart = async () => {
    if (!product || product.stock === 0) return;
    setAddingToCart(true);
    try {
      await api.post('/cart', { product_id: product.id, quantity });
      Alert.alert('Added to Cart ✅', `${product.name} has been added to your cart.`, [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => router.push('/cart') },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not add to cart.');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return (
    <View style={s.ctr}>
      <ActivityIndicator size="large" color={G} />
    </View>
  );

  if (!product) return null;

  const isOutOfStock = product.stock === 0;
  const price = parseFloat(product.price).toLocaleString();
  const subtotal = (parseFloat(product.price) * quantity).toLocaleString();

  return (
    <View style={s.wrap}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Product Image */}
        {product.image_url
          ? <Image source={{ uri: product.image_url }} style={s.image} resizeMode="cover" />
          : (
            <View style={s.imagePh}>
              <Text style={{ fontSize: 80 }}>🛍️</Text>
            </View>
          )
        }

        <View style={s.body}>

          {/* Name & Price */}
          <Text style={s.name}>{product.name}</Text>
          <Text style={s.price}>₦{price}</Text>

          {/* Stock badge */}
          <View style={[s.stockBadge, isOutOfStock ? s.stockOut : s.stockIn]}>
            <Text style={[s.stockTxt, isOutOfStock ? s.stockOutTxt : s.stockInTxt]}>
              {isOutOfStock ? '❌ Out of Stock' : `✅ In Stock (${product.stock} available)`}
            </Text>
          </View>

          {/* Divider */}
          <View style={s.divider} />

          {/* Seller info */}
          <View style={s.sellerCard}>
            <Text style={s.sectionLabel}>Seller</Text>
            <View style={s.sellerRow}>
              <Text style={s.sellerIcon}>🏪</Text>
              <View>
                <Text style={s.sellerShop}>{product.seller_shop_name}</Text>
                {product.seller_name && (
                  <Text style={s.sellerName}>by {product.seller_name}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={s.divider} />

          {/* Category */}
          {product.category_name && (
            <>
              <Text style={s.sectionLabel}>Category</Text>
              <Text style={s.categoryTxt}>
                {product.category_icon ? `${product.category_icon} ` : ''}{product.category_name}
              </Text>
              <View style={s.divider} />
            </>
          )}

          {/* Description */}
          {product.description && (
            <>
              <Text style={s.sectionLabel}>Description</Text>
              <Text style={s.description}>{product.description}</Text>
              <View style={s.divider} />
            </>
          )}

          {/* Quantity selector */}
          {!isOutOfStock && (
            <>
              <Text style={s.sectionLabel}>Quantity</Text>
              <View style={s.qtyRow}>
                <TouchableOpacity
                  style={[s.qtyBtn, quantity <= 1 && s.qtyBtnDisabled]}
                  onPress={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Text style={s.qtyBtnTxt}>−</Text>
                </TouchableOpacity>
                <Text style={s.qtyNum}>{quantity}</Text>
                <TouchableOpacity
                  style={[s.qtyBtn, quantity >= product.stock && s.qtyBtnDisabled]}
                  onPress={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                >
                  <Text style={s.qtyBtnTxt}>+</Text>
                </TouchableOpacity>
                <Text style={s.subtotalTxt}>= ₦{subtotal}</Text>
              </View>
              <View style={s.divider} />
            </>
          )}

        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <View style={s.actionBar}>
        <TouchableOpacity
          style={[s.addBtn, (isOutOfStock || addingToCart) && s.addBtnDisabled]}
          onPress={addToCart}
          disabled={isOutOfStock || addingToCart}
          activeOpacity={0.85}
        >
          {addingToCart
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.addBtnTxt}>
                {isOutOfStock ? '❌ Out of Stock' : '🛒 Add to Cart'}
              </Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f3f4f6' },
  ctr: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 100 },

  image: { width, height: 300, backgroundColor: '#e5e7eb' },
  imagePh: { width, height: 300, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },

  body: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -16, padding: 20 },

  name: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 6 },
  price: { fontSize: 26, fontWeight: '900', color: G, marginBottom: 12 },

  stockBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  stockIn: { backgroundColor: '#dcfce7' },
  stockOut: { backgroundColor: '#fee2e2' },
  stockTxt: { fontSize: 12, fontWeight: '700' },
  stockInTxt: { color: '#16a34a' },
  stockOutTxt: { color: '#dc2626' },

  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 16 },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },

  sellerCard: {},
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sellerIcon: { fontSize: 32 },
  sellerShop: { fontSize: 15, fontWeight: '700', color: '#111827' },
  sellerName: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  categoryTxt: { fontSize: 14, color: '#374151', fontWeight: '600' },

  description: { fontSize: 14, color: '#4b5563', lineHeight: 22 },

  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  qtyBtn: { width: 36, height: 36, backgroundColor: '#f3f4f6', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  qtyBtnDisabled: { opacity: 0.35 },
  qtyBtnTxt: { fontSize: 20, fontWeight: '700', color: '#374151' },
  qtyNum: { fontSize: 18, fontWeight: '800', minWidth: 28, textAlign: 'center', color: '#111827' },
  subtotalTxt: { fontSize: 15, fontWeight: '700', color: G, marginLeft: 6 },

  actionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  addBtn: { backgroundColor: G, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  addBtnDisabled: { backgroundColor: '#d1d5db' },
  addBtnTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
