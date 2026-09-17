const origins = new Set(['https://andrieliguissofotografia.com.br', 'https://www.andrieliguissofotografia.com.br']);
const json = (data, status = 200) => Response.json(data, {
  status,
  headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }
});
const dateInBrazil = (date) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(date);

export const createVisitsHandler = (getStore, now = () => new Date()) => async (request) => {
  if (!['GET', 'POST'].includes(request.method)) return json({ erro: 'Método não permitido.' }, 405);
  if (request.method === 'POST' && !origins.has(request.headers.get('origin'))) {
    return json({ erro: 'Origem não permitida.' }, 403);
  }
  try {
    const store = getStore();
    for (let attempt = 0; attempt < 8; attempt++) {
      const instant = now();
      const day = dateInBrazil(instant);
      const entry = await store.getWithMetadata('resumo', { type: 'json' });
      const previous = entry?.data;
      const summary = {
        total: previous?.total ?? 0,
        hoje: previous?.dia === day ? previous.hoje : 0,
        dia: day,
        desde: previous?.desde ?? null
      };
      // Consultar o contador nunca registra uma visita.
      if (request.method === 'GET') return json(summary);
      summary.total++;
      summary.hoje++;
      summary.desde ??= instant.toISOString();
      // A escrita condicional evita perder visitas que chegam ao mesmo tempo.
      const result = await store.setJSON('resumo', summary,
        entry ? { onlyIfMatch: entry.etag } : { onlyIfNew: true });
      if (result.modified) return json(summary);
    }
    return json({ erro: 'Contador ocupado. Tente novamente mais tarde.' }, 503);
  } catch {
    return json({ erro: 'Contador temporariamente indisponível.' }, 503);
  }
};
