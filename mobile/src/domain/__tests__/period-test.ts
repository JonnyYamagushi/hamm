import { addDays, daysBetween, formatDayHeading, localDateOf } from '../local-date';
import { isValidMonthStartDay, periodContaining, periodLabel, periodOf, shiftPeriod } from '../period';

describe('período financeiro', () => {
  it('Success: mês começando no dia 1 é o mês do calendário', () => {
    expect(periodOf(2026, 2, 1)).toEqual({ year: 2026, month: 2, start: '2026-02-01', end: '2026-02-28' });
  });

  it('mês começando no dia 5 vai até o dia 4 do mês seguinte', () => {
    expect(periodOf(2026, 11, 5)).toMatchObject({ start: '2026-11-05', end: '2026-12-04' });
  });

  it('virada de ano', () => {
    expect(periodOf(2026, 12, 10)).toMatchObject({ start: '2026-12-10', end: '2027-01-09' });
    expect(periodOf(2026, 13, 1)).toMatchObject({ year: 2027, month: 1, start: '2027-01-01' });
  });

  it('data antes do dia de início pertence ao período anterior', () => {
    expect(periodContaining('2026-11-03', 5)).toMatchObject({ year: 2026, month: 10, start: '2026-10-05' });
    expect(periodContaining('2026-11-05', 5)).toMatchObject({ year: 2026, month: 11 });
    expect(periodContaining('2026-01-02', 10)).toMatchObject({ year: 2025, month: 12, start: '2025-12-10' });
  });

  it('desloca períodos para trás e para frente', () => {
    const nov = periodOf(2026, 11, 1);
    expect(shiftPeriod(nov, -1, 1).start).toBe('2026-10-01');
    expect(shiftPeriod(nov, 2, 1).start).toBe('2027-01-01');
  });

  it('aceita dia de início só de 1 a 28', () => {
    expect(isValidMonthStartDay(1)).toBe(true);
    expect(isValidMonthStartDay(28)).toBe(true);
    expect(isValidMonthStartDay(29)).toBe(false);
    expect(isValidMonthStartDay(0)).toBe(false);
    expect(() => periodOf(2026, 1, 31)).toThrow();
  });

  it('rótulos em português', () => {
    expect(periodLabel(periodOf(2026, 3, 1))).toBe('março de 2026');
    expect(formatDayHeading('2026-11-03')).toBe('terça, 3 de novembro');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
  });

  it('conta dias entre datas, inclusive na virada de mês e de ano', () => {
    expect(daysBetween('2026-11-01', '2026-11-05')).toBe(4);
    expect(daysBetween('2026-02-27', '2026-03-01')).toBe(2);
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
    expect(daysBetween('2026-11-05', '2026-11-01')).toBe(-4);
  });

  it('data local depende do fuso do perfil, não do aparelho', () => {
    const instant = new Date('2026-11-05T02:30:00Z');
    expect(localDateOf(instant, 'America/Sao_Paulo')).toBe('2026-11-04');
    expect(localDateOf(instant, 'America/Noronha')).toBe('2026-11-05');
  });
});
