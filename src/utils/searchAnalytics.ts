interface SearchLogEntry {
  query: string;
  resultCount: number;
  selectedItem?: string;
  timestamp: number;
}

const STORAGE_KEY = 'pos_search_log';
const MAX_ENTRIES = 100;

export function trackSearch(query: string, resultCount: number, selectedItem?: string): void {
  if (!query) return;

  const entry: SearchLogEntry = {
    query,
    resultCount,
    selectedItem,
    timestamp: Date.now(),
  };

  const stored = localStorage.getItem(STORAGE_KEY);
  let logs: SearchLogEntry[] = [];
  if (stored) {
    try {
      logs = JSON.parse(stored);
    } catch (e) {
      logs = [];
    }
  }

  logs.unshift(entry);
  if (logs.length > MAX_ENTRIES) {
    logs = logs.slice(0, MAX_ENTRIES);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

export function getSearchAnalytics() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as SearchLogEntry[];
  } catch (e) {
    return [];
  }
}

export function getTopSearchedItems() {
  const logs = getSearchAnalytics();
  const counts: Record<string, number> = {};

  logs.forEach((log) => {
    if (log.selectedItem) {
      counts[log.selectedItem] = (counts[log.selectedItem] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
}
