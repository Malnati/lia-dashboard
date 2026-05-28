import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const apiBaseUrl = normalizeUrl(process.env.VITE_API_URL ?? 'https://api.aneety.com');
const supabaseUrl = normalizeUrl(process.env.VITE_SUPABASE_URL ?? 'https://mqxwdyhtsvzzehmdfhtj.supabase.co');
const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '';

test.describe('dashboard publicado com Supabase/Postgres real', () => {
  test.beforeEach(() => {
    requireE2EEnv();
  });

  test('login admin mostra CRUD real e cria/atualiza perfil e usuário via API publicada', async ({ page, request }) => {
    const adminToken = await signIn(process.env.LIA_E2E_ADMIN_EMAIL!, process.env.LIA_E2E_ADMIN_PASSWORD!);
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const profileResponse = await request.post(`${apiBaseUrl}/api/access-profiles`, {
      headers: bearerHeaders(adminToken),
      data: {
        name: `E2E Perfil ${suffix}`,
        role: 'clinic_admin',
        permissions: ['dashboard:read', 'users:read', 'profiles:read'],
        isSystem: false
      }
    });
    expect(profileResponse.status()).toBe(201);
    const profile = await profileResponse.json() as { id: string; name: string };

    const profilePatch = await request.patch(`${apiBaseUrl}/api/access-profiles/${profile.id}`, {
      headers: bearerHeaders(adminToken),
      data: { name: `E2E Perfil editado ${suffix}` }
    });
    expect(profilePatch.status()).toBe(200);

    const userResponse = await request.post(`${apiBaseUrl}/api/users`, {
      headers: bearerHeaders(adminToken),
      data: {
        email: `lia-e2e-created-${suffix}@example.com`,
        password: `Lia-e2e-${suffix}-A1!`,
        fullName: `Lia E2E Criado ${suffix}`,
        role: 'clinic_admin',
        accessProfileId: profile.id,
        isActive: true
      }
    });
    expect(userResponse.status()).toBe(201);
    const user = await userResponse.json() as { id: string };

    const userPatch = await request.patch(`${apiBaseUrl}/api/users/${user.id}`, {
      headers: bearerHeaders(adminToken),
      data: { fullName: `Lia E2E Atualizado ${suffix}` }
    });
    expect(userPatch.status()).toBe(200);

    await page.goto('/');
    await page.getByLabel('E-mail').fill(process.env.LIA_E2E_ADMIN_EMAIL!);
    await page.getByLabel('Senha').fill(process.env.LIA_E2E_ADMIN_PASSWORD!);
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByText('CRUD de usuários')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Perfis de acesso' })).toBeVisible();
    await expect(page.getByText(`Lia E2E Atualizado ${suffix}`)).toBeVisible();
    await page.getByRole('tab', { name: 'Perfis de acesso' }).click();
    await expect(page.getByText('CRUD de perfis de acesso')).toBeVisible();
    await expect(page.getByText(`E2E Perfil editado ${suffix}`)).toBeVisible();
  });

  test('API publicada retorna 401 sem token e 403 para usuário sem users:read', async ({ request }) => {
    const unauthenticated = await request.get(`${apiBaseUrl}/api/users`);
    expect(unauthenticated.status()).toBe(401);

    const limitedToken = await signIn(process.env.LIA_E2E_LIMITED_EMAIL!, process.env.LIA_E2E_LIMITED_PASSWORD!);
    const forbidden = await request.get(`${apiBaseUrl}/api/users`, {
      headers: bearerHeaders(limitedToken)
    });
    expect(forbidden.status()).toBe(403);
    const payload = await forbidden.json() as { error?: { message?: string } };
    expect(payload.error?.message).toContain('Missing permission users:read');
  });
});

function requireE2EEnv() {
  const missing = [
    ['VITE_SUPABASE_PUBLISHABLE_KEY', supabasePublishableKey],
    ['LIA_E2E_ADMIN_EMAIL', process.env.LIA_E2E_ADMIN_EMAIL],
    ['LIA_E2E_ADMIN_PASSWORD', process.env.LIA_E2E_ADMIN_PASSWORD],
    ['LIA_E2E_LIMITED_EMAIL', process.env.LIA_E2E_LIMITED_EMAIL],
    ['LIA_E2E_LIMITED_PASSWORD', process.env.LIA_E2E_LIMITED_PASSWORD]
  ].filter(([, value]) => !value);

  test.skip(missing.length > 0, `E2E publicado sem secrets: ${missing.map(([name]) => name).join(', ')}`);
}

async function signIn(email: string, password: string): Promise<string> {
  const supabase = createClient(supabaseUrl, supabasePublishableKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  expect(error, 'Supabase Auth deve aceitar a massa E2E').toBeNull();
  expect(data.session?.access_token, 'sessão E2E deve ter access token').toBeTruthy();
  return data.session!.access_token;
}

function bearerHeaders(token: string) {
  return {
    accept: 'application/json',
    authorization: `Bearer ${token}`,
    'content-type': 'application/json'
  };
}

function normalizeUrl(value: string): string {
  return value.trim().replace(/\/$/, '');
}
