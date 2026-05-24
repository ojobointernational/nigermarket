import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const G = '#16a34a';

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const [token, userStr] = await AsyncStorage.multiGet(['token', 'user']);
        if (token[1]) {
          const user = JSON.parse(userStr[1] || '{}');
          if (user.role === 'admin') router.replace('/admin');
          else if (user.role === 'seller') router.replace('/seller');
          else router.replace('/home');
        } else {
          router.replace('/login');
        }
      } catch {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: G }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerStyle: { backgroundColor: G }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: '800' } }}>
        <Stack.Screen name="login"             options={{ headerShown: false }} />
        <Stack.Screen name="register"          options={{ headerShown: false }} />
        <Stack.Screen name="home"              options={{ title: '🛒 Naija Market', headerLeft: () => null }} />
        <Stack.Screen name="cart"              options={{ title: 'My Cart' }} />
        <Stack.Screen name="checkout"          options={{ title: 'Checkout' }} />
        <Stack.Screen name="orders"            options={{ title: 'My Orders' }} />
        <Stack.Screen name="profile"           options={{ title: 'My Profile' }} />
        <Stack.Screen name="product/[id]"      options={{ title: 'Product Details' }} />
        <Stack.Screen name="seller/index"      options={{ title: '🏪 My Shop', headerLeft: () => null }} />
        <Stack.Screen name="seller/add"        options={{ title: 'Add Product' }} />
        <Stack.Screen name="seller/orders"     options={{ title: 'Shop Orders' }} />
        <Stack.Screen name="seller/edit/[id]"  options={{ title: 'Edit Product' }} />
        <Stack.Screen name="admin/index"       options={{ title: '⚙️ Admin', headerLeft: () => null }} />
        <Stack.Screen name="admin/sellers"     options={{ title: 'Manage Sellers' }} />
        <Stack.Screen name="admin/orders"      options={{ title: 'All Orders' }} />
      </Stack>
    </>
  );
}
