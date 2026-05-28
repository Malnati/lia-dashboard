# lia-dashboard

> **Status histórico:** este repositório preserva dashboard histórico do MVP Lia como fonte de aprendizado, evidência e referência. A nova plataforma nasce na organização [Aneety](https://github.com/Aneety), com documentação canônica em [Aneety/.github/docs](https://github.com/Aneety/.github/tree/main/docs) e orquestrador limpo em [Aneety/ai](https://github.com/Aneety/ai). Não use este repositório como contrato futuro de implementação.

Administrativo para consultórios, clínicas e bureau, incluindo CRUD usuários/perfis.

## URL pública alvo

https://dashboard.aneety.com/

## Arquitetura alvo

- Cloudflare Pages Free para assets estáticos gerados por Vite em `dist`.
- Autenticação modelada no banco de dados via API Lia, sem depender de provedor externo no frontend.
- API Cloudflare Workers + Hono via `VITE_API_URL=https://api.aneety.com`.
- Contratos compartilhados por `lia-core` em <https://core.aneety.com/>.
- Base real Supabase/Postgres; não usar mock como destino final.
- Custo zero: sem Pages Functions pagas, Workers Paid, Containers ou add-ons.


## Limites semânticos de serviços externos

O dashboard administra usuários/perfis/tenants pelo modelo de dados Lia. Qualquer serviço externo usado para hospedagem, API, banco, storage, CI, observabilidade ou pagamento deve declarar função, dados, secrets, custo, owner e plano de saída; provedor externo de identidade não é requisito de login.

## Fluxo principal

- Login via API Lia com identidades, credenciais e sessões/tokens persistidos no banco.
- CRUD de usuários e perfis de acesso via `https://api.aneety.com/api/users` e `/api/access-profiles`.
- Associação usuário, perfil e tenant retornada pelo Worker conforme sessão/token Lia.
- Status ativo/inativo de usuário e permissões do perfil editáveis pela API real.
- Configuração white-label e métricas por tenant seguem como próxima etapa.

## Status

Dashboard React/Vite com shadcn/ui e integração alvo com autenticação modelada no banco + Worker/Hono. A tela não usa dados mock; quando não há sessão ou permissão, mostra erro real da API (`401`/`403`).

## Screenshot

![Lia Dashboard com login via modelo de banco e CRUD users/profiles via Worker](docs/screenshots/lia-dashboard.png)

## Deploy Cloudflare Pages Free

```bash
pnpm lint
pnpm test
pnpm build
pnpm deploy:cloudflare
```

Projeto Cloudflare Pages esperado: `lia-dashboard`, com deploy do diretório `dist`.

Variáveis públicas de build esperadas no GitHub/Cloudflare Pages:

- `VITE_API_URL=https://api.aneety.com`
- Nenhuma variável `VITE_SUPABASE_*` deve ser requisito de login; autenticação passa por `VITE_API_URL` e `/api/auth/*`.

Não configurar `SUPABASE_SERVICE_ROLE_KEY` em frontend/Pages; ela permanece somente no Worker `lia-backend` e em scripts locais de seed E2E.

## E2E publicado

O E2E do dashboard roda contra `https://dashboard.aneety.com/` e `https://api.aneety.com`; nunca localhost. Ele deve cobrir login via modelo de banco, CRUD real de perfis/usuários pelo Worker e respostas `401`/`403`.

O seed E2E também prepara o perfil `E2E Admin` para a cobertura publicada da API em `lia-backend`, incluindo permissões de pedidos, checkpoints, anexos e pagamentos. O perfil limitado continua sem `users:read` e sem `orders:read` para validar `403`.

Scripts:

```bash
pnpm seed:e2e
pnpm test:e2e
```

Variáveis necessárias para seed/teste local e GitHub Actions:

- `SUPABASE_PROJECT_URL` somente para scripts backend/seed quando necessário
- `SUPABASE_SERVICE_ROLE_KEY` somente para `pnpm seed:e2e`; nunca no build/Pages
- login frontend deve usar API Lia e modelo de banco, não chaves públicas de provedor externo
- `LIA_E2E_ADMIN_EMAIL`
- `LIA_E2E_ADMIN_PASSWORD`
- `LIA_E2E_LIMITED_EMAIL`
- `LIA_E2E_LIMITED_PASSWORD`

No GitHub, os quatro `LIA_E2E_*` ficam em secrets do repositório. O E2E publicado legado que ainda depende de autenticação por provedor externo só roda quando `LIA_E2E_ALLOW_LEGACY_PROVIDER_AUTH=1` estiver definido em variables. Enquanto a API `/api/auth/*` modelada no banco não existir, esse E2E legado fica bloqueado por contrato e deve ser substituído, não tratado como aceite.

## Design system

- React + Vite + TypeScript + Tailwind + shadcn/ui.
- `components.json` versionado no repo.
- Componentes copiados para `src/components/ui` via `pnpm dlx shadcn@latest add`.
- Aliases `@/*`, `@/components`, `@/components/ui`, `@/lib` configurados para o app.
