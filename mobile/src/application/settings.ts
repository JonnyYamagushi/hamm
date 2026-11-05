// Preferências e dados do perfil.
import { normalizeDisplayName, validateDisplayName, validateSettings, type Profile, type Settings } from '@/domain/profile';

import type { Clock, ProfileRepository } from './ports';

export type SettingsDeps = { profiles: ProfileRepository; clock: Clock };

export class SettingsValidationError extends Error {}

export async function updateSettings(
  deps: SettingsDeps,
  current: Settings,
  changes: Partial<Omit<Settings, 'profileId' | 'updatedAt' | 'currency'>>,
): Promise<Settings> {
  const next: Settings = { ...current, ...changes, updatedAt: deps.clock.nowIso() };
  const error = validateSettings(next);
  if (error) throw new SettingsValidationError(error);
  await deps.profiles.updateSettings(next);
  return next;
}

export async function renameProfile(deps: SettingsDeps, current: Profile, displayName: string): Promise<Profile> {
  const error = validateDisplayName(displayName);
  if (error) throw new SettingsValidationError(error);
  const next: Profile = { ...current, displayName: normalizeDisplayName(displayName), updatedAt: deps.clock.nowIso() };
  await deps.profiles.updateProfile(next);
  return next;
}
