import { PinValidationError, changePin, currentWaitMs, registerBiometricUnlock, savePin, verifyPin } from '../security';
import { makeDeps } from '../testing/fakes';

async function setup() {
  const deps = makeDeps();
  await savePin(deps, '2580');
  return deps;
}

describe('desbloqueio por PIN', () => {
  it('Success: PIN certo desbloqueia e zera as falhas', async () => {
    const deps = await setup();
    await verifyPin(deps, '0000');
    expect(await verifyPin(deps, '2580')).toEqual({ status: 'ok' });
    expect(deps.pins.failures.count).toBe(0);
  });

  it('a 5ª falha seguida impõe espera de 30 s', async () => {
    const deps = await setup();
    for (let i = 1; i <= 4; i++) {
      expect(await verifyPin(deps, '0000')).toMatchObject({ status: 'wrong', failures: i, waitMs: 0 });
    }
    expect(await verifyPin(deps, '0000')).toMatchObject({ status: 'wrong', failures: 5, waitMs: 30_000 });
  });

  it('durante a espera nem o PIN certo é aceito, e não conta tentativa', async () => {
    const deps = await setup();
    for (let i = 0; i < 5; i++) await verifyPin(deps, '0000');
    expect(await verifyPin(deps, '2580')).toEqual({ status: 'wait', waitMs: 30_000 });
    expect(deps.pins.failures.count).toBe(5);
  });

  it('a espera continua depois de fechar e abrir o app (está no armazenamento seguro)', async () => {
    const deps = await setup();
    for (let i = 0; i < 5; i++) await verifyPin(deps, '0000');
    deps.clock.advance(10_000);
    expect(await currentWaitMs(deps)).toBe(20_000);
    deps.clock.advance(20_000);
    expect(await verifyPin(deps, '2580')).toEqual({ status: 'ok' });
  });

  it('biometria zera as falhas', async () => {
    const deps = await setup();
    await verifyPin(deps, '0000');
    await registerBiometricUnlock(deps);
    expect(deps.pins.failures.count).toBe(0);
  });

  it('sem PIN gravado responde noPin', async () => {
    const deps = makeDeps();
    expect(await verifyPin(deps, '2580')).toEqual({ status: 'noPin' });
  });
});

describe('troca de PIN', () => {
  it('Success: com o PIN atual certo, grava o novo (tamanho pode mudar)', async () => {
    const deps = await setup();
    expect(await changePin(deps, { currentPin: '2580', newPin: '74196385', confirmation: '74196385' })).toEqual({
      status: 'ok',
    });
    expect(deps.pins.record?.length).toBe(8);
    expect(await verifyPin(deps, '74196385')).toEqual({ status: 'ok' });
  });

  it('PIN atual errado não troca e conta falha', async () => {
    const deps = await setup();
    const before = deps.pins.record;
    expect(await changePin(deps, { currentPin: '1111', newPin: '7419', confirmation: '7419' })).toMatchObject({
      status: 'wrong',
    });
    expect(deps.pins.record).toBe(before);
  });

  it('PIN novo inválido é recusado antes de conferir o atual', async () => {
    const deps = await setup();
    await expect(changePin(deps, { currentPin: '2580', newPin: '1234', confirmation: '1234' })).rejects.toBeInstanceOf(
      PinValidationError,
    );
    expect(deps.pins.failures.count).toBe(0);
  });
});
