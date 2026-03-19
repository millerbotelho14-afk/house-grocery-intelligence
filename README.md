# House Grocery Intelligence

MVP web para transformar cupons fiscais de supermercado em historico de compras, precos e insights domesticos.

## Stack

- Frontend: Next.js + React + TailwindCSS
- Backend: Node.js + Express
- Banco: PostgreSQL
- OCR: Tesseract (ponto de integracao preparado)
- Busca: fuzzy search local com caminho de evolucao para PostgreSQL FTS ou Meilisearch

## Estrutura

```text
apps/
  api/   -> API Express
  web/   -> app Next.js
packages/
  shared/ -> tipos compartilhados
database/
  schema.sql
```

## Fluxo principal

1. Usuario envia PDF, imagem, XML ou link NFC-e
2. Servico extrai texto e parseia os itens
3. Normalizacao inteligente agrupa produtos equivalentes
4. Compra e itens sao salvos
5. Historico de precos e dashboard sao atualizados

## Endpoints

- `POST /upload-receipt`
- `GET /products`
- `GET /products/:id`
- `GET /price-lookup`
- `GET /dashboard`
- `GET /purchases`

## Como evoluir para producao

- Substituir `mockDatabase` por acesso real ao PostgreSQL
- Conectar Tesseract no `apps/api/src/services/ocr.service.js`
- Adicionar autenticacao e multiusuario real
- Persistir embeddings/FTS para busca mais forte
- Adicionar fila para processamento assincrono de cupons

## Setup sugerido

```bash
npm install
npm run dev:api
npm run dev:web
```

API em `http://localhost:4000` e frontend em `http://localhost:3000`.

Se `DATABASE_URL` nao estiver configurada, a API roda em modo demo usando a base mockada.

## Scripts uteis no Windows

- `.\scripts\start-mvp.ps1` abre API e frontend em duas janelas
- `.\scripts\setup-database.ps1` cria o banco local e atualiza `apps/api/.env`
- `.\scripts\start-public-link.ps1` cria um link publico temporario para o frontend

## Deploy

O projeto tambem esta preparado para deploy containerizado com:

- `Dockerfile`
- `start-production.mjs`
- `render.yaml`

Isso permite publicar o app + API em um servico como Render, usando PostgreSQL gerenciado.
