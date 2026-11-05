import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { CATEGORY_COLORS, CATEGORY_ICONS, type CategoryKind } from '@/domain/category';
import { useApp } from '@/ui/app-context';
import { AppText, Button, Icon, Screen, Segmented, TextField, type IconName } from '@/ui/primitives';
import { radius, space, touchTarget } from '@/ui/theme';
import { useColors } from '@/ui/theme-context';

export default function CategoriaScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { categories, createCategory, editCategory, removeCategory } = useApp();
  const colors = useColors();
  const current = id ? categories.find((c) => c.id === id) : undefined;

  const [name, setName] = useState(current?.name ?? '');
  const [kind, setKind] = useState<CategoryKind>(current?.kind ?? 'EXPENSE');
  const [icon, setIcon] = useState<string>(current?.icon ?? CATEGORY_ICONS[0]);
  const [color, setColor] = useState<string>(current?.color ?? CATEGORY_COLORS[5]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      if (current) await editCategory(current, { name, icon, color });
      else await createCategory({ name, kind, icon, color });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.');
      setSaving(false);
    }
  };

  const confirmRemove = () => {
    if (!current) return;
    Alert.alert(`Excluir “${current.name}”?`, 'Você pode criar de novo quando quiser.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await removeCategory(current);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen
      edges={['left', 'right', 'bottom']}
      footer={
        <View style={{ gap: space.sm }}>
          <Button label="Salvar" onPress={() => void save()} loading={saving} />
          {current ? <Button label="Excluir categoria" variant="danger" onPress={confirmRemove} /> : null}
        </View>
      }>
      <Stack.Screen options={{ title: current ? 'Editar categoria' : 'Nova categoria' }} />

      <TextField
        label="Nome"
        value={name}
        onChangeText={(v) => {
          setError(null);
          setName(v);
        }}
        maxLength={30}
        autoFocus={!current}
        error={error}
      />

      {current ? null : (
        <View style={{ gap: space.sm }}>
          <AppText variant="label">Tipo</AppText>
          <Segmented
            label="Tipo"
            options={[
              { value: 'EXPENSE', label: 'Despesa' },
              { value: 'INCOME', label: 'Receita' },
            ]}
            value={kind}
            onChange={setKind}
          />
        </View>
      )}

      <View style={{ gap: space.sm }}>
        <AppText variant="label">Cor</AppText>
        <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel="Cor">
          {CATEGORY_COLORS.map((c, i) => {
            const selected = c === color;
            return (
              <Pressable
                key={c}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Cor ${i + 1}`}
                onPress={() => setColor(c)}
                style={[styles.swatch, { borderColor: selected ? colors.text : 'transparent' }]}>
                <View style={[styles.swatchInner, { backgroundColor: c }]}>
                  {selected ? <Icon name="checkmark" size={18} color="#FFFFFF" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: space.sm }}>
        <AppText variant="label">Ícone</AppText>
        <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel="Ícone">
          {CATEGORY_ICONS.map((name) => {
            const selected = name === icon;
            return (
              <Pressable
                key={name}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={name.replace('-outline', '').replace(/-/g, ' ')}
                onPress={() => setIcon(name)}
                style={[
                  styles.iconCell,
                  {
                    borderColor: selected ? colors.accentLine : colors.border,
                    backgroundColor: selected ? colors.accentSoft : colors.surface,
                  },
                ]}>
                <Icon name={name as IconName} size={22} color={selected ? color : colors.textMuted} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  swatch: { width: touchTarget, height: touchTarget, borderRadius: radius.full, borderWidth: 2, padding: 3 },
  swatchInner: { flex: 1, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  iconCell: { width: touchTarget, height: touchTarget, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
