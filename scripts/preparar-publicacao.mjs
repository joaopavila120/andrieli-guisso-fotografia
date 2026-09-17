import { cp, mkdir, readdir } from 'node:fs/promises';

// Publica somente os arquivos do site, sem dependências ou código do servidor.
await mkdir('dist', { recursive: true });
const pages = (await readdir('.')).filter((name) => name.endsWith('.html'));
const assets = ['css', 'js', 'img/web', 'img/logo.png', 'img/favicon-64.png', 'img/apple-touch-icon.png'];
for (const path of [...pages, ...assets]) {
  await cp(path, `dist/${path}`, { recursive: true });
}
