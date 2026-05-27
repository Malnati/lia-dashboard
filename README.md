# lia-dashboard

Administrativo para consultórios, clínicas e bureau, incluindo CRUD usuários/perfis.

## Arquitetura alvo

- Supabase Auth para login.
- API NestJS real via `VITE_API_URL`.
- Contratos compartilhados por `lia-core`.
- Base real Supabase/Postgres; não usar mock como destino final.

## Status

Scaffold inicial criado para separar repositórios. Implementação funcional virá após estabilização do `REQ.md`, `lia-core` e `lia-backend` Supabase/Postgres.

## URL pública esperada

<https://malnati.github.io/lia-dashboard/>
