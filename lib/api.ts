import axios, { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth.store';
import Constants from 'expo-constants';

const DEFAULT_API_URL = 'https://mahallu-backend-cv55.onrender.com/api/v1';

const getBaseUrl = (): string => {
  let envUrl = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl;
  if (envUrl && envUrl.startsWith('http')) {
    return envUrl;
  }

  // If running in Expo Go on physical device, auto-extract computer IP from bundler hostUri
  const hostUri = Constants.expoConfig?.hostUri 
    || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost
    || (Constants as any).manifest?.debuggerHost;

  const hostIp = hostUri ? hostUri.split(':')[0] : null;

  if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
    return `http://${hostIp}:5000/api/v1`;
  }

  return DEFAULT_API_URL;
};

export const baseURL = getBaseUrl();
export const baseOrigin = baseURL.replace(/\/api\/v1\/?$/, '');

export const apiClient = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokens = useAuthStore.getState().tokens;
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — refresh token silently without auto-logout
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const tokens = useAuthStore.getState().tokens;
        if (tokens?.refreshToken) {
          const { data } = await axios.post(`${baseURL}/auth/refresh`, {
            refreshToken: tokens.refreshToken,
          });
          const newTokens = data.data.tokens;
          useAuthStore.getState().setTokens(newTokens);
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch {
        // Retain current session; user will only be logged out when explicitly tapping Logout
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
