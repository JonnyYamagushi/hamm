// Período financeiro ("mês") respeitando o dia de início escolhido pelo usuário (1 a 28).
// Ex.: início no dia 5 → o "mês de novembro" vai de 5/11 a 4/12.
import { addDays, monthName, parseLocalDate, toLocalDate, type LocalDate } from './local-date';

export type Period = {
  /** Ano/mês que dá nome ao período. */
  year: number;
  month: number;
  /** Primeiro e último dia, inclusivos. */
  start: LocalDate;
  end: LocalDate;
};

export const MIN_MONTH_START_DAY = 1;
export const MAX_MONTH_START_DAY = 28;

export function isValidMonthStartDay(day: number): boolean {
  return Number.isInteger(day) && day >= MIN_MONTH_START_DAY && day <= MAX_MONTH_START_DAY;
}

export function periodOf(year: number, month: number, monthStartDay: number): Period {
  if (!isValidMonthStartDay(monthStartDay)) throw new Error(`Dia de início inválido: ${monthStartDay}`);
  const start = toLocalDate(year, month, monthStartDay);
  const nextStart = toLocalDate(year, month + 1, monthStartDay);
  const normalized = parseLocalDate(start);
  return { year: normalized.year, month: normalized.month, start, end: addDays(nextStart, -1) };
}

/** Período que contém a data. */
export function periodContaining(date: LocalDate, monthStartDay: number): Period {
  const { year, month, day } = parseLocalDate(date);
  return day >= monthStartDay ? periodOf(year, month, monthStartDay) : periodOf(year, month - 1, monthStartDay);
}

export function shiftPeriod(period: Period, months: number, monthStartDay: number): Period {
  return periodOf(period.year, period.month + months, monthStartDay);
}

export function isInPeriod(date: LocalDate, period: Period): boolean {
  return date >= period.start && date <= period.end;
}

/** "novembro de 2026" */
export function periodLabel(period: Period): string {
  return `${monthName(period.month)} de ${period.year}`;
}

/** "Novembro de 2026" (início de frase ou título). */
export function periodTitle(period: Period): string {
  const label = periodLabel(period);
  return label.charAt(0).toUpperCase() + label.slice(1);
}
