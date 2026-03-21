# 1. Criar o projeto (responda: TypeScript=yes, Tailwind=yes, App Router=yes)
npx create-next-app@latest anamnese-web

cd anamnese-web

# 2. Criar o .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local

# 3. Criar as pastas da estrutura
mkdir -p src/app/\(auth\)/login
mkdir -p src/app/\(auth\)/cadastro
mkdir -p src/app/\(dashboard\)/pacientes
mkdir -p src/app/\(dashboard\)/fichas
mkdir -p src/components
mkdir -p src/lib

# 4. Rodar em desenvolvimento (com a API Node.js já rodando em paralelo)
npm run dev
# Acesse: http://localhost:3000
