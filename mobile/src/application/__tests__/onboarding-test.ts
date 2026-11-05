import { DEFAULT_CATEGORIES } from '@/domain/category';

import {
  OnboardingValidationError,
  ProfileAlreadyExistsError,
  completeOnboarding,
  eraseAllData,
  startDemo,
  type OnboardingInput,
} from '../onboarding';
import { verifyPin } from '../security';
import { makeDeps } from '../testing/fakes';

const input: OnboardingInput = {
  displayName: '  João ',
  pin: '258046',
  pinConfirmation: '258046',
  biometricsEnabled: true,
  monthStartDay: 5,
  timeZone: 'America/Sao_Paulo',
  categories: DEFAULT_CATEGORIES.slice(0, 3),
};

describe('onboarding', () => {
  it('Success: cria perfil, preferências, categorias marcadas e PIN', async () => {
    const deps = makeDeps();
    const { profile, settings } = await completeOnboarding(deps, input);

    expect(profile).toMatchObject({ displayName: 'João', isDemo: false });
    expect(settings).toMatchObject({ monthStartDay: 5, biometricsEnabled: true, lockTimeoutSeconds: 60 });
    expect(deps.categories.items.map((c) => c.name)).toEqual(['Moradia', 'Mercado', 'Alimentação fora']);
    expect(deps.pins.record?.length).toBe(6);
    expect(await verifyPin(deps, '258046')).toEqual({ status: 'ok' });
  });

  it('PIN é guardado como hash, nunca em texto', async () => {
    const deps = makeDeps();
    await completeOnboarding(deps, input);
    expect(JSON.stringify(deps.pins.record)).not.toContain('258046');
  });

  it('valida antes de gravar qualquer coisa', async () => {
    const deps = makeDeps();
    await expect(completeOnboarding(deps, { ...input, pinConfirmation: '258047' })).rejects.toBeInstanceOf(
      OnboardingValidationError,
    );
    await expect(completeOnboarding(deps, { ...input, displayName: ' ' })).rejects.toBeInstanceOf(OnboardingValidationError);
    expect(deps.profiles.profile).toBeNull();
    expect(deps.pins.record).toBeNull();
  });

  it('falha ao gravar o perfil não deixa PIN órfão', async () => {
    const deps = makeDeps();
    deps.profiles.failNextCreate = true;
    await expect(completeOnboarding(deps, input)).rejects.toThrow('disco cheio');
    expect(deps.pins.record).toBeNull();
  });

  it('PIN antigo (Keychain que sobreviveu à reinstalação) não vale para o perfil novo', async () => {
    const deps = makeDeps();
    deps.pins.record = { hash: 'antigo', salt: 'x', length: 4 };
    await completeOnboarding(deps, input);
    expect(deps.pins.record?.hash).not.toBe('antigo');
  });

  it('não cria segundo perfil', async () => {
    const deps = makeDeps();
    await completeOnboarding(deps, input);
    await expect(completeOnboarding(deps, input)).rejects.toBeInstanceOf(ProfileAlreadyExistsError);
  });

  it('demonstração cria perfil fictício sem PIN e com todas as categorias', async () => {
    const deps = makeDeps();
    const { profile } = await startDemo(deps);
    expect(profile.isDemo).toBe(true);
    expect(deps.pins.record).toBeNull();
    expect(deps.categories.items).toHaveLength(DEFAULT_CATEGORIES.length);
  });

  it('apagar tudo limpa banco e PIN', async () => {
    const deps = makeDeps();
    await completeOnboarding(deps, input);
    await eraseAllData(deps);
    expect(await deps.profiles.get()).toBeNull();
    expect(deps.categories.items).toHaveLength(0);
    expect(deps.pins.record).toBeNull();
  });
});
