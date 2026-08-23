import 'react-native-gesture-handler';
import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { useAuthStore } from '../store/auth.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60000, retry: 1, refetchOnWindowFocus: false },
  },
});

const ISLAMIC_GREEN = '#059669';

const lightTheme = {
  ...MD3LightTheme,
  colors: { ...MD3LightTheme.colors, primary: ISLAMIC_GREEN, secondary: '#047857' },
};

import { usePushNotifications } from '../lib/hooks/usePushNotifications';

const darkTheme = {
  ...MD3DarkTheme,
  colors: { ...MD3DarkTheme.colors, primary: ISLAMIC_GREEN, secondary: '#34d399' },
};

// Keep the native splash screen up until the persisted auth state has
// rehydrated (see store/auth.store.ts) — hiding it immediately caused a
// flash of the wrong screen while app/index.tsx was still waiting to learn
// whether the user was already logged in.
try {
  require('expo-splash-screen')?.preventAutoHideAsync().catch(() => {});
} catch {
  // Ignore if splash screen not available
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  // Enable real-time sound notifications on notices and events
  usePushNotifications();

  useEffect(() => {
    if (!hasHydrated) return;
    try {
      require('expo-splash-screen')?.hideAsync().catch(() => {});
    } catch {
      // Ignore if splash screen not available
    }
  }, [hasHydrated]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={theme}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(admin)" />
              <Stack.Screen name="(member)" />
              <Stack.Screen name="(student)" />
              {/* <Stack.Screen name="+not-found" /> */}
            </Stack>
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
