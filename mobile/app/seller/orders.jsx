import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import api from '../../config/api';

const G = '#16a34a';

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/seller/orders')
      .then((r) => setOrders(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={G} />
      </View>
    );
  }

  const renderOrder = ({ item: order }) => (
    <View style={styles.card}>
      <View style={styles.cardBody}>

        <View style={styles.header}>
          <View>
            <Text style={styles.orderId}>
              Order #{order.id}
            </Text>

            <Text style={styles.date}>
              {new Date(order.created_at).toLocaleDateString()}
            </Text>
          </View>

          <View
            style={[
              styles.badge,
              order.status === 'delivered'
                ? styles.badgeGreen
                : order.status === 'cancelled'
                ? styles.badgeRed
                : styles.badgeYellow,
            ]}
          >
            <Text style={styles.badgeText}>
              {order.status}
            </Text>
          </View>
        </View>

        <Text style={styles.customer}>
          👤 {order.customer_name} · 📞 {order.phone}
        </Text>

        <Text style={styles.address}>
          📍 {order.delivery_address}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 12 }}
        >
          {order.my_items?.map((product, i) => (
            <View key={i} style={styles.itemChip}>
              <Text style={styles.itemChipText}>
                {product.product_name} × {product.quantity}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.totalRow}>
          <Text style={styles.total}>
            ₦{parseFloat(order.my_total || 0).toLocaleString()}
          </Text>
        </View>

      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Shop Orders ({orders.length})
      </Text>

      {orders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>
            No orders yet
          </Text>
          <Text style={styles.emptyText}>
            Orders for your products will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrder}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
    color: '#111827',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },

  cardBody: {
    padding: 14,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  date: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  badgeGreen: {
    backgroundColor: '#dcfce7',
  },

  badgeRed: {
    backgroundColor: '#fee2e2',
  },

  badgeYellow: {
    backgroundColor: '#fef3c7',
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  customer: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },

  address: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },

  itemChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 6,
  },

  itemChipText: {
    fontSize: 12,
    color: '#374151',
  },

  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
    alignItems: 'flex-end',
  },

  total: {
    fontSize: 18,
    fontWeight: '800',
    color: G,
  },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },

  emptyIcon: {
    fontSize: 64,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    color: '#111827',
  },

  emptyText: {
    marginTop: 6,
    color: '#6b7280',
    textAlign: 'center',
  },
});