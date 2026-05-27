# lia-dashboard

Administrativo para consultórios, clínicas e bureau, incluindo CRUD usuários/perfis.

## URL pública alvo

https://dashboard.aneety.com/

## Arquitetura alvo

- Cloudflare Pages Free para assets estáticos.
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

Scaffold inicial separado. Implementação funcional virá após estabilização do `REQ.md`, `lia-core` e `lia-backend` em Cloudflare Workers/Supabase.

## Deploy Cloudflare Pages Free

```bash
pnpm lint
pnpm test
pnpm build
pnpm deploy:cloudflare
```

Projeto Cloudflare Pages esperado: `lia-dashboard`.
