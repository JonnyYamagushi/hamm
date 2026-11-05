// Impedir prints e gravação de tela (expo-screen-capture; funciona no Expo Go).
// Android: FLAG_SECURE, que também deixa o app em branco na lista de recentes.
// iOS 13+: bloqueia print e gravação.
import * as ScreenCapture from 'expo-screen-capture';

const KEY = 'hamm-settings';

export async function setScreenCaptureBlocked(blocked: boolean): Promise<void> {
  if (blocked) await ScreenCapture.preventScreenCaptureAsync(KEY);
  else await ScreenCapture.allowScreenCaptureAsync(KEY);
}
