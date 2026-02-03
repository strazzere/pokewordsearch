import type { PokemonData } from "./pokemon-api";
import type { WordSearchResult } from "./word-search";
import { escapeHtml } from "./escape-html";

function renderGrid(grid: string[][]): string {
  return grid
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`
    )
    .join("\n            ");
}

export function renderPuzzle(
  container: HTMLElement,
  pokemon: PokemonData,
  puzzle: WordSearchResult,
  onRandom?: () => void
): void {
  const displayName = pokemon.name.toUpperCase().replace(/-/g, " ");

  // Compute cell size based on grid size: smaller grid = bigger cells
  const cellSize = Math.round(540 / puzzle.size);
  const fontSize = Math.max(0.8, cellSize / 22);
  const printCellSize = Math.round(440 / puzzle.size);
  const printFontSize = Math.max(0.65, printCellSize / 22);
  const solutionCellSize = Math.round(180 / puzzle.size);
  const solutionFontSize = Math.max(0.35, solutionCellSize / 24);

  container.innerHTML = `
    <div class="puzzle-page"
         style="--cell-size: ${cellSize}px; --grid-font: ${fontSize}rem; --print-cell: ${printCellSize}px; --print-font: ${printFontSize}rem; --sol-cell: ${solutionCellSize}px; --sol-font: ${solutionFontSize}rem;">
      <div class="no-print controls">
        <button id="back-btn">Back</button>
        <button id="random-puzzle-btn">Random</button>
        <button id="print-btn">Print</button>
      </div>
      <h1 class="puzzle-title">${escapeHtml(displayName)}</h1>
      <div class="puzzle-layout">
        <div class="puzzle-sidebar">
          <div class="pokemon-image">
            ${pokemon.artworkUrl ? `<img src="${escapeHtml(pokemon.artworkUrl)}" alt="${escapeHtml(pokemon.name)}" />` : ""}
          </div>
          <div class="word-list">
            <h2>Words to Find</h2>
            <ul>
              ${puzzle.words.map((w) => `<li>${escapeHtml(w)}</li>`).join("\n              ")}
            </ul>
          </div>
          <div class="solution-section">
            <div class="solution-flip">
              <p class="solution-label">Solution</p>
              <table class="puzzle-grid solution-grid">
                ${renderGrid(puzzle.solutionGrid)}
              </table>
            </div>
          </div>
        </div>
        <div class="puzzle-grid-container">
          <table class="puzzle-grid">
            ${renderGrid(puzzle.grid)}
          </table>
        </div>
      </div>
    </div>
  `;

  container.querySelector("#back-btn")?.addEventListener("click", () => {
    container.classList.add("hidden");
    container.innerHTML = "";
    document.getElementById("landing")!.classList.remove("hidden");
  });

  container.querySelector("#random-puzzle-btn")?.addEventListener("click", () => {
    if (onRandom) onRandom();
  });

  container.querySelector("#print-btn")?.addEventListener("click", () => {
    window.print();
  });
}
