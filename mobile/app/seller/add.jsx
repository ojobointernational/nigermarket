import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import api from '../../config/api';

const G = '#16a34a';

export default function AddProductScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/products/categories')
      .then(r => setCategories(r.data))
      .catch(console.error);
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return Alert.alert('Required', 'Product name is required.');
    if (!price || isNaN(parseFloat(price))) return Alert.alert('Invalid', 'Enter a valid price.');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('price', parseFloat(price).toFixed(2));
      formData.append('stock', parseInt(stock) || 0);
      if (categoryId) formData.append('category_id', categoryId);
      if (image) {
        const ext = image.uri.split('.').pop().toLowerCase();
        formData.append('image', {
          uri: image.uri,
          name: `product.${ext}`,
          type: `image/${ext}`,
        });
      }

      await api.post('/seller/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('✅ Done', 'Product added successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not add product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.wrap} keyboardShouldPersistTaps="handled">
      <View style={s.form}>
        {/* Image picker */}
        <TouchableOpacity style={s.imgPicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image.uri }} style={s.imgPreview} />
          ) : (
            <View style={s.imgPlaceholder}>
              <Text style={s.imgIcon}>📷</Text>
              <Text style={s.imgHint}>Tap to add photo</Text>
              <Text style={s.imgHint2}>Optional</Text>
            </View>
          )}
        </TouchableOpacity>
        {image && (
          <TouchableOpacity style={s.removeImg} onPress={() => setImage(null)}>
            <Text style={s.removeImgTxt}>Remove photo</Text>
          </TouchableOpacity>
        )}

        <Text style={s.label}>Product Name *</Text>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. iPhone 15 Pro"
          placeholderTextColor="#9ca3af"
        />

        <Text style={s.label}>Description</Text>
        <TextInput
          style={[s.input, s.textarea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe your product..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={s.label}>Price (₦) *</Text>
        <TextInput
          style={s.input}
          value={price}
          onChangeText={setPrice}
          placeholder="0.00"
          placeholderTextColor="#9ca3af"
          keyboardType="decimal-pad"
        />

        <Text style={s.label}>Stock Quantity</Text>
        <TextInput
          style={s.input}
          value={stock}
          onChangeText={setStock}
          placeholder="0"
          placeholderTextColor="#9ca3af"
          keyboardType="number-pad"
        />

        <Text style={s.label}>Category</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.catRow}
          contentContainerStyle={{ gap: 8 }}
        >
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[s.catChip, categoryId === c.id && s.catChipActive]}
              onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
            >
              <Text style={[s.catChipTxt, categoryId === c.id && s.catChipTxtActive]}>
                {c.icon} {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[s.btn, loading && s.btnOff]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnTxt}>Add Product</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f3f4f6' },
  form: { padding: 20 },
  imgPicker: { alignSelf: 'center', marginBottom: 8 },
  imgPreview: { width: 150, height: 150, borderRadius: 12 },
  imgPlaceholder: { width: 150, height: 150, borderRadius: 12, backgroundColor: '#fff', borderWidth: 2, borderColor: '#e5e7eb', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  imgIcon: { fontSize: 36, marginBottom: 6 },
  imgHint: { color: '#6b7280', fontSize: 13, fontWeight: '500' },
  imgHint2: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  removeImg: { alignSelf: 'center', marginBottom: 20 },
  removeImgTxt: { color: '#ef4444', fontSize: 13 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', marginBottom: 16 },
  textarea: { height: 100, paddingTop: 12 },
  catRow: { marginBottom: 20 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb' },
  catChipActive: { backgroundColor: G, borderColor: G },
  catChipTxt: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  catChipTxtActive: { color: '#fff' },
  btn: { backgroundColor: G, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnOff: { opacity: 0.6 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});