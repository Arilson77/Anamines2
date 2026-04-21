# Revisão do Banco de Dados

Analise o banco de dados do projeto e identifique problemas de schema, performance e segurança.

## 1. Schema e migrações
- Leia `anamnese-api/schema.sql`
- Todas as tabelas têm chave primária UUID com `gen_random_uuid()`?
- Colunas de timestamp têm `DEFAULT NOW()`?
- Foreign keys têm `ON DELETE` definido adequadamente?
- Há índices nas colunas usadas em WHERE e JOIN?

## 2. Row Level Security (RLS)
- RLS está habilitado em todas as tabelas de dados dos tenants?
- As policies usam `current_setting('app.tenant_id')::UUID`?
- Existe policy tanto para SELECT quanto para INSERT/UPDATE/DELETE?
- A tabela `tenants` e `usuarios` têm RLS desabilitado intencionalmente?

## 3. Queries no código
- Procure queries sem `WHERE tenant_id = $n` em tabelas que deveriam ser isoladas
- Procure `SELECT *` que poderiam expor dados desnecessários
- Há queries N+1 (query dentro de loop)?
- Transações são usadas onde múltiplas operações precisam ser atômicas?

## 4. Conexão e pool
- O pool do PostgreSQL tem limites configurados?
- `ssl: { rejectUnauthorized: false }` — necessário no Railway, mas documente isso
- O cliente do pool é liberado no `finally` após uso?

## 5. Dados sensíveis
- Senhas nunca são armazenadas em plain text?
- Há dados de pacientes que precisam de criptografia adicional (LGPD)?

Reporte cada problema com sugestão de melhoria.
