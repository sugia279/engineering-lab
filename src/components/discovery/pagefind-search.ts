/**
 * Pagefind search browser controller.
 * Loaded only on /search/. Binds Pagefind to SearchForm and SearchResults.
 * Fails gracefully if Pagefind is unavailable.
 *
 * Registry: Browser component, M10.
 * No build-time imports; browser-only execution.
 */

// ---------------------------------------------------------------------------
// Pagefind type declarations (no published @types/pagefind)
// ---------------------------------------------------------------------------

interface PagefindResult {
  id: string;
  data: () => Promise<PagefindResultData>;
}

interface PagefindResultData {
  url: string;
  title: string;
  excerpt: string;
  meta?: Record<string, string>;
}

interface PagefindAPI {
  init: () => Promise<void>;
  search: (query: string) => Promise<{ results: PagefindResult[] }>;
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

const BASE = import.meta.env.BASE_URL as string;

function getStatusEl(): HTMLElement | null {
  return document.getElementById('search-status');
}
function getResultListEl(): HTMLElement | null {
  return document.getElementById('search-result-list');
}

function setStatus(msg: string): void {
  const el = getStatusEl();
  if (el) el.textContent = msg;
}

function clearResults(): void {
  const el = getResultListEl();
  if (el) el.innerHTML = '';
}

function renderResults(results: PagefindResultData[]): void {
  const el = getResultListEl();
  if (!el) return;
  el.innerHTML = '';

  if (results.length === 0) {
    setStatus('No results found.');
    return;
  }

  setStatus(`${results.length} result${results.length !== 1 ? 's' : ''}`);
  for (const r of results) {
    const li = document.createElement('li');
    li.className = 'search-results__item';
    li.innerHTML = `
      <a href="${r.url}" class="search-results__link">${r.title}</a>
      <p class="search-results__excerpt">${r.excerpt}</p>
    `;
    el.appendChild(li);
  }
}

function getQueryFromUrl(): string {
  return new URLSearchParams(window.location.search).get('q') ?? '';
}

function pushQueryToUrl(query: string): void {
  const url = new URL(window.location.href);
  if (query) {
    url.searchParams.set('q', query);
  } else {
    url.searchParams.delete('q');
  }
  window.history.pushState({}, '', url.toString());
}

async function initSearch(): Promise<void> {
  // Load Pagefind runtime from the built artifact path
  let pagefind: PagefindAPI;
  try {
    pagefind = (await import(/* @vite-ignore */ `${BASE}pagefind/pagefind.js`)) as PagefindAPI;
    await pagefind.init();
  } catch {
    setStatus('Search index is not available. Please build the site first.');
    return;
  }

  const form = document.querySelector<HTMLFormElement>('form[role="search"]');
  const input = document.getElementById('search-input') as HTMLInputElement | null;
  if (!form || !input) return;

  async function runSearch(query: string): Promise<void> {
    const trimmed = query.trim();
    if (!trimmed) {
      setStatus('');
      clearResults();
      return;
    }
    setStatus('Searching…');
    try {
      const { results } = await pagefind.search(trimmed);
      const data = await Promise.all(results.slice(0, 30).map((r) => r.data()));
      renderResults(data);
    } catch {
      setStatus('Search failed. Please try again.');
      clearResults();
    }
  }

  // Run search for URL query on load
  const initialQuery = getQueryFromUrl();
  if (initialQuery) {
    input.value = initialQuery;
    await runSearch(initialQuery);
  }

  // Bind form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value;
    pushQueryToUrl(query);
    void runSearch(query);
  });

  // Bind input for live search
  let debounceTimer: ReturnType<typeof setTimeout>;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      void runSearch(input.value);
    }, 250);
  });

  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    const query = getQueryFromUrl();
    input.value = query;
    void runSearch(query);
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void initSearch());
} else {
  void initSearch();
}
