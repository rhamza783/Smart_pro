import { SearchResult, SearchOptions } from '../types';

export function fuzzySearch<T>(
  query: string,
  items: T[],
  fields: (keyof T)[],
  options: SearchOptions = {}
): SearchResult<T>[] {
  if (!query) return [];

  const {
    maxResults = 10,
    minScore = 1,
    caseSensitive = false,
    exactMatchBoost = 0,
    prefixMatchBoost = 0,
  } = options;

  const normalizedQuery = caseSensitive ? query : query.toLowerCase();

  const results: SearchResult<T>[] = items
    .map((item) => {
      let bestScore = 0;
      let bestField = '';
      let bestValue = '';
      let bestRanges: [number, number][] = [];

      fields.forEach((field) => {
        const val = item[field];
        if (typeof val !== 'string') return;

        const normalizedVal = caseSensitive ? val : val.toLowerCase();
        let score = 0;
        let ranges: [number, number][] = [];

        if (normalizedVal === normalizedQuery) {
          score = 100 + exactMatchBoost;
          ranges = [[0, val.length]];
        } else if (normalizedVal.startsWith(normalizedQuery)) {
          score = 80 + prefixMatchBoost;
          ranges = [[0, query.length]];
        } else if (new RegExp(`\\b${normalizedQuery}`, 'i').test(normalizedVal)) {
          score = 60;
          const start = normalizedVal.indexOf(normalizedQuery);
          ranges = [[start, start + query.length]];
        } else if (normalizedVal.includes(normalizedQuery)) {
          score = 40;
          const start = normalizedVal.indexOf(normalizedQuery);
          ranges = [[start, start + query.length]];
        } else {
          // Fuzzy match (all chars present in order)
          let qIdx = 0;
          let vIdx = 0;
          const tempRanges: [number, number][] = [];
          
          while (qIdx < normalizedQuery.length && vIdx < normalizedVal.length) {
            if (normalizedQuery[qIdx] === normalizedVal[vIdx]) {
              tempRanges.push([vIdx, vIdx + 1]);
              qIdx++;
            }
            vIdx++;
          }

          if (qIdx === normalizedQuery.length) {
            score = 20;
            ranges = tempRanges;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestField = String(field);
          bestValue = val;
          bestRanges = ranges;
        }
      });

      return {
        item,
        score: bestScore,
        matchedField: bestField,
        matchedValue: bestValue,
        highlightRanges: bestRanges,
      };
    })
    .filter((res) => res.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return results;
}
