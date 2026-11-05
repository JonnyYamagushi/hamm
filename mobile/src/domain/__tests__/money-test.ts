import { formatMoney, percentOf, sumMinor } from '../money';

describe('money', () => {
  it('Success: formata em reais com milhar e centavos', () => {
    expect(formatMoney(123456)).toBe('R$ 1.234,56');
    expect(formatMoney(5)).toBe('R$ 0,05');
    expect(formatMoney(100000000)).toBe('R$ 1.000.000,00');
  });

  it('mostra o sinal sem depender de cor', () => {
    expect(formatMoney(-2500)).toBe('−R$ 25,00');
    expect(formatMoney(2500, { signed: true })).toBe('+R$ 25,00');
    expect(formatMoney(0, { signed: true })).toBe('R$ 0,00');
  });

  it('"R$" e o valor nunca se separam na quebra de linha', () => {
    expect(formatMoney(95998)).not.toContain('R$ ');
  });

  it('recusa valores que não são centavos inteiros', () => {
    expect(() => formatMoney(10.5)).toThrow();
    expect(() => sumMinor([1, 0.1])).toThrow();
  });

  it('soma inteiros sem erro de ponto flutuante', () => {
    expect(sumMinor([10, 20, 30])).toBe(60);
  });

  it('percentual arredonda para baixo e trata total zero', () => {
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(150, 100)).toBe(150);
    expect(percentOf(10, 0)).toBe(0);
  });
});
