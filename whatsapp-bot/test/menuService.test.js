import { describe, it, expect } from 'vitest';
import { loadMenu, getAllItems, findItem, formatMenuText } from '../src/menu/menuService.js';

describe('menuService', () => {
  const menu = loadMenu();

  it('loads categories and items from menu.yaml', () => {
    expect(menu.categories.length).toBeGreaterThan(0);
    expect(getAllItems(menu).length).toBeGreaterThan(0);
  });

  it('finds an exact alias match', () => {
    const result = findItem('coca cola', menu);
    expect(result.item.id).toBe('cocacola');
  });

  it('finds a fuzzy match even with extra words', () => {
    const result = findItem('kebab de pollo por favor', menu);
    expect(result.item.id).toBe('kebab-pollo');
  });

  it('returns null for items not on the menu', () => {
    expect(findItem('sushi', menu)).toBeNull();
  });

  it('formats the menu as readable text with prices', () => {
    const text = formatMenuText(menu);
    expect(text).toContain('Kebabs');
    expect(text).toMatch(/\d+\.\d{2}€/);
  });
});
