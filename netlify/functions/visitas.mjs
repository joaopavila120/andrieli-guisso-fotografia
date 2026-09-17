import { getStore } from '@netlify/blobs';
import { createVisitsHandler } from '../lib/visitas.mjs';

export default createVisitsHandler(() => getStore({ name: 'visitas', consistency: 'strong' }));
