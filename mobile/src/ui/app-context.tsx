// Raiz de composição: liga os casos de uso às implementações concretas e guarda o estado do app.
import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  createCategory,
  editCategory,
  removeCategory,
  restoreDefaultCategories,
  type CategoryInput,
} from '@/application/categories';
import { completeOnboarding, eraseAllData, startDemo, type OnboardingInput } from '@/application/onboarding';
import { renameProfile, updateSettings } from '@/application/settings';
import { computeCapabilities, type Capability, type Runtime } from '@/domain/capabilities';
import type { Category } from '@/domain/category';
import type { Profile, Settings } from '@/domain/profile';
import { SqliteCategoryRepository } from '@/infrastructure/db/sqlite-category-repository';
import { SqliteProfileRepository } from '@/infrastructure/db/sqlite-profile-repository';
import { detectRuntime } from '@/infrastructure/runtime';
import { securePinStore } from '@/infrastructure/secure-pin-store';
import { pinHasher, systemClock, uuidGenerator } from '@/infrastructure/system';

type Session = { profile: Profile; settings: Settings };

type AppValue = {
  loading: boolean;
  loadError: string | null;
  session: Session | null;
  categories: Category[];
  runtime: Runtime | null;
  capabilities: Capability[];
  /** Perfil real vendo os dados fictícios (só em memória, nada vai para o banco). */
  demoPreview: boolean;
  setDemoPreview: (value: boolean) => void;
  reload: () => Promise<void>;
  completeOnboarding: (input: OnboardingInput) => Promise<void>;
  startDemo: () => Promise<void>;
  eraseAll: () => Promise<void>;
  updateSettings: (changes: Partial<Omit<Settings, 'profileId' | 'updatedAt' | 'currency'>>) => Promise<void>;
  renameProfile: (displayName: string) => Promise<void>;
  createCategory: (input: CategoryInput) => Promise<void>;
  editCategory: (category: Category, input: Omit<CategoryInput, 'kind'>) => Promise<void>;
  removeCategory: (category: Category) => Promise<void>;
  restoreDefaultCategories: () => Promise<number>;
  deps: ReturnType<typeof buildDeps>;
};

function buildDeps(db: ReturnType<typeof useSQLiteContext>) {
  return {
    profiles: new SqliteProfileRepository(db),
    categories: new SqliteCategoryRepository(db),
    pins: securePinStore,
    hasher: pinHasher,
    clock: systemClock,
    ids: uuidGenerator,
  };
}

const AppContext = createContext<AppValue | null>(null);

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Erro inesperado.';
}

export function AppProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const deps = useMemo(() => buildDeps(db), [db]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [runtime, setRuntime] = useState<Runtime | null>(null);
  const [demoPreview, setDemoPreview] = useState(false);

  const refreshCategories = useCallback(
    async (ownerId: string | undefined) => setCategories(ownerId ? await deps.categories.list(ownerId) : []),
    [deps],
  );

  /** Lê perfil e categorias sem tocar no estado; quem chama aplica o resultado. */
  const fetchState = useCallback(async () => {
    const current = await deps.profiles.get();
    const list = current ? await deps.categories.list(current.profile.id) : [];
    return { current, list };
  }, [deps]);

  const apply = useCallback((result: { current: Session | null; list: Category[] } | { error: unknown }) => {
    if ('error' in result) {
      setLoadError(`Não foi possível abrir seus dados. ${messageOf(result.error)}`);
    } else {
      setSession(result.current);
      setCategories(result.list);
      setLoadError(null);
    }
    setLoading(false);
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    apply(await fetchState().catch((error: unknown) => ({ error })));
  }, [apply, fetchState]);

  useEffect(() => {
    fetchState()
      .then(apply)
      .catch((error: unknown) => apply({ error }));
    // Detectar biometria nunca bloqueia o app: sem resposta, segue como "sem biometria".
    detectRuntime()
      .then(setRuntime)
      .catch(() =>
        setRuntime({ platform: 'android', isExpoGo: true, biometricHardware: false, biometricEnrolled: false, hasFaceRecognition: false }),
      );
  }, [apply, fetchState]);

  const value = useMemo<AppValue>(() => {
    const requireSession = () => {
      if (!session) throw new Error('Nenhum perfil aberto.');
      return session;
    };
    return {
      loading,
      loadError,
      session,
      categories,
      runtime,
      capabilities: runtime ? computeCapabilities(runtime) : [],
      demoPreview,
      setDemoPreview,
      reload,
      deps,
      completeOnboarding: async (input) => {
        const created = await completeOnboarding(deps, input);
        setSession(created);
        await refreshCategories(created.profile.id);
      },
      startDemo: async () => {
        const created = await startDemo(deps);
        setSession(created);
        await refreshCategories(created.profile.id);
      },
      eraseAll: async () => {
        await eraseAllData(deps);
        setDemoPreview(false);
        setSession(null);
        setCategories([]);
      },
      updateSettings: async (changes) => {
        const current = requireSession();
        const settings = await updateSettings(deps, current.settings, changes);
        setSession({ ...current, settings });
      },
      renameProfile: async (displayName) => {
        const current = requireSession();
        const profile = await renameProfile(deps, current.profile, displayName);
        setSession({ ...current, profile });
      },
      createCategory: async (input) => {
        const { profile } = requireSession();
        await createCategory(deps, profile.id, input);
        await refreshCategories(profile.id);
      },
      editCategory: async (category, input) => {
        await editCategory(deps, category, input);
        await refreshCategories(category.ownerId);
      },
      removeCategory: async (category) => {
        await removeCategory(deps, category);
        await refreshCategories(category.ownerId);
      },
      restoreDefaultCategories: async () => {
        const { profile } = requireSession();
        const added = await restoreDefaultCategories(deps, profile.id);
        await refreshCategories(profile.id);
        return added;
      },
    };
  }, [loading, loadError, session, categories, runtime, demoPreview, reload, deps, refreshCategories]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp fora do AppProvider');
  return value;
}

/** Sessão garantida (telas que só abrem com perfil). */
export function useSession(): Session {
  const { session } = useApp();
  if (!session) throw new Error('Tela aberta sem perfil');
  return session;
}
