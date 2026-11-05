// Datas "de calendário" (sem hora) no formato YYYY-MM-DD, independentes do fuso do aparelho.
// A conversão de um instante UTC para a data local usa o fuso do perfil.

export type LocalDate = string;

const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseLocalDate(value: LocalDate): { year: number; month: number; day: number } {
  const match = LOCAL_DATE.exec(value);
  if (!match) throw new Error(`Data inválida: ${value}`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

export function toLocalDate(year: number, month: number, day: number): LocalDate {
  // Date.UTC normaliza estouros (ex.: dia 0 = último dia do mês anterior).
  const date = new Date(Date.UTC(year, month - 1, day));
  const y = date.getUTCFullYear().toString().padStart(4, '0');
  const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const d = date.getUTCDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(value: LocalDate, days: number): LocalDate {
  const { year, month, day } = parseLocalDate(value);
  return toLocalDate(year, month, day + days);
}

/** Dias de `from` até `to` (positivo se `to` vem depois). */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  const a = parseLocalDate(from);
  const b = parseLocalDate(to);
  return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86_400_000);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Data local de um instante no fuso informado (ex.: 'America/Sao_Paulo'). */
export function localDateOf(instant: Date, timeZone: string): LocalDate {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];
const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

export function monthName(month: number): string {
  return MONTHS[month - 1];
}

/** "terça, 4 de novembro" */
export function formatDayHeading(value: LocalDate): string {
  const { year, month, day } = parseLocalDate(value);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return `${WEEKDAYS[weekday]}, ${day} de ${monthName(month)}`;
}

/** "4 nov" */
export function formatShortDate(value: LocalDate): string {
  const { month, day } = parseLocalDate(value);
  return `${day} ${monthName(month).slice(0, 3)}`;
}
