import { buildDemoData, summarizePeriod } from '../demo';
import { periodContaining } from '../period';

describe('base de demonstração', () => {
  it('Success: é determinística e nunca tem lançamento no futuro', () => {
    const a = buildDemoData('2026-11-20', 1);
    const b = buildDemoData('2026-11-20', 1);
    expect(a).toEqual(b);
    expect(a.transactions.every((t) => t.date <= '2026-11-20')).toBe(true);
    expect(a.transactions.every((t) => Number.isInteger(t.amountMinor) && t.amountMinor > 0)).toBe(true);
  });

  it('cobre o período atual e os dois anteriores', () => {
    const data = buildDemoData('2026-11-20', 1);
    const months = new Set(data.transactions.map((t) => t.date.slice(0, 7)));
    expect([...months].sort()).toEqual(['2026-09', '2026-10', '2026-11']);
  });

  it('resumo soma só o período e separa receita de despesa', () => {
    const data = buildDemoData('2026-11-30', 1);
    const period = periodContaining('2026-10-15', 1);
    const summary = summarizePeriod(data.transactions, period);
    const inOctober = data.transactions.filter((t) => t.date.startsWith('2026-10'));
    const expense = inOctober.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amountMinor, 0);
    expect(summary.expenseMinor).toBe(expense);
    expect(summary.incomeMinor).toBeGreaterThan(0);
    expect(summary.byCategory.reduce((s, c) => s + c.expenseMinor, 0)).toBe(expense);
    expect(summary.transactionIds).toHaveLength(inOctober.length);
  });
});
