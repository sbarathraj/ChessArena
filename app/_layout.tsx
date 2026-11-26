import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../src/services/supabase/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { UsernameOnboardingModal } from '../src/components/auth/UsernameOnboardingModal';
import { IncomingChallengeModal } from '../src/components/social/IncomingChallengeModal';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <UsernameOnboardingModal />
      <IncomingChallengeModal />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#262421',
          },
          headerTintColor: '#81B64C',
          headerTitleStyle: {
            fontWeight: '700',
          },
          contentStyle: {
            backgroundColor: '#302E2B',
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="game/vs-computer"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="game/pass-and-play"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="game/[id]"
          options={{ title: 'Live Match', presentation: 'card' }}
        />
      </Stack>
    </AuthProvider>
  );
}
