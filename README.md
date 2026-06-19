# Finanças Familiares

Sistema web para controle financeiro de uma família: cadastro de receitas e despesas segregadas por membro, contas a pagar, categorias e formas de pagamento configuráveis, dashboard com gráficos e relatórios.

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- [Prisma 7](https://www.prisma.io) + SQLite
- [NextAuth (Auth.js v5)](https://authjs.dev) — login por membro
- Tailwind CSS + [shadcn/ui](https://ui.shadcn.com)
- [Recharts](https://recharts.org)

## Como executar

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

Login de teste criado pelo seed:

- Email: `admin@familia.com`
- Senha: `familia123`

## Funcionalidades

- Login por membro da família, com dados financeiros compartilhados
- Lançamento de despesas e receitas, com categoria, forma de pagamento e classificação (investimento/manutenção)
- Contas a pagar com recorrência e baixa de pagamento
- Cadastro de membros, categorias e formas de pagamento (CRUD completo, com exclusão auditada)
- Dashboard com totais, gráficos por categoria e por mês, filtrável por membro e período
- Relatórios com filtros avançados e exportação em CSV
