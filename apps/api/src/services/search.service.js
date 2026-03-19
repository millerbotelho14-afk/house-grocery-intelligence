export function fuzzyScore(query, target) {
  const normalizedQuery = normalize(query);
  const normalizedTarget = normalize(target);

  if (!normalizedQuery) return 1;
  if (normalizedTarget.includes(normalizedQuery)) return normalizedQuery.length + 10;

  const queryTokens = normalizedQuery.split(" ");
  const targetTokens = normalizedTarget.split(" ");
  return queryTokens.reduce((score, token) => {
    if (targetTokens.some((word) => word.startsWith(token))) return score + 4;
    if (normalizedTarget.includes(token)) return score + 2;
    return score;
  }, 0);
}

function normalize(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
