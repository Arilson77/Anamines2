# Diagnóstico Stripe

Diagnostique problemas na integração com Stripe. Analise o código e guie o diagnóstico.

## 1. Verificar configuração do cliente Stripe
- Leia `anamnese-api/src/controllers/cobranca.js`
- A função `getStripe()` usa `.trim()` na chave?
- Está forçando `Stripe.createNodeHttpClient()` para evitar problemas com `fetch` no Node 18+?
- `maxNetworkRetries` está configurado?

## 2. Verificar Price IDs
- Os `STRIPE_PRICE_BASICO` e `STRIPE_PRICE_PRO` começam com `price_` (não `prod_`)?
- O objeto `PLANOS` em `cobranca.js` está lendo as vars corretamente?

## 3. Verificar webhook
- A rota `/cobranca/webhook` usa `express.raw()` antes do `express.json()`?
- `STRIPE_WEBHOOK_SECRET` está definido?

## 4. Checklist de erros comuns
- `StripeConnectionError` com `detail: ERR_INVALID_CHAR` → chave com `\n` no final, aplicar `.trim()`
- `StripeConnectionError` sem detalhe → Stripe SDK usando `fetch` com problema de rede, forçar `createNodeHttpClient`
- `No such price` → Price ID errado, verificar no Stripe Dashboard → Products
- `StripeAuthenticationError` → chave inválida ou expirada
- `STRIPE_SECRET_KEY: VAZIO` nos logs → variável não injetada no Railway, fazer redeploy

## 5. Endpoint de diagnóstico
Se o endpoint `/health/stripe` existir, instrua o usuário a acessá-lo e interpretar o resultado:
- `{"ok":true,"status":404}` → rede OK, problema está na SDK ou na chave
- `{"ok":false,"error":"..."}` → problema de rede/DNS/TLS

Ao final, aponte o problema mais provável e o fix específico.
