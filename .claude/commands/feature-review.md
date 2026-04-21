# Revisão de Feature

Use este skill ao terminar de implementar uma nova feature. Verifica se está completa, segura e consistente.

## 1. Completude
- A feature funciona no happy path?
- Os edge cases estão tratados? (campo vazio, registro inexistente, usuário sem permissão)
- Há tratamento de erro adequado retornando status HTTP correto?
  - 400 → input inválido
  - 401 → não autenticado
  - 403 → sem permissão
  - 404 → não encontrado
  - 409 → conflito (duplicado)
  - 422 → dados inválidos
  - 500 → erro interno (nunca expor detalhes ao cliente)

## 2. Segurança
- O endpoint usa `autenticar` middleware?
- Usa `req.usuario.tenant_id` (nunca o body do usuário) para filtrar dados?
- Inputs são validados antes de usar em queries?

## 3. Consistência com o projeto
- O padrão de resposta JSON é consistente com outros endpoints?
- Nomes de campos seguem o mesmo padrão (snake_case)?
- Erros retornam `{ erro: "mensagem" }` como os outros endpoints?

## 4. Frontend
- A página/componente trata o estado de loading?
- Erros da API são exibidos ao usuário de forma amigável?
- Após a ação, o estado local é atualizado (ou a lista é refetchada)?
- A feature funciona em mobile (layout responsivo)?

## 5. Teste manual
Descreva o passo a passo para testar manualmente esta feature no browser e diga se passou.

Informe: ✅ Feature pronta / ⚠️ Precisa ajustes / ❌ Bloqueadores encontrados
