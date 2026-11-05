import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { kindLabel, type CategoryKind } from '@/domain/category';
import { useApp } from '@/ui/app-context';
import { Button, EmptyState, ListGroup, ListRow, Notice, Screen, type IconName } from '@/ui/primitives';
import { space } from '@/ui/theme';

const KINDS: CategoryKind[] = ['EXPENSE', 'INCOME'];

export default function CategoriasScreen() {
  const { categories, restoreDefaultCategories } = useApp();
  const [notice, setNotice] = useState<string | null>(null);

  const restore = async () => {
    const added = await restoreDefaultCategories();
    setNotice(added === 0 ? 'Todas as categorias padrão já estão na lista.' : `${added} categoria(s) padrão de volta.`);
  };

  return (
    <Screen
      edges={['left', 'right']}
      footer={
        <View style={{ gap: space.sm }}>
          <Button label="Nova categoria" icon="add" onPress={() => router.push('/ajustes/categoria')} />
          <Button label="Trazer de volta as categorias padrão" variant="ghost" onPress={() => void restore()} />
        </View>
      }>
      {notice ? <Notice text={notice} /> : null}
      {categories.length === 0 ? (
        <EmptyState icon="pricetags-outline" title="Nenhuma categoria" message="Crie as suas ou traga de volta as categorias padrão." />
      ) : (
        KINDS.map((kind) => {
          const items = categories.filter((c) => c.kind === kind);
          if (items.length === 0) return null;
          return (
            <ListGroup key={kind} title={`${kindLabel(kind)}s`}>
              {items.map((c) => (
                <ListRow
                  key={c.id}
                  icon={c.icon as IconName}
                  iconColor={c.color}
                  title={c.name}
                  accessibilityHint="Editar ou excluir"
                  onPress={() => router.push({ pathname: '/ajustes/categoria', params: { id: c.id } })}
                />
              ))}
            </ListGroup>
          );
        })
      )}
    </Screen>
  );
}
