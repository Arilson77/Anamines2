# Auditoria de Variáveis de Ambiente

Audite todas as variáveis de ambiente do projeto e identifique problemas.

## O que verificar

1. **Completude** — Leia CLAUDE.md e liste todas as vars necessárias. Para cada uma:
   - Está definida no `.env.example`?
   - Tem um formato esperado? (ex: STRIPE_SECRET_KEY deve começar com `sk_`, price IDs com `price_`)
   - Pode ter caracteres invisíveis problemáticos? (keys copiadas podem ter `\n` no final)

2. **Consistência frontend/backend**
   - `NEXT_PUBLIC_API_URL` aponta para a URL correta do Railway?
   - `FRONTEND_URL` no backend bate com a URL do Vercel?
   - `JWT_SECRET` é o mesmo nos dois serviços?

3. **Stripe**
   - `STRIPE_SECRET_KEY`: começa com `sk_test_` (test) ou `sk_live_` (produção)?
   - `STRIPE_PRICE_BASICO` e `STRIPE_PRICE_PRO`: começam com `price_` (não `prod_`)?
   - `STRIPE_WEBHOOK_SECRET`: está configurado?

4. **Banco de dados**
   - `DATABASE_URL` e `DATABASE_URL_TEST` são diferentes?

5. **Riscos**
   - Existe algum `.env` commitado no git? (`git ls-files | grep .env`)
   - Existe `.gitignore` cobrindo `.env*`?

Reporte cada variável com status: ✅ OK / ❌ AUSENTE / ⚠️ SUSPEITO e explique o problema.
