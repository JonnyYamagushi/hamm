import { defaultSettings, normalizeDisplayName, validateDisplayName, validateSettings } from '../profile';

describe('perfil e preferências', () => {
  it('Success: nome válido é normalizado', () => {
    expect(validateDisplayName('  João   Paulo ')).toBeNull();
    expect(normalizeDisplayName('  João   Paulo ')).toBe('João Paulo');
  });

  it('recusa nome vazio ou longo demais', () => {
    expect(validateDisplayName('   ')).not.toBeNull();
    expect(validateDisplayName('a'.repeat(41))).not.toBeNull();
  });

  it('padrões: tema do sistema, mês no dia 1, São Paulo, bloqueio em 1 minuto', () => {
    const s = defaultSettings('p1', '2026-11-05T00:00:00.000Z');
    expect(s).toMatchObject({ theme: 'system', monthStartDay: 1, timeZone: 'America/Sao_Paulo', lockTimeoutSeconds: 60 });
    expect(validateSettings(s)).toBeNull();
  });

  it('recusa dia, fuso e tempo de bloqueio inválidos', () => {
    const s = defaultSettings('p1', 'x');
    expect(validateSettings({ ...s, monthStartDay: 30 })).not.toBeNull();
    expect(validateSettings({ ...s, timeZone: 'Europe/Lisbon' })).not.toBeNull();
    expect(validateSettings({ ...s, lockTimeoutSeconds: 42 as never })).not.toBeNull();
  });
});
