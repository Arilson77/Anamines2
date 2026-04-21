# Revisão Completa do Projeto

Faz uma varredura completa do projeto Anamnese SaaS e gera um relatório de saúde geral.

Execute cada verificação abaixo e consolide tudo num relatório final.

## 1. Estado do código
- Leia CLAUDE.md para entender a arquitetura atual
- Há TODOs ou FIXMEs críticos no código? (`grep -r "TODO\|FIXME\|HACK\|XXX"`)
- Há `console.log` de debug que não deveriam estar em produção?
- Há código comentado que deveria ser removido?

## 2. Segurança (resumo rápido)
- Todas as rotas de dados usam `autenticar`?
- Nenhum secret hardcoded?
- RLS ativo nas tabelas de tenant?

## 3. Qualidade do código
- Há duplicação óbvia de lógica entre controllers?
- Middlewares de erro estão capturando e tratando corretamente?
- O middleware `verificarPlano` está aplicado nas rotas corretas?

## 4. Integração Stripe
- `getStripe()` usa `.trim()` na chave?
- Usa `createNodeHttpClient` para evitar problemas de fetch?
- Webhook está configurado corretamente?

## 5. Frontend
- `lib/api.ts` trata o erro 402 e redireciona para `/planos`?
- O token está sendo salvo em localStorage E cookie (dual-storage)?
- Middleware do Edge lê o cookie `anamnese_token` corretamente?

## 6. Infraestrutura
- `railway.json` tem `releaseCommand` para rodar migrations?
- `trust proxy` está ativo no Express?
- `.gitignore` cobre `.env*`?

## Relatório final
Gere uma tabela com:
| Área | Status | Problemas encontrados |
|------|--------|-----------------------|

E uma lista priorizada de melhorias recomendadas (🔴 urgente / 🟡 importante / 🟢 melhoria futura).
