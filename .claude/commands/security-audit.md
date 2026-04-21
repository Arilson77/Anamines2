# Auditoria de Segurança

Faça uma revisão de segurança completa do projeto. Verifique cada área e reporte vulnerabilidades.

## 1. Autenticação e autorização
- Todas as rotas protegidas usam o middleware `autenticar`?
- O middleware injeta `app.tenant_id` via `set_config` seguro (parametrizado)?
- O JWT tem expiração configurada?
- Rotas públicas (`/publico/*`, `/auth/*`) estão explicitamente sem `autenticar`?

## 2. Multi-tenancy e isolamento de dados (RLS)
- Todas as tabelas (exceto `tenants` e `usuarios`) têm RLS habilitado?
- Queries que usam `tenant_id` usam parâmetros `$1`, `$2` (não interpolação de string)?
- O `req.usuario.tenant_id` é sempre usado nas queries, nunca o body do usuário?

## 3. Injeção
- Procure por queries com template literals (`` ` ``) misturando variáveis do usuário
- Procure por `eval()`, `exec()`, `spawn()` com input do usuário
- Verifique se há validação nos endpoints que recebem dados externos

## 4. CORS
- `FRONTEND_URL` está restrito a domínios específicos?
- Não aceita `*` em produção?

## 5. Dados sensíveis
- Senhas são hasheadas com bcrypt antes de salvar?
- Logs não expõem senhas, tokens ou chaves completas?
- `.env` está no `.gitignore`?

## 6. Rate limiting
- `express-rate-limit` está configurado?
- `trust proxy` está ativo para funcionar corretamente no Railway?

## 7. LGPD
- Consentimento é registrado com timestamp?
- Há endpoint para deletar dados do paciente?

Classifique cada problema como 🔴 CRÍTICO / 🟡 MÉDIO / 🟢 BAIXO e sugira o fix.
