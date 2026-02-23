import '@expo/metro-runtime';
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import theme from './src/config/theme';
import RootNavigator from './src/navigation/RootNavigator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
});

// On web: center the app in a 430px phone frame with a nice background
// On native: full screen as designed (iPhone 14 Pro Max = 430x932)
function WebFrame({ children }) {
  if (Platform.OS !== 'web') return children;
  return (
    <View style={styles.webOuter}>
      <View style={styles.webPhone}>
        {children}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={theme}>
            <WebFrame>
              <NavigationContainer>
                <RootNavigator />
                <StatusBar style="auto" />
              </NavigationContainer>
            </WebFrame>
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  // Web: grey background, app centered at 430px wide
  webOuter: {
    flex: 1,
    backgroundColor: '#C9D6E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webPhone: {
    flex: 1,
    width: 430,
    maxWidth: 430,
    overflow: 'hidden',
    // Subtle shadow to give "phone on desk" feel
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
});
