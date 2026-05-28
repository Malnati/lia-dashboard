#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const required = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'LIA_E2E_ADMIN_EMAIL',
  'LIA_E2E_ADMIN_PASSWORD',
  'LIA_E2E_LIMITED_EMAIL',
  'LIA_E2E_LIMITED_PASSWORD'
];

for (const name of required) {
  if (!process.env[name]?.trim()) {
    console.error(`Missing required env var ${name}`);
    process.exit(1);
  }
}

const supabaseUrl = normalizeUrl(process.env.SUPABASE_URL ?? process.env.SUPABASE_PROJECT_URL ?? process.env.VITE_SUPABASE_URL ?? '');
if (!supabaseUrl) {
  console.error('Missing required env var SUPABASE_URL or SUPABASE_PROJECT_URL');
  process.exit(1);
}

const tenantSlug = process.env.LIA_E2E_TENANT_SLUG?.trim() || 'lia-e2e';
const adminProfileName = 'E2E Admin';
const limitedProfileName = 'E2E Leitura sem usuários';

const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const adminUser = await ensureAuthUser({
  email: process.env.LIA_E2E_ADMIN_EMAIL,
  password: process.env.LIA_E2E_ADMIN_PASSWORD,
  role: 'platform_admin'
});

const limitedUser = await ensureAuthUser({
  email: process.env.LIA_E2E_LIMITED_EMAIL,
  password: process.env.LIA_E2E_LIMITED_PASSWORD,
  role: 'clinic_admin'
});

const tenant = await upsertOne('tenants', {
  slug: tenantSlug,
  name: 'Lia E2E',
  brand_name: 'Lia E2E',
  colors: { primary: '#111827', accent: '#2563eb' },
  settings: { managed_by: 'codex_e2e_seed' }
}, 'slug');

const adminProfile = await upsertOne('access_profiles', {
  tenant_id: tenant.id,
  name: adminProfileName,
  role: 'platform_admin',
  permissions: [
    'dashboard:read',
    'users:read',
    'users:write',
    'profiles:read',
    'profiles:write',
    'tenants:read'
  ],
  is_system: true
}, 'tenant_id,name');

const limitedProfile = await upsertOne('access_profiles', {
  tenant_id: tenant.id,
  name: limitedProfileName,
  role: 'clinic_admin',
  permissions: ['dashboard:read', 'profiles:read'],
  is_system: false
}, 'tenant_id,name');

await upsertOne('app_users', {
  tenant_id: tenant.id,
  auth_user_id: adminUser.id,
  access_profile_id: adminProfile.id,
  full_name: 'Lia E2E Admin',
  email: process.env.LIA_E2E_ADMIN_EMAIL,
  phone: null,
  role: 'platform_admin',
  is_active: true
}, 'tenant_id,auth_user_id');

await upsertOne('app_users', {
  tenant_id: tenant.id,
  auth_user_id: limitedUser.id,
  access_profile_id: limitedProfile.id,
  full_name: 'Lia E2E Limited',
  email: process.env.LIA_E2E_LIMITED_EMAIL,
  phone: null,
  role: 'clinic_admin',
  is_active: true
}, 'tenant_id,auth_user_id');

console.log('Seed E2E aplicado: tenant=ok admin=ok limited=ok');

async function ensureAuthUser({ email, password, role }) {
  const existing = await findAuthUserByEmail(email);
  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      email,
      password,
      email_confirm: true,
      user_metadata: { lia_e2e: true, role }
    });
    if (error || !data.user) throw new Error(error?.message ?? 'Supabase Auth user not updated');
    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { lia_e2e: true, role }
  });
  if (error || !data.user) throw new Error(error?.message ?? 'Supabase Auth user not created');
  return data.user;
}

async function findAuthUserByEmail(email) {
  const target = email.toLowerCase();
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message);
    const users = data.users ?? [];
    const match = users.find((user) => user.email?.toLowerCase() === target);
    if (match) return match;
    if (users.length < 1000) return null;
  }
  throw new Error('Supabase Auth user lookup reached page limit');
}

async function upsertOne(table, row, onConflict) {
  const { data, error } = await supabase
    .from(table)
    .upsert(row, { onConflict })
    .select('*')
    .single();

  if (error) throw new Error(`${table}: ${error.message}`);
  return data;
}

function normalizeUrl(value) {
  return value.trim().replace(/\/$/, '');
}
