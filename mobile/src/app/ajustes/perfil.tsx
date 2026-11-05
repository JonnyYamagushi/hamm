import { router } from 'expo-router';
import { useState } from 'react';

import { validateDisplayName } from '@/domain/profile';
import { useApp, useSession } from '@/ui/app-context';
import { Button, Screen, TextField } from '@/ui/primitives';

export default function PerfilScreen() {
  const { profile } = useSession();
  const { renameProfile } = useApp();
  const [name, setName] = useState(profile.displayName);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const message = validateDisplayName(name);
    if (message) {
      setError(message);
      return;
    }
    setSaving(true);
    try {
      await renameProfile(name);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.');
      setSaving(false);
    }
  };

  return (
    <Screen edges={['left', 'right']} footer={<Button label="Salvar" onPress={() => void save()} loading={saving} />}>
      <TextField
        label="Nome ou apelido"
        value={name}
        onChangeText={(v) => {
          setError(null);
          setName(v);
        }}
        autoCapitalize="words"
        maxLength={40}
        error={error}
        hint="Aparece só neste celular."
      />
    </Screen>
  );
}
