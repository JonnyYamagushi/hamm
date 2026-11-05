// Fase 1: só valida o FORMATO das respostas (fato, cálculo e movimentações usadas) com os dados
// fictícios. O motor de perguntas de verdade chega na Fase 4.
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { summarizePeriod, type DemoTransaction } from '@/domain/demo';
import { addDays, daysBetween, formatShortDate } from '@/domain/local-date';
import { formatMoney, percentOf } from '@/domain/money';
import { isInPeriod, periodContaining, periodLabel, shiftPeriod, type Period } from '@/domain/period';
import { useApp, useSession } from '@/ui/app-context';
import { DemoBanner } from '@/ui/demo-banner';
import { AppText, Card, Chip, Icon, Notice, Screen } from '@/ui/primitives';
import { radius, space } from '@/ui/theme';
import { useColors } from '@/ui/theme-context';
import { useDemoData } from '@/ui/use-demo';

type Answer = { question: string; fact: string; calculation: string[]; used: DemoTransaction[] };

const QUESTIONS = ['Quanto gastei com alimentação este mês?', 'O que mais pesou nos meus gastos?'] as const;

/** Compara o mês atual até hoje com o MESMO trecho do mês anterior (comparação justa). */
function answerFood(transactions: DemoTransaction[], period: Period, previous: Period, today: string): Answer {
  const isFood = (t: DemoTransaction) =>
    t.type === 'EXPENSE' && (t.category === 'Mercado' || t.category === 'Alimentação fora');
  const sum = (list: DemoTransaction[]) => list.reduce((s, t) => s + t.amountMinor, 0);
  const cutoff = addDays(previous.start, daysBetween(period.start, today));
  const used = transactions.filter((t) => isFood(t) && isInPeriod(t.date, period));
  const samePoint = transactions.filter((t) => isFood(t) && t.date >= previous.start && t.date <= cutoff);
  const wholePrevious = transactions.filter((t) => isFood(t) && isInPeriod(t.date, previous));
  const total = sum(used);
  const totalSamePoint = sum(samePoint);
  const diff = total - totalSamePoint;
  const comparison =
    diff === 0
      ? 'o mesmo valor'
      : `${formatMoney(Math.abs(diff))} ${diff > 0 ? 'a mais' : 'a menos'}`;
  return {
    question: QUESTIONS[0],
    fact: `Até hoje, em ${periodLabel(period)}, você gastou ${formatMoney(total)} com alimentação. No mesmo ponto do mês anterior eram ${formatMoney(totalSamePoint)} (${comparison}). O mês anterior inteiro fechou em ${formatMoney(sum(wholePrevious))}.`,
    calculation: [
      'Categorias consideradas: Mercado + Alimentação fora (só saídas).',
      `Este mês: ${formatShortDate(period.start)} até hoje (${formatShortDate(today)}), ${used.length} movimentações = ${formatMoney(total)}.`,
      `Mesmo trecho do mês anterior: ${formatShortDate(previous.start)} a ${formatShortDate(cutoff)}, ${samePoint.length} movimentações = ${formatMoney(totalSamePoint)}.`,
      `Mês anterior inteiro: ${wholePrevious.length} movimentações = ${formatMoney(sum(wholePrevious))}.`,
    ],
    used,
  };
}

function answerTop(transactions: DemoTransaction[], period: Period): Answer {
  const summary = summarizePeriod(transactions, period);
  const top = summary.byCategory.slice(0, 3);
  const used = transactions.filter(
    (t) => t.type === 'EXPENSE' && isInPeriod(t.date, period) && top.some((c) => c.category === t.category),
  );
  return {
    question: QUESTIONS[1],
    fact:
      top.length === 0
        ? 'Ainda não há gastos neste mês.'
        : `As três categorias que mais pesaram: ${top
            .map((c) => `${c.category} (${formatMoney(c.expenseMinor)}, ${percentOf(c.expenseMinor, summary.expenseMinor)}%)`)
            .join('; ')}.`,
    calculation: [
      `Total de saídas no mês: ${formatMoney(summary.expenseMinor)}.`,
      'Cada percentual = gasto da categoria ÷ total de saídas, arredondado para baixo.',
      'Transferências e pagamentos de fatura não entram (ainda não existem na demonstração).',
    ],
    used,
  };
}

