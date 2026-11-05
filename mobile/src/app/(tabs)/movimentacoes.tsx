import { useMemo, useState } from 'react';
import { SectionList, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { DemoTransaction } from '@/domain/demo';
import { formatDayHeading } from '@/domain/local-date';
import { formatMoney } from '@/domain/money';
import { isInPeriod } from '@/domain/period';
import { useApp } from '@/ui/app-context';
import { DemoBanner } from '@/ui/demo-banner';
import { PeriodSelector, usePeriod } from '@/ui/period-selector';
import { AppText, Button, Chip, EmptyState, Icon } from '@/ui/primitives';
import { maxContentWidth, radius, space, type } from '@/ui/theme';
import { useColors } from '@/ui/theme-context';
import { useDemoData } from '@/ui/use-demo';

type Filter = 'ALL' | 'EXPENSE' | 'INCOME';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'EXPENSE', label: 'Saídas' },
  { value: 'INCOME', label: 'Entradas' },
];

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function TransactionRow({ item, first, last }: { item: DemoTransaction; first: boolean; last: boolean }) {
  const colors = useColors();
  const { categories } = useApp();
  const category = categories.find((c) => c.name === item.category);
  const amount = item.type === 'INCOME' ? item.amountMinor : -item.amountMinor;
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.surface },
        first && { borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
        last && { borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md },
      ]}
      accessible
      accessibilityLabel={`${item.description}, ${item.category}, ${item.type === 'INCOME' ? 'entrada' : 'saída'} de ${formatMoney(item.amountMinor)}`}>
      <View style={[styles.iconCircle, { backgroundColor: colors.surfaceMuted }]}>
        <Icon name={(category?.icon as never) ?? 'pricetag-outline'} size={20} color={category?.color ?? colors.textMuted} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText numberOfLines={1}>{item.description}</AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {item.category}
        </AppText>
      </View>
      <AppText tone={amount > 0 ? 'positive' : 'default'} style={{ fontWeight: '600', fontVariant: ['tabular-nums'] }}>
        {formatMoney(amount, { signed: true })}
      </AppText>
    </View>
  );
}

export default function MovimentacoesScreen() {
  const colors = useColors();
  const { setDemoPreview } = useApp();
  const demo = useDemoData();
  const { period, offset, setOffset } = usePeriod();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');

  const sections = useMemo(() => {
    if (!demo) return [];
    const q = normalize(query.trim());
    const items = demo.data.transactions.filter(
      (t) =>
        isInPeriod(t.date, period) &&
        (filter === 'ALL' || t.type === filter) &&
        (q.length === 0 || normalize(`${t.description} ${t.category}`).includes(q)),
    );
    const byDay = new Map<string, DemoTransaction[]>();
    for (const t of items) byDay.set(t.date, [...(byDay.get(t.date) ?? []), t]);
    return [...byDay.entries()].map(([date, data]) => ({ title: formatDayHeading(date), data }));
  }, [demo, query, filter, period]);

  if (!demo) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <View style={styles.column}>
          <AppText variant="title" accessibilityRole="header">
            Movimentações
          </AppText>
          <EmptyState
            icon="receipt-outline"
            title="Nenhuma movimentação ainda"
            message="Gastos, receitas e transferências vão aparecer aqui, agrupados por dia, com busca e filtros. O lançamento manual e a importação de extratos chegam na próxima versão."
            action={<Button label="Ver como vai ficar" variant="ghost" onPress={() => setDemoPreview(true)} />}
          />
        </View>
      </SafeAreaView>
    );
  }

  const header = (
    <View style={{ gap: space.lg, paddingBottom: space.md }}>
      <AppText variant="title" accessibilityRole="header">
        Movimentações
      </AppText>
      <PeriodSelector period={period} offset={offset} setOffset={setOffset} />
      <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
        <Icon name="search-outline" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por descrição ou categoria"
          placeholderTextColor={colors.textSubtle}
          accessibilityLabel="Buscar movimentações"
          style={[type.body, { flex: 1, color: colors.text, paddingVertical: space.md }]}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>
      <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Filtrar por tipo">
        {FILTERS.map((f) => (
          <Chip key={f.value} label={f.label} selected={filter === f.value} onPress={() => setFilter(f.value)} />
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <DemoBanner />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        renderSectionHeader={({ section }) => (
          <AppText
            variant="overline"
            tone="subtle"
            accessibilityRole="header"
            style={[styles.dayHeader, { backgroundColor: colors.background }]}>
            {section.title}
          </AppText>
        )}
        renderItem={({ item, index, section }) => (
          <TransactionRow item={item} first={index === 0} last={index === section.data.length - 1} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />}
        ListEmptyComponent={
          <EmptyState icon="search-outline" title="Nada encontrado" message="Tente outra palavra ou outro filtro." />
        }
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  column: { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center', padding: space.lg, gap: space.xl },
  list: { padding: space.lg, paddingBottom: space.xxxl, width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: space.sm, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  dayHeader: { paddingTop: space.lg, paddingBottom: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, paddingHorizontal: space.md, minHeight: 64 },
  iconCircle: { width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
});
