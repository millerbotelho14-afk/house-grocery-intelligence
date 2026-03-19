const aliases = [
  { patterns: ["leite", "po", "italac"], normalized: "Leite em Po Italac", category: "Laticinios" },
  { patterns: ["leite", "italac"], normalized: "Leite Italac 1L", category: "Laticinios" },
  { patterns: ["azeite", "oliva"], normalized: "Azeite de Oliva 500ml", category: "Mercearia" },
  { patterns: ["arroz"], normalized: "Arroz Tipo 1 5kg", category: "Mercearia" },
  { patterns: ["feijao"], normalized: "Feijao Carioca 1kg", category: "Mercearia" },
  { patterns: ["patinho"], normalized: "Patinho Bovino kg", category: "Carnes" }
];

export function normalizeProductName(originalName) {
  const name = originalName.toLowerCase();
  const match = aliases.find((entry) => entry.patterns.every((pattern) => name.includes(pattern)));

  if (match) {
    return {
      normalizedProductName: match.normalized,
      category: match.category
    };
  }

  return {
    normalizedProductName: toTitleCase(originalName),
    category: "Outros"
  };
}

function toTitleCase(value) {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}