function AnswerCard({ answer }: { answer: Answer }) {
  const colors = useColors();
  const [open, setOpen] = useState<'none' | 'calc' | 'used'>('none');
  const toggle = (which: 'calc' | 'used') => setOpen((o) => (o === which ? 'none' : which));
  const link = (which: 'calc' | 'used', label: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open === which }}
      onPress={() => toggle(which)}
      style={({ pressed }) => [styles.link, pressed && { backgroundColor: colors.accentSoft }]}>
      <AppText variant="label" tone="accent">
        {label}
      </AppText>
      <Icon name={open === which ? 'chevron-up' : 'chevron-down'} size={16} color={colors.accent} />
    </Pressable>
  );
  return (
    <View style={{ gap: space.sm }}>
      <View style={[styles.bubble, styles.mine, { backgroundColor: colors.accent }]}>
        <AppText tone="onAccent">{answer.question}</AppText>
      </View>
      <Card>
        <AppText>{answer.fact}</AppText>
        <View style={styles.links}>
          {link('calc', 'Ver cálculo')}
          {link('used', `Ver movimentações usadas (${answer.used.length})`)}
        </View>
        {open === 'calc' ? (
          <View style={{ gap: space.xs }}>
            {answer.calculation.map((line) => (
              <AppText key={line} variant="caption" tone="muted">
                • {line}
              </AppText>
            ))}
          </View>
        ) : null}
        {open === 'used' ? (
          <View style={{ gap: space.xs }}>
            {answer.used.map((t) => (
              <View key={t.id} style={styles.usedRow}>
                <AppText variant="caption" tone="muted" style={{ width: 52 }}>
                  {formatShortDate(t.date)}
                </AppText>
                <AppText variant="caption" style={{ flex: 1 }} numberOfLines={1}>
                  {t.description}
                </AppText>
                <AppText variant="caption" style={{ fontVariant: ['tabular-nums'] }}>
                  {formatMoney(t.amountMinor)}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}
      </Card>
    </View>
  );
}

export default function AssistenteScreen() {
  const { settings } = useSession();
  const { setDemoPreview } = useApp();
  const demo = useDemoData();
  const [asked, setAsked] = useState<string[]>([]);

  const ask = (question: string) => setAsked((list) => (list.includes(question) ? list : [...list, question]));

  const answers: Answer[] = [];
  if (demo) {
    const period = periodContaining(demo.today, settings.monthStartDay);
    const previous = shiftPeriod(period, -1, settings.monthStartDay);
    for (const q of asked) {
      answers.push(q === QUESTIONS[0] ? answerFood(demo.data.transactions, period, previous, demo.today) : answerTop(demo.data.transactions, period));
    }
  }

  return (
    <Screen banner={<DemoBanner />}>
      <AppText variant="title" accessibilityRole="header">
        Assistente
      </AppText>
      <AppText tone="muted">
        Pergunte sobre seus gastos. Toda resposta mostra o cálculo e as movimentações usadas, e funciona sem internet.
      </AppText>

      {!demo ? (
        <Notice text="Ainda estou aprendendo: as respostas com os seus dados chegam junto com o cadastro de movimentações. Toque numa pergunta para ver como vai funcionar." />
      ) : null}

      <View style={{ gap: space.sm }}>
        <AppText variant="overline" tone="subtle">
          Perguntas sugeridas
        </AppText>
        <View style={styles.chips}>
          {QUESTIONS.map((q) => (
            <Chip
              key={q}
              label={q}
              selected={asked.includes(q)}
              onPress={() => {
                if (!demo) setDemoPreview(true);
                ask(q);
              }}
            />
          ))}
        </View>
      </View>

      {answers.map((a) => (
        <AnswerCard key={a.question} answer={a} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  bubble: { borderRadius: radius.lg, paddingHorizontal: space.lg, paddingVertical: space.md, maxWidth: '85%' },
  mine: { alignSelf: 'flex-end', borderBottomRightRadius: radius.sm },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.xs },
  link: { flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: 40, paddingHorizontal: space.sm, borderRadius: radius.sm },
  usedRow: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
});
