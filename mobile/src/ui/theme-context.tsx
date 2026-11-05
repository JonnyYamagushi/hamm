import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import type { ThemePreference } from '@/domain/profile';

import { darkPalette, lightPalette, type Palette } from './theme';

type ThemeValue = { scheme: 'light' | 'dark'; colors: Palette };

const ThemeContext = createContext<ThemeValue>({ scheme: 'light', colors: lightPalette });

export function AppThemeProvider({ preference, children }: { preference: ThemePreference; children: ReactNode }) {
  const system = useColorScheme();
  const scheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  const value = useMemo<ThemeValue>(() => ({ scheme, colors: scheme === 'dark' ? darkPalette : lightPalette }), [scheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}

export function useColors(): Palette {
  return useContext(ThemeContext).colors;
}
