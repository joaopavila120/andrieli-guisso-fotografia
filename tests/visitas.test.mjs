import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createVisitsHandler } from '../netlify/lib/visitas.mjs';

const origin = 'https://andrieliguissofotografia.com.br';
const request = (method = 'GET', source = origin) => new Request(`${origin}/.netlify/functions/visitas`, {
  method, headers: { origin: source }
});
function memoryStore() {
  let entry = null;
  let version = 0;
  return {
    async getWithMetadata() { return structuredClone(entry); },
    async setJSON(key, data, options) {
      if (options.onlyIfNew ? entry !== null : options.onlyIfMatch !== entry?.etag) return { modified: false };
      entry = { data: structuredClone(data), etag: String(++version) };
      return { modified: true };
    }
  };
}

test('consultas não incrementam; visitas simultâneas são preservadas', async () => {
  const store = memoryStore();
  const handler = createVisitsHandler(() => store);
  assert.equal((await (await handler(request())).json()).total, 0);
  const responses = await Promise.all(Array.from({ length: 6 }, () => handler(request('POST'))));
  assert.ok(responses.every((response) => response.status === 200));
  for (let i = 0; i < 2; i++) {
    const data = await (await handler(request())).json();
    assert.equal(data.total, 6);
    assert.equal(data.hoje, 6);
  }
});

test('troca do dia em Brasília zera hoje e preserva o total e início', async () => {
  const store = memoryStore();
  let instant = new Date('2026-09-18T02:59:00Z');
  const handler = createVisitsHandler(() => store, () => instant);
  const first = await (await handler(request('POST'))).json();
  assert.equal(first.dia, '2026-09-17');
  instant = new Date('2026-09-18T03:01:00Z');
  assert.equal((await (await handler(request())).json()).hoje, 0);
  const next = await (await handler(request('POST'))).json();
  assert.deepEqual(next, { total: 2, hoje: 1, dia: '2026-09-18', desde: first.desde });
});

test('rejeita outras origens, métodos e não devolve zero em falhas', async () => {
  const handler = createVisitsHandler(() => { throw new Error('offline'); });
  assert.equal((await handler(request('POST', 'https://example.com'))).status, 403);
  assert.equal((await handler(request('DELETE'))).status, 405);
  assert.equal((await handler(request())).status, 503);
  const busy = createVisitsHandler(() => ({
    getWithMetadata: async () => null, setJSON: async () => ({ modified: false })
  }));
  assert.equal((await busy(request('POST'))).status, 503);
});

const script = await readFile(new URL('../js/visitas.js', import.meta.url), 'utf8');
function browser(storage, calls, { hostname = 'andrieliguissofotografia.com.br', fail = false } = {}) {
  const window = {};
  vm.runInNewContext(script, {
    window, location: { hostname }, document: { visibilityState: 'visible' }, sessionStorage: storage,
    AbortSignal, console: { table() {} }, Date,
    fetch: async (url, options) => {
      calls.push(options.method);
      return { ok: !fail, json: async () => ({ total: 1, hoje: 1, desde: null }) };
    }
  });
  return window;
}

test('navegação na mesma aba e consulta no console não duplicam visitas', async () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
  const calls = [];
  await browser(storage, calls).verVisitas();
  await browser(storage, calls).verVisitas();
  assert.deepEqual(calls, ['POST', 'GET', 'GET']);
  values.set('ag-ultima-visita', String(Date.now() - 31 * 60 * 1000));
  await browser(storage, calls).verVisitas();
  assert.deepEqual(calls.slice(-2), ['POST', 'GET']);
});

test('falha de rede permite nova tentativa; armazenamento bloqueado não quebra o script', async () => {
  const storage = { getItem: () => { throw new Error(); }, setItem: () => { throw new Error(); } };
  const calls = [];
  await assert.rejects(browser(storage, calls, { fail: true }).verVisitas());
  await browser(storage, calls).verVisitas();
  assert.deepEqual(calls, ['POST', 'GET', 'POST', 'GET']);
  const localCalls = [];
  await browser(storage, localCalls, { hostname: 'localhost' }).verVisitas();
  assert.deepEqual(localCalls, ['GET']);
});
