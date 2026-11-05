import { DEFAULT_CATEGORIES, categoryNameKey, validateCategoryName, type Category } from '../category';

const existing: Pick<Category, 'id' | 'name' | 'kind'>[] = [
  { id: 'c1', name: 'Saúde', kind: 'EXPENSE' },
  { id: 'c2', name: 'Outros', kind: 'INCOME' },
];

describe('categorias', () => {
  it('Success: nome novo é aceito', () => {
    expect(validateCategoryName('Academia', 'EXPENSE', existing)).toBeNull();
  });

  it('duplicado ignora maiúsculas, acentos e espaços', () => {
    expect(validateCategoryName('  saude ', 'EXPENSE', existing)).not.toBeNull();
    expect(categoryNameKey('Alimentação  Fora')).toBe('alimentacao fora');
  });

  it('o mesmo nome pode existir em receita e despesa', () => {
    expect(validateCategoryName('Outros', 'EXPENSE', existing)).toBeNull();
  });

  it('renomear a própria categoria não acusa duplicado', () => {
    expect(validateCategoryName('SAÚDE', 'EXPENSE', existing, 'c1')).toBeNull();
  });

  it('recusa vazio e nome longo', () => {
    expect(validateCategoryName('   ', 'EXPENSE', existing)).not.toBeNull();
    expect(validateCategoryName('x'.repeat(31), 'EXPENSE', existing)).not.toBeNull();
  });

  it('a lista padrão não tem duplicados por tipo', () => {
    const keys = DEFAULT_CATEGORIES.map((c) => `${c.kind}:${categoryNameKey(c.name)}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
