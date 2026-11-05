import type { ThemePreference } from '@/domain/profile';
import { useApp, useSession } from '@/ui/app-context';
import { AppText, Screen, Segmented } from '@/ui/primitives';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Igual ao celular' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
];

export default function AparenciaScreen() {
  const { settings } = useSession();
  const { updateSettings } = useApp();
  return (
    <Screen edges={['left', 'right']}>
      <Segmented label="Tema" options={OPTIONS} value={settings.theme} onChange={(theme) => void updateSettings({ theme })} />
      <AppText variant="caption" tone="muted">
        O tamanho do texto segue o ajuste de acessibilidade do celular.
      </AppText>
    </Screen>
  );
}
