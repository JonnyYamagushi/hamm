import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Suspense, useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DATABASE_NAME, migrateDatabase } from '@/infrastructure/db/migrations';
import { AppProvider, useApp } from '@/ui/app-context';
import { LockProvider } from '@/ui/lock-context';
import { ErrorState, Screen } from '@/ui/primitives';
import { lightPalette } from '@/ui/theme';
import { AppThemeProvider, useTheme } from '@/ui/theme-context';

void SplashScreen.preventAutoHideAsync();

/** Tema escolhido pela pessoa (ou o do sistema) aplicado à navegação e à barra de status. */
function ThemedRoot({ children }: { children: ReactNode }) {
  const { session } = useApp();
  return <AppThemeProvider preference={session?.settings.theme ?? 'system'}>{children}</AppThemeProvider>;
}

function NavigationTheme({ children }: { children: ReactNode }) {
  const { scheme, colors } = useTheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          primary: colors.accent,
          background: colors.background,
          card: colors.background,
          text: colors.text,
          border: colors.border,
        },
      }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {children}
    </ThemeProvider>
  );
}

/** Sem perfil → onboarding; com perfil → abas. A splash só sai depois de decidir. */
function RootNavigator() {
  const { loading, loadError, session, reload } = useApp();
  const { colors } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    void SplashScreen.hideAsync();
    if (loadError) return;
    const inOnboarding = segments[0] === 'onboarding';
    if (!session && !inOnboarding) router.replace('/onboarding');
    else if (session && inOnboarding) router.replace('/inicio');
  }, [loading, loadError, session, segments, router]);

  if (loadError) {
    return (
      <Screen>
        <ErrorState message={loadError} onRetry={() => void reload()} />
      </Screen>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.text },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="ajustes/perfil" options={{ title: 'Perfil' }} />
      <Stack.Screen name="ajustes/aparencia" options={{ title: 'Aparência' }} />
      <Stack.Screen name="ajustes/preferencias" options={{ title: 'Preferências' }} />
      <Stack.Screen name="ajustes/categorias" options={{ title: 'Categorias' }} />
      <Stack.Screen name="ajustes/categoria" options={{ title: 'Categoria', presentation: 'modal' }} />
      <Stack.Screen name="ajustes/seguranca" options={{ title: 'Segurança' }} />
      <Stack.Screen name="ajustes/trocar-pin" options={{ title: 'Trocar PIN', presentation: 'modal' }} />
      <Stack.Screen name="ajustes/aparelho" options={{ title: 'Sobre este aparelho' }} />
      <Stack.Screen name="ajustes/sobre" options={{ title: 'Sobre o app' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Suspense fallback={<View style={{ flex: 1, backgroundColor: lightPalette.background }} />}>
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDatabase} useSuspense>
          <AppProvider>
            <ThemedRoot>
              <NavigationTheme>
                <LockProvider>
                  <RootNavigator />
                </LockProvider>
              </NavigationTheme>
            </ThemedRoot>
          </AppProvider>
        </SQLiteProvider>
      </Suspense>
    </SafeAreaProvider>
  );
}
