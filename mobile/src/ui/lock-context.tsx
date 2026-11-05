// Bloqueio do app (PIN/biometria) e cobertura de privacidade nos apps recentes.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, StyleSheet, View, type AppStateStatus } from 'react-native';

import { setScreenCaptureBlocked } from '@/infrastructure/screen-capture';

import { useApp } from './app-context';
import { LockScreen } from './lock-screen';
import { useColors } from './theme-context';

type LockValue = { lockNow: () => void };

const LockContext = createContext<LockValue>({ lockNow: () => {} });

export function LockProvider({ children }: { children: ReactNode }) {
  const { loading, session } = useApp();
  const colors = useColors();
  const lockable = !!session && !session.profile.isDemo;
  const timeoutMs = (session?.settings.lockTimeoutSeconds ?? 60) * 1000;

  const [locked, setLocked] = useState(false);
  const [covered, setCovered] = useState(false);
  const decidedOnOpen = useRef(false);
  const backgroundAt = useRef<number | null>(null);

  // Ao abrir o app com perfil já criado, começa bloqueado (uma vez; o onboarding não bloqueia).
  useEffect(() => {
    if (loading || decidedOnOpen.current) return;
    decidedOnOpen.current = true;
    setLocked(lockable);
  }, [loading, lockable]);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') {
        setCovered(false);
        const since = backgroundAt.current;
        backgroundAt.current = null;
        if (lockable && since !== null && Date.now() - since >= timeoutMs) setLocked(true);
        return;
      }
      // 'inactive' (iOS: alternador de apps) e 'background': cobre a tela para não aparecer nos recentes.
      if (lockable) setCovered(true);
      if (state === 'background' && backgroundAt.current === null) backgroundAt.current = Date.now();
    };
    const subscription = AppState.addEventListener('change', onChange);
    return () => subscription.remove();
  }, [lockable, timeoutMs]);

  // Opção de Ajustes › Segurança. Falha do sistema nunca impede o uso do app.
  const blockCapture = !!session?.settings.blockScreenCapture;
  useEffect(() => {
    setScreenCaptureBlocked(blockCapture).catch(() => {});
  }, [blockCapture]);

  const lockNow = useCallback(() => {
    if (lockable) setLocked(true);
  }, [lockable]);

  return (
    <LockContext.Provider value={{ lockNow }}>
      {children}
      {locked && lockable ? (
        <View style={StyleSheet.absoluteFill}>
          <LockScreen onUnlock={() => setLocked(false)} />
        </View>
      ) : null}
      {covered && !locked ? (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.cover }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      ) : null}
    </LockContext.Provider>
  );
}

export function useLock(): LockValue {
  return useContext(LockContext);
}
