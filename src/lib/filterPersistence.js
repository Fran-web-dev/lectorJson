export function loadPersistedFilters(storageKey) {
  if (typeof window === 'undefined' || !storageKey) return {};

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}

export function savePersistedFilters(storageKey, filters) {
  if (typeof window === 'undefined' || !storageKey) return;

  try {
    const hasActiveFilters = Object.values(filters || {}).some((values) => Array.isArray(values) && values.length);
    if (!hasActiveFilters) {
      window.localStorage.removeItem(storageKey);
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify(filters));
  } catch {
    // Ignore storage failures; filters still work for the current session.
  }
}

export function resolveFilterUpdate(update, previousFilters) {
  return typeof update === 'function' ? update(previousFilters) : update;
}

export function loadPersistedSort(storageKey) {
  if (typeof window === 'undefined' || !storageKey) return { column: '', direction: 'asc' };

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { column: '', direction: 'asc' };
    return {
      column: typeof parsed.column === 'string' ? parsed.column : '',
      direction: parsed.direction === 'desc' ? 'desc' : 'asc'
    };
  } catch {
    return { column: '', direction: 'asc' };
  }
}

export function savePersistedSort(storageKey, sortConfig) {
  if (typeof window === 'undefined' || !storageKey) return;

  try {
    if (!sortConfig?.column) {
      window.localStorage.removeItem(storageKey);
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify({
      column: sortConfig.column,
      direction: sortConfig.direction === 'desc' ? 'desc' : 'asc'
    }));
  } catch {
    // Ignore storage failures; sorting still works for the current session.
  }
}

export function resolveSortUpdate(update, previousSort) {
  return typeof update === 'function' ? update(previousSort) : update;
}
