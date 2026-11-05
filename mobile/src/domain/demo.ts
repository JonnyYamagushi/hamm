// Base de demonstração: dados FICTÍCIOS, gerados em memória e de forma determinística a partir da
// data de hoje. Nunca vão para o banco (Fase 1); desligar a demonstração não deixa resto.
import { addDays, type LocalDate } from './local-date';
import { isInPeriod, periodContaining, shiftPeriod, type Period } from './period';

export type DemoAccount = { id: string; name: string; kind: 'CHECKING' | 'CREDIT_CARD'; balanceMinor: number };

export type DemoTransaction = {
  id: string;
  date: LocalDate;
  description: string;
  category: string;
  type: 'EXPENSE' | 'INCOME';
  /** Sempre positivo; o tipo diz se entra ou sai. */
  amountMinor: number;
  accountId: string;
};

export type DemoBudget = { category: string; limitMinor: number };

export type DemoBill = { accountId: string; cardName: string; dueDate: LocalDate; amountMinor: number };

export type DemoData = {
  accounts: DemoAccount[];
  transactions: DemoTransaction[];
  budgets: DemoBudget[];
  bills: DemoBill[];
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { id: 'demo-conta', name: 'Conta corrente (fictícia)', kind: 'CHECKING', balanceMinor: 384_215 },
  { id: 'demo-cartao', name: 'Cartão roxo (fictício)', kind: 'CREDIT_CARD', balanceMinor: 0 },
];

const BUDGETS: DemoBudget[] = [
  { category: 'Mercado', limitMinor: 120_000 },
  { category: 'Alimentação fora', limitMinor: 50_000 },
  { category: 'Transporte', limitMinor: 40_000 },
  { category: 'Lazer', limitMinor: 30_000 },
  { category: 'Assinaturas', limitMinor: 12_000 },
];

type Template = {
  description: string;
  category: string;
  type: 'EXPENSE' | 'INCOME';
  /** Dia relativo ao início do período. */
  offsets: number[];
  base: number;
  /** Variação máxima em centavos (gerada de forma determinística). */
  spread: number;
  account: 'demo-conta' | 'demo-cartao';
};

const TEMPLATES: Template[] = [
  { description: 'Salário', category: 'Salário', type: 'INCOME', offsets: [4], base: 650_000, spread: 0, account: 'demo-conta' },
  { description: 'Aluguel', category: 'Moradia', type: 'EXPENSE', offsets: [9], base: 180_000, spread: 0, account: 'demo-conta' },
  { description: 'Conta de luz', category: 'Contas da casa', type: 'EXPENSE', offsets: [11], base: 18_900, spread: 4_000, account: 'demo-conta' },
  { description: 'Internet', category: 'Contas da casa', type: 'EXPENSE', offsets: [14], base: 9_990, spread: 0, account: 'demo-conta' },
  { description: 'Supermercado do bairro', category: 'Mercado', type: 'EXPENSE', offsets: [1, 8, 15, 22], base: 23_000, spread: 9_000, account: 'demo-cartao' },
  { description: 'Padaria', category: 'Alimentação fora', type: 'EXPENSE', offsets: [2, 6, 12, 19, 25], base: 2_400, spread: 1_500, account: 'demo-cartao' },
  { description: 'Restaurante', category: 'Alimentação fora', type: 'EXPENSE', offsets: [7, 20], base: 9_800, spread: 4_000, account: 'demo-cartao' },
  { description: 'Combustível', category: 'Transporte', type: 'EXPENSE', offsets: [3, 17], base: 15_000, spread: 3_000, account: 'demo-cartao' },
  { description: 'Aplicativo de transporte', category: 'Transporte', type: 'EXPENSE', offsets: [10, 24], base: 2_800, spread: 1_200, account: 'demo-cartao' },
  { description: 'Streaming de vídeo', category: 'Assinaturas', type: 'EXPENSE', offsets: [5], base: 3_990, spread: 0, account: 'demo-cartao' },
  { description: 'Streaming de música', category: 'Assinaturas', type: 'EXPENSE', offsets: [13], base: 2_190, spread: 0, account: 'demo-cartao' },
  { description: 'Farmácia', category: 'Saúde', type: 'EXPENSE', offsets: [16], base: 6_700, spread: 3_000, account: 'demo-cartao' },
  { description: 'Cinema', category: 'Lazer', type: 'EXPENSE', offsets: [21], base: 7_600, spread: 2_000, account: 'demo-cartao' },
  { description: 'Ração do pet', category: 'Pets', type: 'EXPENSE', offsets: [18], base: 14_900, spread: 0, account: 'demo-cartao' },
  { description: 'Freela de design', category: 'Extra', type: 'INCOME', offsets: [23], base: 80_000, spread: 20_000, account: 'demo-conta' },
];

