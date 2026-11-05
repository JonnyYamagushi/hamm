import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { summarizePeriod } from '@/domain/demo';
import { formatShortDate } from '@/domain/local-date';
import { formatMoney, percentOf } from '@/domain/money';
import { shiftPeriod } from '@/domain/period';
import { useApp, useSession } from '@/ui/app-context';
import { DemoBanner } from '@/ui/demo-banner';
import { PeriodSelector, usePeriod } from '@/ui/period-selector';
import { AppText, Button, Card, EmptyState, Icon, Screen } from '@/ui/primitives';
import { space } from '@/ui/theme';
import { useColors } from '@/ui/theme-context';
import { useDemoData } from '@/ui/use-demo';

function Greeting({ name }: { name: string }) {
  return (
    <AppText variant="title" accessibilityRole="header">
      Olá, {name}
    </AppText>
  );
}

export default function InicioScreen() {
  const { profile, settings } = useSession();
  const { setDemoPreview } = useApp();
  const demo = useDemoData();
  const colors = useColors();
  const { period, offset, setOffset } = usePeriod();

  if (!demo) {
    return (
      <Screen>
        <Greeting name={profile.displayName} />
        <EmptyState
          icon="wallet-outline"
          title="Vamos começar pelas suas contas"
          message="Aqui vão aparecer saldo, gastos do mês, faturas e dicas da assistente. O cadastro de contas e lançamentos chega na próxima versão."
          action={<Button label="Ver como vai ficar" variant="ghost" onPress={() => setDemoPreview(true)} />}
        />
      </Screen>
    );
  }

  const summary = summarizePeriod(demo.data.transactions, period);
  const previous = summarizePeriod(demo.data.transactions, shiftPeriod(period, -1, settings.monthStartDay));
  const account = demo.data.accounts[0];
  const bill = demo.data.bills[0];
  const top = summary.byCategory[0];
  const topBefore = top ? previous.byCategory.find((c) => c.category === top.category)?.expenseMinor ?? 0 : 0;

  return (
    <Screen banner={<DemoBanner />}>
      <Greeting name={profile.displayName} />
      <PeriodSelector period={period} offset={offset} setOffset={setOffset} />

      <Card>
        <AppText variant="label" tone="muted">
          Saldo em conta
        </AppText>
        <AppText variant="amount" tone="accent">
          {formatMoney(account.balanceMinor)}
        </AppText>
        <AppText variant="caption" tone="subtle">
          {account.name}
        </AppText>
      </Card>

      <View style={styles.pair}>
        <Card style={{ flex: 1 }}>
          <AppText variant="label" tone="muted">
            Entrou
          </AppText>
          <AppText variant="heading" tone="positive" style={styles.tabular}>
            {formatMoney(summary.incomeMinor, { signed: true })}
          </AppText>
        </Card>
        <Card style={{ flex: 1 }}>
          <AppText variant="label" tone="muted">
            Saiu
          </AppText>
          <AppText variant="heading" style={styles.tabular}>
            {formatMoney(-summary.expenseMinor)}
          </AppText>
        </Card>
      </View>

      {offset === 0 && bill.amountMinor > 0 ? (
        <Card>
          <View style={styles.titleRow}>
            <Icon name="card-outline" color={colors.textMuted} />
            <AppText variant="heading">Próxima fatura</AppText>
          </View>
          <AppText>
            {bill.cardName}: <AppText style={[styles.tabular, { fontWeight: '600' }]}>{formatMoney(bill.amountMinor)}</AppText>
          </AppText>
          <AppText variant="caption" tone="muted">
            Vence em {formatShortDate(bill.dueDate)}
          </AppText>
        </Card>
      ) : null}

      {top ? (
        <Card style={{ borderColor: colors.accentLine }}>
          <View style={styles.titleRow}>
            <Icon name="sparkles-outline" color={colors.accent} />
            <AppText variant="heading">Dica da assistente</AppText>
          </View>
          <AppText>
            {top.category} foi onde você mais gastou: {formatMoney(top.expenseMinor)} (
            {percentOf(top.expenseMinor, summary.expenseMinor)}% das saídas).
            {topBefore > 0
              ? ` No mês anterior inteiro foram ${formatMoney(topBefore)}.`
              : ' No mês anterior não houve gasto nessa categoria.'}
          </AppText>
          <Button label="Ver na assistente" variant="ghost" onPress={() => router.push('/assistente')} />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pair: { flexDirection: 'row', gap: space.md, flexWrap: 'wrap' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  tabular: { fontVariant: ['tabular-nums'] },
});
