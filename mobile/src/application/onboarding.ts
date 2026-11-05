// Primeiro uso: cria o titular de verdade ou o perfil de demonstração.
import { DEFAULT_CATEGORIES, type Category, type CategoryTemplate } from '@/domain/category';
import { validatePin, validatePinConfirmation } from '@/domain/pin';
import {
  defaultSettings,
  normalizeDisplayName,
  validateDisplayName,
  validateSettings,
  type Profile,
  type Settings,
} from '@/domain/profile';

import type { Clock, IdGenerator, PinHasher, PinStore, ProfileRepository } from './ports';
import { savePin } from './security';

export type OnboardingDeps = {
  profiles: ProfileRepository;
  pins: PinStore;
  hasher: PinHasher;
  clock: Clock;
  ids: IdGenerator;
};

export type OnboardingInput = {
  displayName: string;
  pin: string;
  pinConfirmation: string;
  biometricsEnabled: boolean;
  monthStartDay: number;
  timeZone: string;
  /** Modelos da lista padrão que a pessoa manteve marcados. */
  categories: readonly CategoryTemplate[];
};

export class OnboardingValidationError extends Error {}
export class ProfileAlreadyExistsError extends Error {
  constructor() {
    super('Já existe um perfil neste aparelho.');
  }
}

export function categoriesFromTemplates(
  templates: readonly CategoryTemplate[],
  ownerId: string,
  nowIso: string,
  ids: IdGenerator,
): Category[] {
  return templates.map((template, index) => ({
    id: ids.newId(),
    ownerId,
    name: template.name,
    kind: template.kind,
    icon: template.icon,
    color: template.color,
    sortOrder: index,
    isSystem: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  }));
}

export async function completeOnboarding(deps: OnboardingDeps, input: OnboardingInput): Promise<{ profile: Profile; settings: Settings }> {
  const error =
    validateDisplayName(input.displayName) ??
    validatePin(input.pin) ??
    validatePinConfirmation(input.pin, input.pinConfirmation) ??
    validateSettings({ monthStartDay: input.monthStartDay, timeZone: input.timeZone, lockTimeoutSeconds: 60 });
  if (error) throw new OnboardingValidationError(error);
  if (await deps.profiles.get()) throw new ProfileAlreadyExistsError();

  const now = deps.clock.nowIso();
  const profile: Profile = {
    id: deps.ids.newId(),
    displayName: normalizeDisplayName(input.displayName),
    isDemo: false,
    createdAt: now,
    updatedAt: now,
  };
  const settings: Settings = {
    ...defaultSettings(profile.id, now),
    monthStartDay: input.monthStartDay,
    timeZone: input.timeZone,
    biometricsEnabled: input.biometricsEnabled,
  };

  // No iPhone o Keychain sobrevive à desinstalação: um PIN antigo nunca pode valer para um perfil novo.
  await deps.pins.clear();
  await savePin(deps, input.pin);
  try {
    await deps.profiles.create(profile, settings, categoriesFromTemplates(input.categories, profile.id, now, deps.ids));
  } catch (cause) {
    // Tudo ou nada: sem perfil, não fica PIN órfão.
    await deps.pins.clear();
    throw cause;
  }
  return { profile, settings };
}

/** "Só quero ver a demonstração": perfil fictício, sem PIN, com todas as categorias padrão. */
export async function startDemo(deps: OnboardingDeps): Promise<{ profile: Profile; settings: Settings }> {
  if (await deps.profiles.get()) throw new ProfileAlreadyExistsError();
  const now = deps.clock.nowIso();
  const profile: Profile = { id: deps.ids.newId(), displayName: 'Demonstração', isDemo: true, createdAt: now, updatedAt: now };
  const settings = defaultSettings(profile.id, now);
  await deps.pins.clear();
  await deps.profiles.create(profile, settings, categoriesFromTemplates(DEFAULT_CATEGORIES, profile.id, now, deps.ids));
  return { profile, settings };
}

/** Apaga tudo (banco e PIN). Usado por "Apagar todos os dados" e por "Começar de verdade". */
export async function eraseAllData(deps: Pick<OnboardingDeps, 'profiles' | 'pins'>): Promise<void> {
  await deps.profiles.eraseAll();
  await deps.pins.clear();
}
