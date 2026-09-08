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

Abra `index.html` no navegador. O projeto usa apenas HTML, CSS e JavaScript, sem etapa de build.
