import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_MENU_PATH = path.join(__dirname, 'menu.yaml');

export function loadMenuFromFile(filePath = DEFAULT_MENU_PATH) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return yaml.load(raw);
}

export function getAllItems(menuData) {
  return menuData.categories.flatMap((category) =>
    category.items.map((item) => ({ ...item, categoryId: category.id, categoryName: category.name }))
  );
}

function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function similarity(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;

  const tokensA = na.split(/\s+/).filter(Boolean);
  const tokensB = nb.split(/\s+/).filter(Boolean);
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  // Whole-word containment (e.g. "kebab" matches inside "kebab de pollo").
  // Deliberately word-based rather than raw substring so a short alias like
  // "a" can't spuriously match because its letter appears inside an
  // unrelated word.
  const [shorterTokens, longerSet] = tokensA.length <= tokensB.length ? [tokensA, setB] : [tokensB, setA];
  if (shorterTokens.length > 0 && shorterTokens.every((t) => longerSet.has(t))) {
    return 0.85;
  }

  const intersectionSize = [...setA].filter((t) => setB.has(t)).length;
  const unionSize = new Set([...tokensA, ...tokensB]).size;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

/**
 * Finds the menu item that best matches a free-text query (e.g. what a
 * customer typed). Returns null if nothing matches confidently enough,
 * so the caller can ask a clarifying question instead of guessing.
 */
export function findItem(query, menuData, { threshold = 0.4 } = {}) {
  const items = getAllItems(menuData);
  let best = null;
  let bestScore = 0;

  for (const item of items) {
    const candidates = [item.name, ...(item.aliases || [])];
    for (const candidate of candidates) {
      const score = similarity(query, candidate);
      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    }
  }

  return bestScore >= threshold ? { item: best, score: bestScore } : null;
}

export function findItemById(itemId, menuData) {
  return getAllItems(menuData).find((item) => item.id === itemId) || null;
}

export function formatMenuText(menuData) {
  return menuData.categories
    .map((category) => {
      const lines = category.items.map(
        (item) => `  - ${item.name}: ${item.price.toFixed(2)}€ (${item.description})`
      );
      return `${category.name}:\n${lines.join('\n')}`;
    })
    .join('\n\n');
}

export function loadMenu() {
  return loadMenuFromFile();
}
