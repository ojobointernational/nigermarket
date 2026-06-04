import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../../config/api';

const G = '#16a34a';

export default function EditProduct() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [image, setImage] = useState(null);
  const [oldImage, setOldImage] = useState(null);

  /* =========================
     FETCH PRODUCT DETAILS
  ========================= */
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const token = await AsyncStorage.getItem('token');

        const res = await api.get(`/seller/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const product = res.data.find((p) => p.id.toString() === id);

        if (!product) {
          Alert.alert('Error', 'Product not found');
          router.back();
          return;
        }

        setName(product.name);
        setDescription(product.description || '');
        setPrice(product.price.toString());
        setStock(product.stock?.toString() || '0');
        setCategoryId(product.category_id?.toString() || '');
        setOldImage(product.image_url);
      } catch (err) {
        Alert.alert('Error', 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  /* =========================
     PICK IMAGE
  ========================= */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  /* =========================
     SAVE PRODUCT
  ========================= */
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (!price || isNaN(price)) {
      Alert.alert('Error', 'Valid price required');
      return;
    }

    try {
      setSaving(true);

      const token = await AsyncStorage.getItem('token');

      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('stock', stock);
      formData.append('category_id', categoryId);

      if (image) {
        formData.append('image', {
          uri: image.uri,
          name: 'product.jpg',
          type: 'image/jpeg',
        });
      }

      await api.put(`/seller/products/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Product updated');
      router.back();
    } catch (err) {
      console.log(err?.response?.data || err.message);
      Alert.alert('Error', 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={G} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Product</Text>

      {/* IMAGE */}
      <TouchableOpacity onPress={pickImage} style={styles.imageBox}>
        {image ? (
          <Image source={{ uri: image.uri }} style={styles.image} />
        ) : oldImage ? (
          <Image source={{ uri: oldImage }} style={styles.image} />
        ) : (
          <Text style={{ color: '#666' }}>Tap to select image</Text>
        )}
      </TouchableOpacity>

      {/* FORM */}
      <TextInput
        placeholder="Product name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        style={[styles.input, { height: 90 }]}
        multiline
      />

      <TextInput
        placeholder="Price"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        placeholder="Stock"
        value={stock}
        onChangeText={setStock}
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        placeholder="Category ID"
        value={categoryId}
        onChangeText={setCategoryId}
        style={styles.input}
      />

      {/* BUTTON */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Update Product</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 60,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  imageBox: {
    height: 180,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  button: {
    backgroundColor: G,
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});