// Dinheiro sempre em centavos inteiros (ADR-006). Nada de float para calcular.

export type Currency = 'BRL';

export function assertMinor(amountMinor: number): void {
  if (!Number.isSafeInteger(amountMinor)) {
    throw new Error(`Valor monetário precisa ser inteiro em centavos: ${amountMinor}`);
  }
}

export function sumMinor(values: readonly number[]): number {
  let total = 0;
  for (const value of values) {
    assertMinor(value);
    total += value;
  }
  assertMinor(total);
  return total;
}

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * "R$ 1.234,56". Com `signed`, positivo ganha "+" e negativo "−" (sinal de menos tipográfico),
 * para nunca depender só da cor (entrada × saída).
 */
export function formatMoney(amountMinor: number, options: { signed?: boolean } = {}): string {
  assertMinor(amountMinor);
  const abs = Math.abs(amountMinor);
  const units = Math.floor(abs / 100).toString();
  const cents = (abs % 100).toString().padStart(2, '0');
  // Espaço não separável: "R$" nunca fica sozinho no fim da linha.
  const body = `R$ ${groupThousands(units)},${cents}`;
  if (amountMinor < 0) return `−${body}`;
  if (options.signed && amountMinor > 0) return `+${body}`;
  return body;
}

/** Percentual inteiro de `part` sobre `whole` (0 quando `whole` é 0), arredondado para baixo. */
export function percentOf(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.floor((part * 100) / whole);
}
