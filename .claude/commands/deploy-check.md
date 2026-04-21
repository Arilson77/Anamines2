# Pre-Deploy Checklist

Faça uma revisão completa antes do deploy. Verifique cada item abaixo e reporte o status (✅ OK / ❌ PROBLEMA / ⚠️ ATENÇÃO):

## 1. Variáveis de ambiente
- Liste todas as variáveis necessárias definidas em CLAUDE.md
- Verifique se existe `.env.example` atualizado com todas as vars
- Identifique vars que podem estar faltando ou com valores suspeitos

## 2. Migrações de banco
- Verifique se `schema.sql` tem todas as alterações recentes
- Confirme se `scripts/migrate.js` vai rodar corretamente no Railway
- Procure por ALTER TABLE ou novas colunas que podem quebrar dados existentes

## 3. Testes
- Rode `npm test` no `anamnese-api/` e reporte resultado
- Se falhar, mostre o erro e sugira correção

## 4. Build do frontend
- Rode `npm run build` no `anamnese-web/` e reporte resultado
- Procure erros de TypeScript ou imports quebrados

## 5. Segurança
- Verifique se nenhuma chave/secret está hardcoded no código
- Confirme que rotas protegidas usam middleware `autenticar`
- Verifique se CORS está restrito corretamente

## 6. Git
- Mostre `git status` — há arquivos não commitados importantes?
- Há arquivos sensíveis (.env) sendo trackados?

Ao final, dê um resumo: **PRONTO PARA DEPLOY** ou **BLOQUEADORES ENCONTRADOS** com lista de itens a corrigir.
