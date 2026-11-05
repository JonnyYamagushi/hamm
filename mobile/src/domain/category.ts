// Categorias de receita e despesa. A pessoa inclui, renomeia e tira as que quiser (D4).

export type CategoryKind = 'EXPENSE' | 'INCOME';

export type Category = {
  id: string;
  ownerId: string;
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
  sortOrder: number;
  /** Veio da lista padrão (só informativo; pode ser renomeada ou excluída). */
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
};

export const CATEGORY_NAME_MAX = 30;

/** Paleta discreta para as categorias (boa leitura nos dois temas). */
export const CATEGORY_COLORS = [
  '#C2604F',
  '#C98A3E',
  '#A99A3A',
  '#5E9A5B',
  '#3F9488',
  '#4A86B8',
  '#6E72C2',
  '#9A63AE',
  '#B65C86',
  '#7D766D',
] as const;

export type CategoryTemplate = { name: string; kind: CategoryKind; icon: string; color: string };

export const DEFAULT_CATEGORIES: readonly CategoryTemplate[] = [
  { name: 'Moradia', kind: 'EXPENSE', icon: 'home-outline', color: '#C2604F' },
  { name: 'Mercado', kind: 'EXPENSE', icon: 'cart-outline', color: '#5E9A5B' },
  { name: 'Alimentação fora', kind: 'EXPENSE', icon: 'restaurant-outline', color: '#C98A3E' },
  { name: 'Transporte', kind: 'EXPENSE', icon: 'car-outline', color: '#4A86B8' },
  { name: 'Saúde', kind: 'EXPENSE', icon: 'medkit-outline', color: '#3F9488' },
  { name: 'Educação', kind: 'EXPENSE', icon: 'school-outline', color: '#6E72C2' },
  { name: 'Lazer', kind: 'EXPENSE', icon: 'happy-outline', color: '#9A63AE' },
  { name: 'Compras', kind: 'EXPENSE', icon: 'bag-handle-outline', color: '#B65C86' },
  { name: 'Assinaturas', kind: 'EXPENSE', icon: 'repeat-outline', color: '#A99A3A' },
  { name: 'Contas da casa', kind: 'EXPENSE', icon: 'flash-outline', color: '#C98A3E' },
  { name: 'Pets', kind: 'EXPENSE', icon: 'paw-outline', color: '#5E9A5B' },
  { name: 'Presentes', kind: 'EXPENSE', icon: 'gift-outline', color: '#B65C86' },
  { name: 'Impostos e taxas', kind: 'EXPENSE', icon: 'document-text-outline', color: '#7D766D' },
  { name: 'Outros', kind: 'EXPENSE', icon: 'ellipsis-horizontal-circle-outline', color: '#7D766D' },
  { name: 'Salário', kind: 'INCOME', icon: 'briefcase-outline', color: '#5E9A5B' },
  { name: 'Extra', kind: 'INCOME', icon: 'sparkles-outline', color: '#C98A3E' },
  { name: 'Reembolso', kind: 'INCOME', icon: 'return-down-back-outline', color: '#4A86B8' },
  { name: 'Rendimentos', kind: 'INCOME', icon: 'trending-up-outline', color: '#3F9488' },
  { name: 'Outros', kind: 'INCOME', icon: 'ellipsis-horizontal-circle-outline', color: '#7D766D' },
];

/** Ícones que a pessoa pode escolher para uma categoria nova (Ionicons). */
export const CATEGORY_ICONS = [
  'pricetag-outline',
  'home-outline',
  'cart-outline',
  'restaurant-outline',
  'cafe-outline',
  'car-outline',
  'bus-outline',
  'airplane-outline',
  'medkit-outline',
  'fitness-outline',
  'school-outline',
  'book-outline',
  'happy-outline',
  'game-controller-outline',
  'bag-handle-outline',
  'shirt-outline',
  'repeat-outline',
  'flash-outline',
  'water-outline',
  'wifi-outline',
  'phone-portrait-outline',
  'paw-outline',
  'gift-outline',
  'heart-outline',
  'people-outline',
  'construct-outline',
  'document-text-outline',
  'briefcase-outline',
  'sparkles-outline',
  'trending-up-outline',
  'cash-outline',
  'ellipsis-horizontal-circle-outline',
] as const;

export function normalizeCategoryName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/** Chave para comparar nomes sem diferenciar maiúsculas, acentos e espaços. */
export function categoryNameKey(value: string): string {
  return normalizeCategoryName(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function validateCategoryName(
  name: string,
  kind: CategoryKind,
  existing: readonly Pick<Category, 'id' | 'name' | 'kind'>[],
  ignoreId?: string,
): string | null {
  const normalized = normalizeCategoryName(name);
  if (normalized.length === 0) return 'Dê um nome para a categoria.';
  if (normalized.length > CATEGORY_NAME_MAX) return `Use até ${CATEGORY_NAME_MAX} caracteres.`;
  const key = categoryNameKey(normalized);
  const duplicate = existing.some((c) => c.id !== ignoreId && c.kind === kind && categoryNameKey(c.name) === key);
  if (duplicate) return 'Já existe uma categoria com esse nome.';
  return null;
}

export function kindLabel(kind: CategoryKind): string {
  return kind === 'EXPENSE' ? 'Despesa' : 'Receita';
}
