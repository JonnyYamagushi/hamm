import {
  NO_FAILURES,
  delayAfterFailures,
  formatWait,
  registerFailure,
  remainingWaitMs,
  validatePin,
  validatePinConfirmation,
} from '../pin';

describe('PIN', () => {
  it('Success: aceita de 4 a 8 números escolhidos pela pessoa', () => {
    expect(validatePin('2580')).toBeNull();
    expect(validatePin('258046')).toBeNull();
    expect(validatePin('25804613')).toBeNull();
  });

  it('recusa tamanho fora da faixa, letras, repetição e sequência', () => {
    expect(validatePin('258')).not.toBeNull();
    expect(validatePin('258046139')).not.toBeNull();
    expect(validatePin('25a0')).not.toBeNull();
    expect(validatePin('1111')).not.toBeNull();
    expect(validatePin('1234')).not.toBeNull();
    expect(validatePin('654321')).not.toBeNull();
  });

  it('confirmação precisa ser igual', () => {
    expect(validatePinConfirmation('2580', '2580')).toBeNull();
    expect(validatePinConfirmation('2580', '2581')).not.toBeNull();
  });
});

describe('espera entre tentativas', () => {
  it('as 4 primeiras falhas não esperam; da 5ª em diante a espera cresce', () => {
    expect([1, 2, 3, 4].map(delayAfterFailures)).toEqual([0, 0, 0, 0]);
    expect([5, 6, 7, 8, 9, 20].map(delayAfterFailures)).toEqual([30, 60, 300, 900, 1800, 1800]);
  });

  it('conta o tempo a partir da última falha', () => {
    let record = NO_FAILURES;
    for (let i = 0; i < 5; i++) record = registerFailure(record, 1_000_000);
    expect(record.count).toBe(5);
    expect(remainingWaitMs(record, 1_000_000)).toBe(30_000);
    expect(remainingWaitMs(record, 1_020_000)).toBe(10_000);
    expect(remainingWaitMs(record, 1_030_000)).toBe(0);
  });

  it('formata a espera', () => {
    expect(formatWait(29_100)).toBe('30 s');
    expect(formatWait(61_000)).toBe('2 min');
  });
});
