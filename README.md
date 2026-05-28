# lia-dashboard

Administrativo para consultórios, clínicas e bureau, incluindo CRUD usuários/perfis.

## URL pública alvo

https://dashboard.aneety.com/

## Arquitetura alvo

- Cloudflare Pages Free para assets estáticos gerados por Vite em `dist`.
- Supabase Auth para login.
- API Cloudflare Workers + Hono via `VITE_API_URL=https://api.aneety.com`.
- Contratos compartilhados por `lia-core` em <https://core.aneety.com/>.
- Base real Supabase/Postgres; não usar mock como destino final.
- Custo zero: sem Pages Functions pagas, Workers Paid, Containers ou add-ons.

## Fluxo principal

- Login Supabase Auth.
- CRUD de usuários e perfis de acesso.
- Associação usuário, perfil e tenant.
- Configuração white-label e métricas por tenant.

## Status

Scaffold React/Vite com baseline shadcn/ui inicial. Fluxos funcionais serão ampliados após estabilização de Auth, API e massa de teste Supabase.

## Deploy Cloudflare Pages Free

```bash
pnpm lint
pnpm test
pnpm build
pnpm deploy:cloudflare
```

Projeto Cloudflare Pages esperado: `lia-dashboard`, com deploy do diretório `dist`.

## Design system

- React + Vite + TypeScript + Tailwind + shadcn/ui.
- `components.json` versionado no repo.
- Componentes copiados para `src/components/ui` via `pnpm dlx shadcn@latest add`.
- Aliases `@/*`, `@/components`, `@/components/ui`, `@/lib` configurados para o app.
