// Detecta o ambiente (Expo Go × app instalado) e a biometria do aparelho.
import { isRunningInExpoGo } from 'expo';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

import type { Runtime } from '@/domain/capabilities';

export async function detectRuntime(): Promise<Runtime> {
  const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
  if (platform === 'web') {
    return { platform, isExpoGo: false, biometricHardware: false, biometricEnrolled: false, hasFaceRecognition: false };
  }
  const [hardware, enrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);
  return {
    platform,
    isExpoGo: isRunningInExpoGo(),
    biometricHardware: hardware,
    biometricEnrolled: enrolled,
    hasFaceRecognition: types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION),
  };
}

export type BiometricResult = 'success' | 'cancelled' | 'failed';

export async function authenticateWithBiometrics(promptMessage: string): Promise<BiometricResult> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Usar PIN',
      disableDeviceFallback: false,
    });
    if (result.success) return 'success';
    return result.error === 'user_cancel' || result.error === 'system_cancel' || result.error === 'app_cancel'
      ? 'cancelled'
      : 'failed';
  } catch {
    return 'failed';
  }
}
