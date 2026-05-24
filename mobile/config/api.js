import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// LOCAL TESTING: Run "ipconfig" → find your IPv4 Address → paste below
// PRODUCTION: paste your Render URL
export const BASE_URL = 'https://nigermarket.onrender.com/api'; // ← CHANGE THIS

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token').catch(() => null);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user']).catch(() => {});
    }
    return Promise.reject(err);
  }
);

export default api;