/** Pseudoaleatório determinístico (mesma semente → mesmos valores). */
function variation(seed: string, spread: number): number {
  if (spread === 0) return 0;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return (hash % (spread + 1)) - Math.floor(spread / 2);
}

function transactionsFor(period: Period, today: LocalDate): DemoTransaction[] {
  const result: DemoTransaction[] = [];
  for (const template of TEMPLATES) {
    for (const offset of template.offsets) {
      const date = addDays(period.start, offset);
      if (!isInPeriod(date, period) || date > today) continue;
      const id = `demo-${period.start}-${template.description}-${offset}`;
      result.push({
        id,
        date,
        description: template.description,
        category: template.category,
        type: template.type,
        amountMinor: template.base + variation(id, template.spread),
        accountId: template.account,
      });
    }
  }
  return result;
}

/** Três períodos (o atual até hoje e os dois anteriores), do mais novo para o mais antigo. */
export function buildDemoData(today: LocalDate, monthStartDay: number): DemoData {
  const current = periodContaining(today, monthStartDay);
  const periods = [current, shiftPeriod(current, -1, monthStartDay), shiftPeriod(current, -2, monthStartDay)];
  const transactions = periods
    .flatMap((period) => transactionsFor(period, today))
    .sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : b.date.localeCompare(a.date)));

  const cardSpentThisPeriod = transactions
    .filter((t) => t.accountId === 'demo-cartao' && isInPeriod(t.date, current))
    .reduce((sum, t) => sum + t.amountMinor, 0);

  return {
    accounts: DEMO_ACCOUNTS,
    transactions,
    budgets: BUDGETS,
    bills: [
      { accountId: 'demo-cartao', cardName: 'Cartão roxo (fictício)', dueDate: addDays(current.end, 10), amountMinor: cardSpentThisPeriod },
    ],
  };
}

export type PeriodSummary = {
  incomeMinor: number;
  expenseMinor: number;
  byCategory: { category: string; expenseMinor: number }[];
  transactionIds: string[];
};

/** Resumo de um período — mesmo cálculo que a assistente mostra em "ver cálculo". */
export function summarizePeriod(transactions: readonly DemoTransaction[], period: Period): PeriodSummary {
  const inPeriod = transactions.filter((t) => isInPeriod(t.date, period));
  const byCategory = new Map<string, number>();
  let incomeMinor = 0;
  let expenseMinor = 0;
  for (const t of inPeriod) {
    if (t.type === 'INCOME') {
      incomeMinor += t.amountMinor;
    } else {
      expenseMinor += t.amountMinor;
      byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amountMinor);
    }
  }
  return {
    incomeMinor,
    expenseMinor,
    byCategory: [...byCategory.entries()]
      .map(([category, value]) => ({ category, expenseMinor: value }))
      .sort((a, b) => b.expenseMinor - a.expenseMinor || a.category.localeCompare(b.category)),
    transactionIds: inPeriod.map((t) => t.id),
  };
}
