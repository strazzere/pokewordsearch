import { describe, it, expect } from "vitest";
import type { PokemonData } from "./pokemon-api";
import { collectWords, generateWordSearch, GRID_SIZE } from "./word-search";

function makePokemon(overrides: Partial<PokemonData> = {}): PokemonData {
  return {
    name: "pikachu",
    id: 25,
    types: ["electric"],
    weaknesses: ["ground"],
    strengths: ["water", "flying"],
    abilities: ["static", "lightning-rod"],
    genus: "Mouse",
    artworkUrl: "",
    ...overrides,
  };
}

describe("collectWords", () => {
  it("extracts and uppercases words", () => {
    const words = collectWords(makePokemon());
    for (const w of words) {
      expect(w).toBe(w.toUpperCase());
    }
    expect(words).toContain("PIKACHU");
    expect(words).toContain("ELECTRIC");
  });

  it("filters words shorter than 3 or longer than 12 characters", () => {
    const pokemon = makePokemon({
      types: ["go", "superlongtypenamehere"],
      weaknesses: [],
      strengths: [],
      abilities: ["ab"],
      genus: "",
    });
    const words = collectWords(pokemon);
    for (const w of words) {
      expect(w.length).toBeGreaterThanOrEqual(3);
      expect(w.length).toBeLessThanOrEqual(12);
    }
  });

  it("removes duplicates", () => {
    const pokemon = makePokemon({
      types: ["fire", "fire"],
      weaknesses: ["fire"],
      strengths: ["fire"],
      abilities: ["fire"],
    });
    const words = collectWords(pokemon);
    const fireCount = words.filter((w) => w === "FIRE").length;
    expect(fireCount).toBe(1);
  });

  it("strips non-alpha characters", () => {
    const pokemon = makePokemon({
      abilities: ["lightning-rod", "volt absorb"],
    });
    const words = collectWords(pokemon);
    for (const w of words) {
      expect(w).toMatch(/^[A-Z]+$/);
    }
    expect(words).toContain("LIGHTNINGROD");
    expect(words).toContain("VOLTABSORB");
  });

  it("includes genus when present", () => {
    const words = collectWords(makePokemon({ genus: "Mouse" }));
    expect(words).toContain("MOUSE");
  });

  it("caps at 15 words", () => {
    const pokemon = makePokemon({
      types: ["fire", "water"],
      weaknesses: ["grass", "electric", "rock", "ground", "ice"],
      strengths: ["bug", "steel", "fairy", "dark", "ghost"],
      abilities: ["blaze", "torrent", "swift", "overgrow"],
      genus: "Flame",
    });
    const words = collectWords(pokemon);
    expect(words.length).toBeLessThanOrEqual(15);
  });

  it("sorts by length descending", () => {
    const words = collectWords(makePokemon());
    for (let i = 1; i < words.length; i++) {
      expect(words[i - 1].length).toBeGreaterThanOrEqual(words[i].length);
    }
  });
});

describe("generateWordSearch", () => {
  const result = generateWordSearch(makePokemon());

  it("returns correct structure", () => {
    expect(result).toHaveProperty("grid");
    expect(result).toHaveProperty("solutionGrid");
    expect(result).toHaveProperty("words");
    expect(result).toHaveProperty("size");
  });

  it("grid dimensions are GRID_SIZE x GRID_SIZE", () => {
    expect(result.grid.length).toBe(GRID_SIZE);
    for (const row of result.grid) {
      expect(row.length).toBe(GRID_SIZE);
    }
  });

  it("all cells are filled", () => {
    for (const row of result.grid) {
      for (const cell of row) {
        expect(cell).not.toBe("");
        expect(cell.length).toBe(1);
      }
    }
  });

  it("solution grid matches grid for non-space cells", () => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (result.solutionGrid[r][c] !== " ") {
          expect(result.solutionGrid[r][c]).toBe(result.grid[r][c]);
        }
      }
    }
  });

  it("placed words are findable in the grid", () => {
    const directions: [number, number][] = [
      [0, 1],
      [1, 0],
      [-1, 0],
      [1, 1],
      [-1, 1],
    ];

    for (const word of result.words) {
      let found = false;
      for (let r = 0; r < GRID_SIZE && !found; r++) {
        for (let c = 0; c < GRID_SIZE && !found; c++) {
          for (const [dr, dc] of directions) {
            let match = true;
            for (let i = 0; i < word.length; i++) {
              const nr = r + dr * i;
              const nc = c + dc * i;
              if (
                nr < 0 || nr >= GRID_SIZE ||
                nc < 0 || nc >= GRID_SIZE ||
                result.grid[nr][nc] !== word[i]
              ) {
                match = false;
                break;
              }
            }
            if (match) {
              found = true;
              break;
            }
          }
        }
      }
      expect(found).toBe(true);
    }
  });

  it("words are placed in multiple directions", () => {
    // Verify that across many puzzles, words are placed in more than one
    // direction (the algorithm shuffles all 5 directions: right, down, up,
    // down-right, up-right).
    const directions: [number, number][] = [
      [0, 1], [1, 0], [-1, 0], [1, 1], [-1, 1],
    ];

    const manyWordsPokemon = makePokemon({
      types: ["fire", "water"],
      weaknesses: ["grass", "electric", "rock", "ground", "ice"],
      strengths: ["bug", "steel", "fairy", "dark", "ghost"],
      abilities: ["blaze", "torrent", "swift", "overgrow"],
      genus: "Flame",
    });

    const foundDirections = new Set<string>();

    for (let attempt = 0; attempt < 50; attempt++) {
      const res = generateWordSearch(manyWordsPokemon);

      for (const word of res.words) {
        for (const [dr, dc] of directions) {
          for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
              const endR = r + dr * (word.length - 1);
              const endC = c + dc * (word.length - 1);
              if (endR < 0 || endR >= GRID_SIZE || endC < 0 || endC >= GRID_SIZE) continue;

              let match = true;
              for (let i = 0; i < word.length; i++) {
                if (res.solutionGrid[r + dr * i][c + dc * i] !== word[i]) {
                  match = false;
                  break;
                }
              }
              if (match) {
                foundDirections.add(`${dr},${dc}`);
              }
            }
          }
        }
      }
    }

    // At least 3 of the 5 directions should be used across multiple puzzles
    expect(foundDirections.size).toBeGreaterThanOrEqual(3);
  });
});
