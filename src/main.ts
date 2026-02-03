import { fetchPokemonList, fetchPokemon, type PokemonListEntry } from "./pokemon-api";
import { escapeHtml } from "./escape-html";
import { generateWordSearch } from "./word-search";
import { renderPuzzle } from "./puzzle-page";
import "./styles.css";

let pokemonList: PokemonListEntry[] = [];

const input = document.getElementById("pokemon-input") as HTMLInputElement;
const autocompleteList = document.getElementById("autocomplete-list") as HTMLUListElement;
const randomBtn = document.getElementById("random-btn") as HTMLButtonElement;
const landing = document.getElementById("landing") as HTMLDivElement;
const puzzleContainer = document.getElementById("puzzle-container") as HTMLDivElement;
const loading = document.getElementById("loading") as HTMLDivElement;

async function init() {
  try {
    pokemonList = await fetchPokemonList();
  } catch {
    landing.insertAdjacentHTML(
      "beforeend",
      '<p class="error">Failed to load Pokemon list. Please refresh.</p>'
    );
  }

  input.addEventListener("input", onInput);
  input.addEventListener("keydown", onKeydown);
  randomBtn.addEventListener("click", onRandom);
  document.addEventListener("click", (e) => {
    if (!(e.target as HTMLElement).closest(".search-container")) {
      autocompleteList.innerHTML = "";
    }
  });
}

let selectedIndex = -1;

function onInput() {
  const query = input.value.toLowerCase().trim();
  selectedIndex = -1;
  if (query.length < 1) {
    autocompleteList.innerHTML = "";
    return;
  }

  const matches = pokemonList
    .filter((p) => p.name.startsWith(query))
    .slice(0, 10);

  autocompleteList.innerHTML = matches
    .map(
      (p, i) =>
        `<li data-name="${escapeHtml(p.name)}" class="${i === selectedIndex ? "selected" : ""}">${escapeHtml(p.name)}</li>`
    )
    .join("");

  autocompleteList.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", () => {
      selectPokemon(li.dataset.name!);
    });
  });
}

function onKeydown(e: KeyboardEvent) {
  const items = autocompleteList.querySelectorAll("li");
  if (!items.length) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
    updateSelection(items);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    selectedIndex = Math.max(selectedIndex - 1, 0);
    updateSelection(items);
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (selectedIndex >= 0 && selectedIndex < items.length) {
      selectPokemon((items[selectedIndex] as HTMLElement).dataset.name!);
    } else if (items.length > 0) {
      selectPokemon((items[0] as HTMLElement).dataset.name!);
    }
  }
}

function updateSelection(items: NodeListOf<Element>) {
  items.forEach((item, i) => {
    item.classList.toggle("selected", i === selectedIndex);
  });
}

async function selectPokemon(name: string) {
  autocompleteList.innerHTML = "";
  input.value = name;
  await loadPuzzle(name);
}

function loadRandomPuzzle() {
  if (!pokemonList.length) return;
  const random = pokemonList[Math.floor(Math.random() * pokemonList.length)];
  input.value = random.name;
  loadPuzzle(random.name);
}

function onRandom() {
  loadRandomPuzzle();
}

async function loadPuzzle(nameOrId: string) {
  loading.classList.remove("hidden");
  randomBtn.disabled = true;
  input.disabled = true;

  try {
    const pokemon = await fetchPokemon(nameOrId);
    const puzzle = generateWordSearch(pokemon);

    landing.classList.add("hidden");
    puzzleContainer.classList.remove("hidden");
    renderPuzzle(puzzleContainer, pokemon, puzzle, loadRandomPuzzle);
  } catch (err) {
    alert(`Failed to load Pokemon: ${err instanceof Error ? err.message : err}`);
  } finally {
    loading.classList.add("hidden");
    randomBtn.disabled = false;
    input.disabled = false;
  }
}

init();
