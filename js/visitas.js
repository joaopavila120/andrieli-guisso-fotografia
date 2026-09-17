(() => {
  const endpoint = '/.netlify/functions/visitas';
  const storageKey = 'ag-ultima-visita';
  const sessionDuration = 30 * 60 * 1000;
  const production = ['andrieliguissofotografia.com.br', 'www.andrieliguissofotografia.com.br'].includes(location.hostname);
  const request = async (method = 'GET') => {
    const response = await fetch(endpoint, { method, cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Não foi possível consultar o contador de visitas. Tente novamente.');
    return response.json();
  };

  const register = async () => {
    if (!production || document.visibilityState !== 'visible') return;
    const timestamp = Date.now();
    let lastVisit = 0;
    try { lastVisit = Number(sessionStorage.getItem(storageKey)) || 0; } catch { /* Armazenamento bloqueado. */ }
    if (lastVisit > 0 && timestamp - lastVisit < sessionDuration) {
      try { sessionStorage.setItem(storageKey, String(timestamp)); } catch { /* Opcional. */ }
      return;
    }
    await request('POST');
    try { sessionStorage.setItem(storageKey, String(timestamp)); } catch { /* Opcional. */ }
  };

  let registration = Promise.resolve();
  const start = () => { registration = register().catch(() => {}); };
  if (document.visibilityState === 'visible') start();
  else document.addEventListener('visibilitychange', function onVisible() {
    if (document.visibilityState !== 'visible') return;
    document.removeEventListener('visibilitychange', onVisible);
    start();
  });

  window.verVisitas = async () => {
    await registration;
    const data = await request();
    console.table({ 'Total de visitas': data.total, 'Visitas de hoje (Brasília)': data.hoje,
      'Contagem iniciada em': data.desde ? new Date(data.desde).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Aguardando primeira visita' });
    return data;
  };
})();
