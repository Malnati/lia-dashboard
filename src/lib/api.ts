import { apiBaseUrl } from './env';

export type AccessProfile = {
  id: string;
  tenantId: string;
  name: string;
  role: string;
  permissions: string[];
  isSystem: boolean;
};

export type AppUser = {
  id: string;
  tenantId: string;
  authUserId: string;
  accessProfileId?: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
};

export type AccessProfileInput = {
  name: string;
  role: string;
  permissions: string[];
  isSystem?: boolean;
};

export type AppUserInput = {
  email: string;
  password?: string;
  fullName: string;
  phone?: string;
  role: string;
  accessProfileId?: string | null;
  isActive?: boolean;
};

export type AdminData = {
  users: AppUser[];
  profiles: AccessProfile[];
};

export async function loadAdminData(accessToken: string): Promise<AdminData> {
  const [users, profiles] = await Promise.all([
    apiRequest<AppUser[]>('/api/users', accessToken),
    apiRequest<AccessProfile[]>('/api/access-profiles', accessToken)
  ]);
  return { users, profiles };
}

export async function createAccessProfile(accessToken: string, input: AccessProfileInput): Promise<AccessProfile> {
  return apiRequest<AccessProfile>('/api/access-profiles', accessToken, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function updateAccessProfile(accessToken: string, id: string, input: Partial<AccessProfileInput>): Promise<AccessProfile> {
  return apiRequest<AccessProfile>(`/api/access-profiles/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(input)
  });
}

export async function createUser(accessToken: string, input: AppUserInput): Promise<AppUser> {
  return apiRequest<AppUser>('/api/users', accessToken, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function updateUser(accessToken: string, id: string, input: Partial<AppUserInput>): Promise<AppUser> {
  return apiRequest<AppUser>(`/api/users/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(input)
  });
}

async function apiRequest<T>(path: string, accessToken: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${accessToken}`,
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers
    }
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'error' in payload
      ? (payload as { error?: { message?: string } }).error?.message
      : undefined;
    throw new Error(message || `API returned ${response.status}`);
  }

  return payload as T;
}
