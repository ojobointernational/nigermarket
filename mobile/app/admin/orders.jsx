import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import api from '../../config/api';

const G = '#16a34a';

const STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/orders')
      .then((r) => setOrders(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/admin/orders/${id}/status`, { status });

      setOrders((prev) =>
        prev.map((order) =>
          order.id === id
            ? { ...order, status }
            : order
        )
      );

      Alert.alert(
        'Success',
        `Order #${id} updated to ${status}`
      );
    } catch (err) {
      Alert.alert(
        'Error',
        'Could not update order status.'
      );
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'delivered':
        return styles.greenBadge;
      case 'cancelled':
        return styles.redBadge;
      case 'confirmed':
      case 'processing':
        return styles.blueBadge;
      case 'shipped':
        return styles.grayBadge;
      default:
        return styles.yellowBadge;
    }
  };

  const renderItem = ({ item: order }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.orderId}>
          Order #{order.id}
        </Text>

        <View
          style={[
            styles.badge,
            getStatusStyle(order.status),
          ]}
        >
          <Text style={styles.badgeText}>
            {order.status}
          </Text>
        </View>
      </View>

      <Text style={styles.customer}>
        {order.customer_name}
      </Text>

      <Text style={styles.email}>
        {order.customer_email}
      </Text>

      <Text style={styles.address}>
        📍 {order.delivery_address}
      </Text>

      <Text style={styles.total}>
        ₦
        {parseFloat(
          order.total_amount || 0
        ).toLocaleString()}
      </Text>

      <View style={styles.paymentRow}>
        <Text style={styles.label}>
          Payment:
        </Text>

        <View
          style={[
            styles.badge,
            order.payment_status === 'paid'
              ? styles.greenBadge
              : styles.yellowBadge,
          ]}
        >
          <Text style={styles.badgeText}>
            {order.payment_status}
          </Text>
        </View>
      </View>

      <Text style={styles.date}>
        {new Date(
          order.created_at
        ).toLocaleDateString()}
      </Text>

      <Text style={styles.label}>
        Update Status
      </Text>

      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={order.status}
          onValueChange={(value) =>
            updateStatus(order.id, value)
          }
        >
          {STATUSES.map((status) => (
            <Picker.Item
              key={status}
              label={status}
              value={status}
            />
          ))}
        </Picker>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={G}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        All Orders ({orders.length})
      </Text>

      <FlatList
        data={orders}
        keyExtractor={(item) =>
          item.id.toString()
        }
        renderItem={renderItem}
        contentContainerStyle={{
          paddingBottom: 30,
        }}
      />
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
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  orderId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  customer: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },

  email: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },

  address: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 10,
  },

  total: {
    fontSize: 20,
    fontWeight: '800',
    color: G,
    marginBottom: 10,
  },

  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  label: {
    fontWeight: '700',
    marginBottom: 4,
    marginRight: 8,
  },

  date: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 12,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  greenBadge: {
    backgroundColor: '#dcfce7',
  },

  redBadge: {
    backgroundColor: '#fee2e2',
  },

  yellowBadge: {
    backgroundColor: '#fef3c7',
  },

  blueBadge: {
    backgroundColor: '#dbeafe',
  },

  grayBadge: {
    backgroundColor: '#e5e7eb',
  },

  pickerWrap: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
});