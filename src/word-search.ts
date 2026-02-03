import type { PokemonData } from "./pokemon-api";

export const GRID_SIZE = 15;
const DIRECTIONS: [number, number][] = [
  [0, 1],   // right
  [1, 0],   // down
  [-1, 0],  // up
  [1, 1],   // down-right
  [-1, 1],  // up-right
];

export interface WordSearchResult {
  grid: string[][];
  solutionGrid: string[][];
  words: string[];
  size: number;
}

export function collectWords(pokemon: PokemonData): string[] {
  const raw: string[] = [
    pokemon.name,
    ...pokemon.types,
    ...pokemon.weaknesses,
    ...pokemon.strengths,
    ...pokemon.abilities,
  ];
  if (pokemon.genus) {
    raw.push(pokemon.genus);
  }

  const seen = new Set<string>();
  const words: string[] = [];
  for (const w of raw) {
    const cleaned = w.toUpperCase().replace(/[^A-Z]/g, "");
    if (cleaned.length >= 3 && cleaned.length <= 12 && !seen.has(cleaned)) {
      seen.add(cleaned);
      words.push(cleaned);
    }
  }

  // Sort by length descending for better placement
  words.sort((a, b) => b.length - a.length);

  // Cap at 15 words
  return words.slice(0, 15);
}

export function generateWordSearch(pokemon: PokemonData): WordSearchResult {
  const words = collectWords(pokemon);
  const grid: string[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => "")
  );
  const placed: string[] = [];

  for (const word of words) {
    if (tryPlaceWord(grid, word)) {
      placed.push(word);
    }
  }

  // Build solution grid (only placed letters) before filling randoms
  const solutionGrid: string[][] = grid.map((row) => row.map((cell) => (cell === "" ? " " : cell)));

  // Fill empty cells with random letters
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === "") {
        grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
    }
  }

  return { grid, solutionGrid, words: placed, size: GRID_SIZE };
}

function tryPlaceWord(grid: string[][], word: string): boolean {
  // Shuffle directions and starting positions for randomness
  const dirs = shuffle([...DIRECTIONS]);

  for (const [dr, dc] of dirs) {
    const positions = getValidStarts(word.length, dr, dc);
    shuffle(positions);

    for (const [r, c] of positions) {
      if (canPlace(grid, word, r, c, dr, dc)) {
        placeWord(grid, word, r, c, dr, dc);
        return true;
      }
    }
  }

  return false;
}

function getValidStarts(
  len: number,
  dr: number,
  dc: number
): [number, number][] {
  const starts: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const endR = r + dr * (len - 1);
      const endC = c + dc * (len - 1);
      if (endR >= 0 && endR < GRID_SIZE && endC >= 0 && endC < GRID_SIZE) {
        starts.push([r, c]);
      }
    }
  }
  return starts;
}

function canPlace(
  grid: string[][],
  word: string,
  r: number,
  c: number,
  dr: number,
  dc: number
): boolean {
  for (let i = 0; i < word.length; i++) {
    const cell = grid[r + dr * i][c + dc * i];
    if (cell !== "" && cell !== word[i]) return false;
  }
  return true;
}

function placeWord(
  grid: string[][],
  word: string,
  r: number,
  c: number,
  dr: number,
  dc: number
): void {
  for (let i = 0; i < word.length; i++) {
    grid[r + dr * i][c + dc * i] = word[i];
  }
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
