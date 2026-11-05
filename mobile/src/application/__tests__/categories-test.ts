import { DEFAULT_CATEGORIES } from '@/domain/category';

import { CategoryValidationError, createCategory, editCategory, removeCategory, restoreDefaultCategories } from '../categories';
import { startDemo } from '../onboarding';
import { makeDeps } from '../testing/fakes';

const icon = 'pricetag-outline';
const color = '#4A86B8';

describe('categorias', () => {
  it('Success: cria categoria nova no fim da lista do tipo', async () => {
    const deps = makeDeps();
    const { profile } = await startDemo(deps);
    const created = await createCategory(deps, profile.id, { name: ' Academia ', kind: 'EXPENSE', icon, color });
    expect(created).toMatchObject({ name: 'Academia', isSystem: false });
    const expenses = deps.categories.items.filter((c) => c.kind === 'EXPENSE');
    expect(created.sortOrder).toBe(Math.max(...expenses.map((c) => c.sortOrder)));
  });

  it('recusa duplicado e cor fora da paleta', async () => {
    const deps = makeDeps();
    const { profile } = await startDemo(deps);
    await expect(createCategory(deps, profile.id, { name: 'mercado', kind: 'EXPENSE', icon, color })).rejects.toBeInstanceOf(
      CategoryValidationError,
    );
    await expect(
      createCategory(deps, profile.id, { name: 'Viagem', kind: 'EXPENSE', icon, color: '#000000' }),
    ).rejects.toBeInstanceOf(CategoryValidationError);
  });

  it('renomeia mantendo tipo e ordem', async () => {
    const deps = makeDeps();
    await startDemo(deps);
    const mercado = deps.categories.items.find((c) => c.name === 'Mercado')!;
    const edited = await editCategory(deps, mercado, { name: 'Supermercado', icon: mercado.icon, color: mercado.color });
    expect(edited).toMatchObject({ name: 'Supermercado', kind: 'EXPENSE', sortOrder: mercado.sortOrder });
  });

  it('a pessoa pode tirar categorias padrão e trazê-las de volta', async () => {
    const deps = makeDeps();
    const { profile } = await startDemo(deps);
    const pets = deps.categories.items.find((c) => c.name === 'Pets')!;
    await removeCategory(deps, pets);
    expect(deps.categories.items.some((c) => c.name === 'Pets')).toBe(false);

    expect(await restoreDefaultCategories(deps, profile.id)).toBe(1);
    expect(deps.categories.items).toHaveLength(DEFAULT_CATEGORIES.length);
    expect(await restoreDefaultCategories(deps, profile.id)).toBe(0);
  });
});
