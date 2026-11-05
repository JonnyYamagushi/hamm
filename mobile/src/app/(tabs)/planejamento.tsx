import { StyleSheet, View } from 'react-native';

import { summarizePeriod } from '@/domain/demo';
import { formatMoney, percentOf } from '@/domain/money';
import { useApp } from '@/ui/app-context';
import { DemoBanner } from '@/ui/demo-banner';
import { PeriodSelector, usePeriod } from '@/ui/period-selector';
import { AppText, Button, Card, EmptyState, ProgressBar, Screen } from '@/ui/primitives';
import { space } from '@/ui/theme';
import { useDemoData } from '@/ui/use-demo';

export default function PlanejamentoScreen() {
  const { setDemoPreview } = useApp();
  const demo = useDemoData();
  const { period, offset, setOffset } = usePeriod();

  if (!demo) {
    return (
      <Screen>
        <AppText variant="title" accessibilityRole="header">
          Planejamento
        </AppText>
        <EmptyState
          icon="pie-chart-outline"
          title="Seu plano do mês vai morar aqui"
          message="Orçamento por categoria, metas, contas fixas e a previsão do mês. Chega depois do cadastro de movimentações."
          action={<Button label="Ver como vai ficar" variant="ghost" onPress={() => setDemoPreview(true)} />}
        />
      </Screen>
    );
  }

  const summary = summarizePeriod(demo.data.transactions, period);
  const spentBy = new Map(summary.byCategory.map((c) => [c.category, c.expenseMinor]));
  const totalLimit = demo.data.budgets.reduce((s, b) => s + b.limitMinor, 0);
  const totalSpent = demo.data.budgets.reduce((s, b) => s + (spentBy.get(b.category) ?? 0), 0);

  return (
    <Screen banner={<DemoBanner />}>
      <AppText variant="title" accessibilityRole="header">
        Planejamento
      </AppText>
      <PeriodSelector period={period} offset={offset} setOffset={setOffset} />

      <Card>
        <AppText variant="label" tone="muted">
          Orçamento usado
        </AppText>
        <AppText variant="amount">{percentOf(totalSpent, totalLimit)}%</AppText>
        <AppText variant="caption" tone="muted">
          {formatMoney(totalSpent)} de {formatMoney(totalLimit)} nas categorias com orçamento
        </AppText>
      </Card>

      <View style={{ gap: space.lg }}>
        <AppText variant="overline" tone="subtle" accessibilityRole="header">
          Por categoria
        </AppText>
        {demo.data.budgets.map((budget) => {
          const spent = spentBy.get(budget.category) ?? 0;
          const pct = percentOf(spent, budget.limitMinor);
          const over = spent > budget.limitMinor;
          return (
            <View key={budget.category} style={{ gap: space.xs }}>
              <View style={styles.line}>
                <AppText style={{ flex: 1 }}>{budget.category}</AppText>
                <AppText variant="label" tone={over ? 'danger' : 'muted'} style={styles.tabular}>
                  {formatMoney(spent)} / {formatMoney(budget.limitMinor)}
                </AppText>
              </View>
              <ProgressBar value={spent / budget.limitMinor} label={`${budget.category}: ${pct}% do orçamento`} />
              {over ? (
                <AppText variant="caption" tone="danger">
                  Passou {formatMoney(spent - budget.limitMinor)} do limite.
                </AppText>
              ) : null}
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm, flexWrap: 'wrap' },
  tabular: { fontVariant: ['tabular-nums'] },
});
