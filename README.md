# Andrieli Guisso Fotografia

Portfólio fotográfico responsivo com identidade editorial, galeria filtrável, frases sobre as imagens e animações suaves.

## Atualização fácil das fotos

Você não precisa editar o HTML para trocar as fotografias.

1. Adicione ou exclua os arquivos originais dentro da pasta correspondente:
   - `img/gestantes`
   - `img/newborn`
   - `img/retratos`
2. Dê dois cliques em `ATUALIZAR-SITE.bat`.
3. Quando o processamento terminar, responda `S` para também publicar as alterações no GitHub ou `N` para apenas atualizar o site local.

O atualizador aceita imagens JPG, JPEG e PNG. Ele preserva os arquivos originais, corrige a orientação, cria versões leves em `img/web`, remove do site as fotos que já não existem nas pastas de origem e atualiza automaticamente a galeria, as capas e os contadores.

Use nomes diferentes para cada foto de uma mesma categoria. Evite, por exemplo, ter `ensaio.jpg` e `ensaio.png` juntos na mesma pasta.

## Frases das fotografias

As frases, títulos e nomes das categorias ficam em `config/frases.json`. Você pode adicionar, remover ou editar textos nesse arquivo e depois executar `ATUALIZAR-SITE.bat` novamente.

Cada fotografia recebe sempre a mesma frase enquanto mantiver o mesmo nome. Ao incluir uma foto nova, o site seleciona automaticamente um dos textos da categoria correspondente.

## Estrutura do site

- `index.html` — apresentação, trabalhos em destaque e experiências
- `portfolio.html` — galeria automática, filtros e visualização ampliada
- `sobre.html` — posicionamento, valores e processo de trabalho
- `agendamento.html` — contato direto pelo WhatsApp
- `config/frases.json` — textos usados sobre as fotografias
- `scripts/atualizar-galeria.ps1` — otimização e organização automática
- `ATUALIZAR-SITE.bat` — atalho para atualizar e publicar

## Como visualizar

Abra `index.html` no navegador. A interface usa HTML, CSS e JavaScript. No Netlify, `npm run build` copia os arquivos públicos para `dist` e publica a função do contador.

## Consultar visitas

No site publicado, pressione **F12**, abra **Console** e digite:

```js
verVisitas()
```

O comando mostra o total, as visitas de hoje (horário de Brasília) e quando a contagem começou. Também é possível abrir diretamente https://andrieliguissofotografia.com.br/.netlify/functions/visitas para consultar os números. Consultas não incrementam o contador. Os totais são públicos.

A contagem começa com a primeira visita após a publicação, sem recuperar acessos antigos. Uma visita corresponde à abertura do site em uma aba; navegação e recarregamentos nessa aba não contam novamente enquanto o intervalo entre carregamentos for inferior a 30 minutos. Outras abas, navegadores e dispositivos podem contar novamente. Sem `sessionStorage`, cada carregamento pode contar. Não é uma contagem de pessoas únicas e pode incluir robôs que executem JavaScript ou acessos artificiais.

O contador salva somente números e datas no Netlify Blobs, sem IP, nome, identificadores de visitantes ou histórico individual. Uma marca de tempo fica no `sessionStorage` da aba para evitar repetições. O script só registra acessos nos domínios de produção; falhas no contador não impedem a navegação. A consulta também funciona no painel do Netlify em **Data & Storage → Blobs → visitas → resumo**.

Não requer a assinatura do Netlify Analytics nem outra conta. Functions e Blobs usam os limites/franquias do plano Netlify existente; não há promessa de uso ilimitado gratuito. Os dados permanecem entre publicações no mesmo projeto Netlify.

Para validar localmente: `npm install`, `npm test` e `npm run build`. Abrir o HTML local permite visualizar o site, mas o contador depende das funções do Netlify.
