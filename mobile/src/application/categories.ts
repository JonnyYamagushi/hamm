// Categorias: a pessoa inclui, renomeia e tira as que quiser (D4).
// Na Fase 1 ainda não existem lançamentos, então excluir é sempre possível; a partir da Fase 2,
// categoria em uso será arquivada em vez de excluída.
import {
  CATEGORY_COLORS,
  DEFAULT_CATEGORIES,
  categoryNameKey,
  normalizeCategoryName,
  validateCategoryName,
  type Category,
  type CategoryKind,
} from '@/domain/category';

import type { CategoryRepository, Clock, IdGenerator } from './ports';

export type CategoryDeps = { categories: CategoryRepository; clock: Clock; ids: IdGenerator };

export class CategoryValidationError extends Error {}

export type CategoryInput = { name: string; kind: CategoryKind; icon: string; color: string };

function checkAppearance(input: Pick<CategoryInput, 'icon' | 'color'>) {
  if (input.icon.trim().length === 0) throw new CategoryValidationError('Escolha um ícone.');
  if (!(CATEGORY_COLORS as readonly string[]).includes(input.color)) throw new CategoryValidationError('Escolha uma cor.');
}

export async function createCategory(deps: CategoryDeps, ownerId: string, input: CategoryInput): Promise<Category> {
  const existing = await deps.categories.list(ownerId);
  const error = validateCategoryName(input.name, input.kind, existing);
  if (error) throw new CategoryValidationError(error);
  checkAppearance(input);
  const now = deps.clock.nowIso();
  const sameKind = existing.filter((c) => c.kind === input.kind);
  const category: Category = {
    id: deps.ids.newId(),
    ownerId,
    name: normalizeCategoryName(input.name),
    kind: input.kind,
    icon: input.icon,
    color: input.color,
    sortOrder: sameKind.length === 0 ? 0 : Math.max(...sameKind.map((c) => c.sortOrder)) + 1,
    isSystem: false,
    createdAt: now,
    updatedAt: now,
  };
  await deps.categories.insert(category);
  return category;
}

export async function editCategory(
  deps: CategoryDeps,
  current: Category,
  input: Pick<CategoryInput, 'name' | 'icon' | 'color'>,
): Promise<Category> {
  const existing = await deps.categories.list(current.ownerId);
  const error = validateCategoryName(input.name, current.kind, existing, current.id);
  if (error) throw new CategoryValidationError(error);
  checkAppearance(input);
  const updated: Category = {
    ...current,
    name: normalizeCategoryName(input.name),
    icon: input.icon,
    color: input.color,
    updatedAt: deps.clock.nowIso(),
  };
  await deps.categories.update(updated);
  return updated;
}

export async function removeCategory(deps: CategoryDeps, category: Category): Promise<void> {
  await deps.categories.remove(category.id);
}

/** Devolve as categorias padrão que a pessoa tirou (sem duplicar as que já existem). */
export async function restoreDefaultCategories(deps: CategoryDeps, ownerId: string): Promise<number> {
  const existing = await deps.categories.list(ownerId);
  const keys = new Set(existing.map((c) => `${c.kind}:${categoryNameKey(c.name)}`));
  let added = 0;
  for (const template of DEFAULT_CATEGORIES) {
    if (keys.has(`${template.kind}:${categoryNameKey(template.name)}`)) continue;
    await createCategory(deps, ownerId, template);
    keys.add(`${template.kind}:${categoryNameKey(template.name)}`);
    added++;
  }
  return added;
}
