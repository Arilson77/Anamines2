# Revisão de Performance

Analise o projeto em busca de gargalos de performance no backend e frontend.

## Backend

### Queries
- Procure queries dentro de loops (N+1) em `anamnese-api/src/`
- Há queries sem índice em colunas de filtro comuns (`tenant_id`, `paciente_id`, `status`)?
- Queries que retornam todas as colunas com `SELECT *` quando só precisa de algumas?
- Há paginação nos endpoints que listam muitos registros (pacientes, fichas)?

### Pool de conexões
- O pool do PostgreSQL é reutilizado (módulo singleton) ou criado por request?
- Conexões são sempre liberadas no `finally`?

### Respostas
- Respostas grandes têm compressão (gzip)?
- PDFs são gerados on-demand ou cacheados?

## Frontend

### Requisições
- Há chamadas de API redundantes na mesma página?
- Dados que não mudam são cacheados (ex: status do plano)?
- `useEffect` com dependências erradas causando re-fetches?

### Bundle
- Componentes grandes são importados dinamicamente com `next/dynamic`?
- Imagens usam `next/image`?

### Rendering
- Páginas que poderiam ser SSG estão sendo SSR desnecessariamente?

## Sugestões de melhoria
Para cada problema encontrado, sugira:
1. O que está lento
2. Por que está lento
3. Como corrigir (com código se necessário)
