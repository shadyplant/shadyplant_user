import type { Product } from "@/lib/products";

export type SearchHit = {
  product: Product;
  index: number;
  relevance: number;
};

export const SEARCH_RELEVANCE_THRESHOLD = 30;

export function normalizeText(value: string) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function tokenize(value: string) {
  return normalizeText(value)
    .split(" ")
    .map(singularizeToken)
    .filter(Boolean);
}

function singularizeToken(token: string) {
  if (token.length <= 3) {
    return token;
  }

  if (token.endsWith("ies")) {
    return `${token.slice(0, -3)}y`;
  }

  if (token.endsWith("sses")) {
    return token.slice(0, -2);
  }

  if (
    token.endsWith("es") &&
    !token.endsWith("ses") &&
    !token.endsWith("xes") &&
    !token.endsWith("zes")
  ) {
    return token;
  }

  if (
    token.endsWith("s") &&
    !token.endsWith("ss") &&
    !token.endsWith("us") &&
    !token.endsWith("is")
  ) {
    return token.slice(0, -1);
  }

  return token;
}

function levenshteinDistance(left: string, right: string) {
  const a = left;
  const b = right;

  if (a === b) {
    return 0;
  }

  if (!a.length) {
    return b.length;
  }

  if (!b.length) {
    return a.length;
  }

  const previousRow = Array.from({ length: b.length + 1 }, (_, index) => index);
  const currentRow = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    currentRow[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      const insertionCost = currentRow[j - 1] + 1;
      const deletionCost = previousRow[j] + 1;
      const substitutionCost =
        previousRow[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);

      currentRow[j] = Math.min(insertionCost, deletionCost, substitutionCost);
    }

    for (let j = 0; j <= b.length; j += 1) {
      previousRow[j] = currentRow[j];
    }
  }

  return previousRow[b.length];
}

function similarityScore(left: string, right: string) {
  if (!left || !right) {
    return 0;
  }

  const maxLength = Math.max(left.length, right.length);

  if (!maxLength) {
    return 0;
  }

  return 1 - levenshteinDistance(left, right) / maxLength;
}

function bestTokenMatchScore(queryToken: string, candidateToken: string) {
  const normalizedQueryToken = singularizeToken(normalizeText(queryToken));
  const normalizedCandidateToken = singularizeToken(normalizeText(candidateToken));

  if (!normalizedQueryToken || !normalizedCandidateToken) {
    return 0;
  }

  if (normalizedQueryToken === normalizedCandidateToken) {
    return 1;
  }

  if (
    normalizedCandidateToken.startsWith(normalizedQueryToken) ||
    normalizedQueryToken.startsWith(normalizedCandidateToken)
  ) {
    return 0.95;
  }

  const candidatePrefix = normalizedCandidateToken.slice(
    0,
    normalizedQueryToken.length,
  );
  const queryPrefix = normalizedQueryToken.slice(
    0,
    normalizedCandidateToken.length,
  );

  return Math.max(
    similarityScore(normalizedQueryToken, normalizedCandidateToken),
    similarityScore(normalizedQueryToken, candidatePrefix),
    similarityScore(queryPrefix, normalizedCandidateToken),
  );
}

function tokenSetScore(queryTokens: string[], candidateTokens: string[]) {
  if (!queryTokens.length || !candidateTokens.length) {
    return 0;
  }

  const scores = queryTokens.map((queryToken) =>
    candidateTokens.reduce(
      (bestScore, candidateToken) =>
        Math.max(bestScore, bestTokenMatchScore(queryToken, candidateToken)),
      0,
    ),
  );

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function scoreField(
  field: string,
  normalizedQuery: string,
  queryTokens: string[],
  weights: {
    exact: number;
    compactExact: number;
    startsWith: number;
    compactStartsWith: number;
    includes: number;
    compactIncludes: number;
    token: number;
  },
) {
  const normalizedField = normalizeText(field);

  if (!normalizedField) {
    return 0;
  }

  const compactField = normalizedField.replace(/\s+/g, "");
  const compactQuery = normalizedQuery.replace(/\s+/g, "");
  let score = 0;

  if (normalizedField === normalizedQuery) {
    score += weights.exact;
  }

  if (compactField === compactQuery) {
    score += weights.compactExact;
  }

  if (normalizedField.startsWith(normalizedQuery)) {
    score += weights.startsWith;
  }

  if (compactField.startsWith(compactQuery)) {
    score += weights.compactStartsWith;
  }

  if (normalizedField.includes(normalizedQuery)) {
    score += weights.includes;
  }

  if (compactField.includes(compactQuery)) {
    score += weights.compactIncludes;
  }

  const fieldTokens = tokenize(field);
  const tokenScore = tokenSetScore(queryTokens, fieldTokens);

  if (tokenScore > 0) {
    score += Math.round(tokenScore * weights.token);
  }

  return score;
}

export function calculateScore(product: Product, query: string) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return 0;
  }

  const queryTokens = tokenize(query);
  const name = product.name || "";
  const category = product.category || "";
  const badge = product.badge || "";
  const description = product.description || "";
  const variety = product.variety || "";
  const tags = Array.isArray(product.tags) ? product.tags.join(" ") : "";
  const sku = product.sku || "";

  let score = 0;

  score += scoreField(name, normalizedQuery, queryTokens, {
    exact: 120,
    compactExact: 110,
    startsWith: 80,
    compactStartsWith: 75,
    includes: 60,
    compactIncludes: 55,
    token: 90,
  });

  score += scoreField(variety, normalizedQuery, queryTokens, {
    exact: 35,
    compactExact: 30,
    startsWith: 24,
    compactStartsWith: 20,
    includes: 18,
    compactIncludes: 16,
    token: 28,
  });

  score += scoreField(category, normalizedQuery, queryTokens, {
    exact: 28,
    compactExact: 24,
    startsWith: 20,
    compactStartsWith: 18,
    includes: 16,
    compactIncludes: 14,
    token: 20,
  });

  score += scoreField(badge, normalizedQuery, queryTokens, {
    exact: 22,
    compactExact: 18,
    startsWith: 16,
    compactStartsWith: 14,
    includes: 12,
    compactIncludes: 10,
    token: 16,
  });

  score += scoreField(tags, normalizedQuery, queryTokens, {
    exact: 22,
    compactExact: 18,
    startsWith: 16,
    compactStartsWith: 14,
    includes: 12,
    compactIncludes: 10,
    token: 16,
  });

  score += scoreField(sku, normalizedQuery, queryTokens, {
    exact: 16,
    compactExact: 14,
    startsWith: 12,
    compactStartsWith: 10,
    includes: 8,
    compactIncludes: 8,
    token: 10,
  });

  score += scoreField(description, normalizedQuery, queryTokens, {
    exact: 12,
    compactExact: 10,
    startsWith: 8,
    compactStartsWith: 8,
    includes: 6,
    compactIncludes: 6,
    token: 8,
  });

  return score;
}

export function searchProducts(products: Product[], query: string) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return products.map((product, index) => ({
      product,
      index,
      relevance: 0,
    }));
  }

  return products
    .map((product, index) => ({
      product,
      index,
      relevance: calculateScore(product, query),
    }))
    .filter(({ relevance }) => relevance >= SEARCH_RELEVANCE_THRESHOLD)
    .sort((left, right) => right.relevance - left.relevance || left.index - right.index);
}
