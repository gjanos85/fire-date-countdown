'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../exchange-rate.js'), 'utf8');
// Synthetic fixtures only; no quoted value is shipped into the widget markup.
const valid = { date: '2025-01-17', base: 'CAD', quote: 'HUF', rate: 250.12 };
const flush = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };
function opening() {
  const elements = Object.fromEntries(['exchange-rate', 'fx-value', 'fx-status', 'fx-date'].map(id => [id, {
    textContent: '', dataset: {}, attributes: {}, hidden: false,
    setAttribute(key, value) { this.attributes[key] = value; },
    removeAttribute(key) { delete this.attributes[key]; },
  }]));
  const requests = [], timers = new Map(), listeners = {};
  let timerId = 0;
  vm.runInNewContext(source, {
    document: { getElementById: id => elements[id] },
    window: { addEventListener: (name, callback) => { listeners[name] = callback; } },
    AbortController, Intl, Date,
    setTimeout: (callback, delay) => { assert.equal(delay, 8000); timers.set(++timerId, callback); return timerId; },
    clearTimeout: id => timers.delete(id),
    fetch: (url, options) => new Promise((resolve, reject) => {
      requests.push({ url, options, resolve, reject });
      options.signal.addEventListener('abort', () => reject(new Error('Aborted')));
    }),
  });
  return { elements, requests, timers, listeners, widget: elements['exchange-rate'], value: elements['fx-value'], date: elements['fx-date'] };
}
async function respond(test, data, index = test.requests.length - 1) {
  test.requests[index].resolve({ ok: true, json: async () => data });
  await flush();
}
async function run() {
  const test = opening();
  assert.equal(test.requests.length, 1, 'Each opening immediately fetches');
  assert.equal(test.widget.dataset.state, 'loading');
  assert.equal(test.widget.attributes['aria-busy'], 'true');
  assert.equal(test.date.hidden, true);
  assert(test.value.textContent.includes('Loading'));
  const { url, options } = test.requests[0];
  assert.equal(url, 'https://api.frankfurter.dev/v2/rate/cad/huf');
  assert.equal(options.cache, 'no-store');
  assert.equal(options.credentials, 'omit');
  assert.equal(options.mode, 'cors');
  await respond(test, valid);
  assert.equal(test.widget.dataset.state, 'ready');
  assert.equal(test.value.textContent, '1 CAD = 250.12 HUF');
  assert.equal(test.date.attributes.datetime, valid.date);
  assert.equal(test.date.hidden, false);
  assert.equal(test.widget.attributes['aria-busy'], 'false');
  assert.equal(test.timers.size, 0);
  test.listeners.pageshow({ persisted: false });
  assert.equal(test.requests.length, 1, 'Initial pageshow does not double-fetch');
  test.listeners.pageshow({ persisted: true });
  assert.equal(test.requests.length, 2, 'Back/forward cache return freshly fetches');
  assert.equal(test.date.hidden, true, 'Old quote/date are cleared while refreshing');
  await respond(test, { ...valid, rate: 251.34 });
  assert.equal(test.value.textContent, '1 CAD = 251.34 HUF');
  assert.equal(opening().requests.length, 1, 'A separate page opening fetches again');

  const invalid = [null, [], {}, ...[0, -1, NaN, Infinity, '250.12', null].map(rate => ({ ...valid, rate })),
    { ...valid, base: 'USD' }, { ...valid, quote: 'EUR' }, { ...valid, date: '2025-02-30' },
    { ...valid, date: '2025-13-01' }, { ...valid, date: 'not-a-date' }, { ...valid, date: 20250117 },
    { ...valid, date: '9999-01-01' }];
  for (const quote of invalid) {
    const bad = opening(); await respond(bad, quote);
    assert.equal(bad.widget.dataset.state, 'unavailable', 'Reject invalid pair/rate/calendar date');
    assert.equal(bad.value.textContent, 'CAD → HUF unavailable');
    assert.equal(bad.date.hidden, true);
    assert.equal(bad.widget.attributes['aria-busy'], 'false');
  }
  for (const failure of ['http', 'json', 'network', 'timeout']) {
    const bad = opening();
    if (failure === 'http') bad.requests[0].resolve({ ok: false });
    if (failure === 'json') bad.requests[0].resolve({ ok: true, json: async () => { throw new Error('Bad JSON'); } });
    if (failure === 'network') bad.requests[0].reject(new Error('Offline'));
    if (failure === 'timeout') [...bad.timers.values()][0]();
    await flush();
    assert.equal(bad.widget.dataset.state, 'unavailable', failure);
    assert.equal(bad.timers.size, 0, 'Deadline is cleared after failure');
  }
  const overlapping = opening();
  overlapping.listeners.pageshow({ persisted: true });
  await flush();
  assert.equal(overlapping.widget.dataset.state, 'loading', 'Superseded abort cannot overwrite the new request');
  assert(overlapping.requests[0].options.signal.aborted);
  await respond(overlapping, valid);
  assert.equal(overlapping.widget.dataset.state, 'ready');
  console.log('PASS: FX opening/bfcache fetch, no-cache request, rate/date validation, loading, HTTP/JSON/network/timeout failures, and request races.');
}
module.exports = run;
if (require.main === module) run().catch(error => { console.error(error); process.exitCode = 1; });
