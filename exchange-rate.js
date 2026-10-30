/* Fetch a daily reference quote on every opening, never on the animation clock. */
(() => {
  'use strict';
  const widget = document.getElementById('exchange-rate');
  const value = document.getElementById('fx-value');
  const status = document.getElementById('fx-status');
  const date = document.getElementById('fx-date');
  if (!widget || !value || !status || !date) return;
  const endpoint = 'https://api.frankfurter.dev/v2/rate/cad/huf';
  const numbers = new Intl.NumberFormat('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dates = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
  let activeRequest, sequence = 0;

  async function refresh() {
    const current = ++sequence;
    activeRequest?.abort();
    const request = new AbortController();
    activeRequest = request;
    widget.dataset.state = 'loading';
    widget.setAttribute('aria-busy', 'true');
    value.textContent = 'CAD → HUF · Loading…';
    status.textContent = 'Daily reference';
    date.hidden = true;
    date.textContent = '';
    date.removeAttribute('datetime');
    const timeout = setTimeout(() => request.abort(), 8000);
    try {
      const response = await fetch(endpoint, { cache: 'no-store', mode: 'cors', credentials: 'omit', signal: request.signal });
      if (!response.ok) throw new Error('Reference rate unavailable');
      const quote = await response.json();
      if (!quote || Array.isArray(quote) || quote.base !== 'CAD' || quote.quote !== 'HUF' ||
          typeof quote.rate !== 'number' || !Number.isFinite(quote.rate) || quote.rate <= 0 ||
          typeof quote.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(quote.date)) {
        throw new Error('Invalid reference quote');
      }
      const published = new Date(`${quote.date}T00:00:00Z`);
      if (!Number.isFinite(published.getTime()) || published.toISOString().slice(0, 10) !== quote.date || published.getTime() > Date.now()) {
        throw new Error('Invalid reference date');
      }
      if (current !== sequence) return;
      value.textContent = `1 CAD = ${numbers.format(quote.rate)} HUF`;
      status.textContent = 'As of ';
      date.setAttribute('datetime', quote.date);
      date.textContent = dates.format(published);
      date.hidden = false;
      widget.dataset.state = 'ready';
    } catch {
      if (current !== sequence) return;
      value.textContent = 'CAD → HUF unavailable';
      status.textContent = 'Try reopening the page';
      widget.dataset.state = 'unavailable';
    } finally {
      clearTimeout(timeout);
      if (current === sequence) {
        widget.setAttribute('aria-busy', 'false');
        activeRequest = null;
      }
    }
  }
  window.addEventListener('pageshow', event => { if (event.persisted) refresh(); });
  refresh();
})();
