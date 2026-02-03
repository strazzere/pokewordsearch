const API_BASE = "https://pokeapi.co/api/v2";

export interface PokemonListEntry {
  name: string;
  url: string;
}

export interface PokemonData {
  name: string;
  id: number;
  types: string[];
  weaknesses: string[];
  strengths: string[];
  abilities: string[];
  genus: string;
  artworkUrl: string;
}

export async function fetchPokemonList(): Promise<PokemonListEntry[]> {
  const res = await fetch(`${API_BASE}/pokemon?limit=1025`);
  const data = await res.json();
  return data.results as PokemonListEntry[];
}

export async function fetchPokemon(nameOrId: string | number): Promise<PokemonData> {
  const res = await fetch(`${API_BASE}/pokemon/${nameOrId}`);
  if (!res.ok) throw new Error(`Pokemon not found: ${nameOrId}`);
  const pokemon = await res.json();

  const types: string[] = pokemon.types.map(
    (t: { type: { name: string } }) => t.type.name
  );
  const abilities: string[] = pokemon.abilities.map(
    (a: { ability: { name: string } }) => a.ability.name
  );
  const artworkUrl: string =
    pokemon.sprites?.other?.["official-artwork"]?.front_default ??
    pokemon.sprites?.front_default ??
    "";

  const typeDetails = await Promise.all(types.map(fetchTypeDetails));

  const weaknessSet = new Set<string>();
  const strengthSet = new Set<string>();
  for (const td of typeDetails) {
    for (const w of td.weaknesses) weaknessSet.add(w);
    for (const s of td.strengths) strengthSet.add(s);
  }

  let genus = "";
  try {
    const speciesRes = await fetch(`${API_BASE}/pokemon-species/${pokemon.id}`);
    if (speciesRes.ok) {
      const speciesData = await speciesRes.json();
      const enGenus = speciesData.genera?.find(
        (g: { language: { name: string }; genus: string }) =>
          g.language.name === "en"
      );
      if (enGenus) {
        // Extract the category word, e.g. "Mouse Pokemon" -> "Mouse"
        genus = enGenus.genus.replace(/\s*pok.mon$/i, "").trim();
      }
    }
  } catch {
    // genus is optional
  }

  return {
    name: pokemon.name,
    id: pokemon.id,
    types,
    weaknesses: [...weaknessSet],
    strengths: [...strengthSet],
    abilities,
    genus,
    artworkUrl,
  };
}

async function fetchTypeDetails(
  typeName: string
): Promise<{ weaknesses: string[]; strengths: string[] }> {
  const res = await fetch(`${API_BASE}/type/${typeName}`);
  const data = await res.json();
  const weaknesses: string[] = data.damage_relations.double_damage_from.map(
    (t: { name: string }) => t.name
  );
  const strengths: string[] = data.damage_relations.double_damage_to.map(
    (t: { name: string }) => t.name
  );
  return { weaknesses, strengths };
}
