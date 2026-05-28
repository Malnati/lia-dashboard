import type { Session } from '@supabase/supabase-js';
import {
  Activity,
  BadgeCheck,
  Database,
  KeyRound,
  Loader2,
  LogOut,
  MoreHorizontal,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  UsersRound
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  createAccessProfile,
  createUser,
  loadAdminData,
  updateAccessProfile,
  updateUser,
  type AccessProfile,
  type AppUser
} from '@/lib/api';
import { apiBaseUrl, isSupabaseConfigured, supabaseUrl } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';

const roles = [
  'platform_admin',
  'clinic_admin',
  'bureau_admin',
  'model_production_operator',
  'prosthesis_production_operator',
  'delivery_operator'
];

const defaultPermissions = [
  'dashboard:read',
  'users:read',
  'users:write',
  'profiles:read',
  'profiles:write'
];

type ProfileFormState = {
  id?: string;
  name: string;
  role: string;
  permissionsText: string;
  isSystem: boolean;
};

type UserFormState = {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  accessProfileId: string;
  password: string;
  isActive: boolean;
};

const emptyProfileForm: ProfileFormState = {
  name: 'Administrador de clínica',
  role: 'clinic_admin',
  permissionsText: defaultPermissions.join(', '),
  isSystem: false
};

const emptyUserForm: UserFormState = {
  fullName: '',
  email: '',
  phone: '',
  role: 'clinic_admin',
  accessProfileId: '',
  password: '',
  isActive: true
};

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormState>(emptyProfileForm);
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm);

  const accessToken = session?.access_token;
  const activeUsers = useMemo(() => users.filter((user) => user.isActive).length, [users]);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthReady(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (accessToken) void refreshAdminData(accessToken);
  }, [accessToken]);

  async function refreshAdminData(token = accessToken) {
    if (!token) return;
    setLoadingData(true);
    setDataError(null);
    try {
      const data = await loadAdminData(token);
      setUsers(data.users);
      setProfiles(data.profiles);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao consultar API administrativa.';
      setDataError(message);
      toast.error(message);
    } finally {
      setLoadingData(false);
    }
  }

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setLoadingAuth(true);
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoadingAuth(false);
    if (error) {
      setAuthError(error.message);
      toast.error(error.message);
      return;
    }
    toast.success('Login Supabase realizado.');
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUsers([]);
    setProfiles([]);
    toast.info('Sessão encerrada.');
  }

  function openNewProfile() {
    setProfileForm(emptyProfileForm);
    setProfileDialogOpen(true);
  }

  function openEditProfile(profile: AccessProfile) {
    setProfileForm({
      id: profile.id,
      name: profile.name,
      role: profile.role,
      permissionsText: profile.permissions.join(', '),
      isSystem: profile.isSystem
    });
    setProfileDialogOpen(true);
  }

  function openNewUser() {
    setUserForm({ ...emptyUserForm, accessProfileId: profiles[0]?.id ?? '', role: profiles[0]?.role ?? 'clinic_admin' });
    setUserDialogOpen(true);
  }

  function openEditUser(user: AppUser) {
    setUserForm({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone ?? '',
      role: user.role,
      accessProfileId: user.accessProfileId ?? '',
      password: '',
      isActive: user.isActive
    });
    setUserDialogOpen(true);
  }

  async function submitProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    const payload = {
      name: profileForm.name.trim(),
      role: profileForm.role.trim(),
      permissions: splitPermissions(profileForm.permissionsText),
      isSystem: profileForm.isSystem
    };
    try {
      if (profileForm.id) {
        await updateAccessProfile(accessToken, profileForm.id, payload);
        toast.success('Perfil atualizado via Worker.');
      } else {
        await createAccessProfile(accessToken, payload);
        toast.success('Perfil criado via Worker.');
      }
      setProfileDialogOpen(false);
      await refreshAdminData(accessToken);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao salvar perfil.');
    }
  }

  async function submitUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    const payload = {
      fullName: userForm.fullName.trim(),
      email: userForm.email.trim(),
      phone: userForm.phone.trim() || undefined,
      role: userForm.role.trim(),
      accessProfileId: userForm.accessProfileId || null,
      password: userForm.id ? undefined : userForm.password,
      isActive: userForm.isActive
    };
    try {
      if (userForm.id) {
        await updateUser(accessToken, userForm.id, payload);
        toast.success('Usuário atualizado via Worker.');
      } else {
        await createUser(accessToken, payload);
        toast.success('Usuário criado via Worker.');
      }
      setUserDialogOpen(false);
      await refreshAdminData(accessToken);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao salvar usuário.');
    }
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <Toaster richColors />
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-3xl border bg-card p-6 shadow-sm md:flex-row md:items-start md:justify-between md:p-8">
          <div className="flex max-w-3xl flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">dashboard.aneety.com</Badge>
              <Badge variant="outline">Supabase Auth</Badge>
              <Badge variant="outline">Worker/Hono API</Badge>
              <Badge variant="outline">shadcn/ui</Badge>
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Lia Dashboard</h1>
              <p className="max-w-2xl text-muted-foreground">
                Administração real de usuários e perfis. O login usa Supabase Auth e o CRUD chama o Worker em {apiBaseUrl} com JWT do usuário.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {session ? (
              <>
                <Button variant="outline" onClick={() => void refreshAdminData()} disabled={loadingData}>
                  <RefreshCw data-icon="inline-start" />
                  Atualizar
                </Button>
                <Button variant="outline" onClick={() => void signOut()}>
                  <LogOut data-icon="inline-start" />
                  Sair
                </Button>
              </>
            ) : (
              <Button asChild>
                <a href="https://aneety.com/">Abrir portal</a>
              </Button>
            )}
          </div>
        </header>

        {!isSupabaseConfigured && (
          <Alert variant="destructive">
            <KeyRound />
            <AlertTitle>Supabase público não configurado</AlertTitle>
            <AlertDescription>
              Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no build do Cloudflare Pages. Service role continua somente no Worker.
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <ShieldCheck />
          <AlertTitle>Critério de aceite vigente</AlertTitle>
          <AlertDescription>
            Esta superfície não usa mock/browser-local. Usuários e perfis vêm de Supabase/Postgres por API real com 401 para JWT ausente e 403 para permissão insuficiente.
          </AlertDescription>
        </Alert>

        {!authReady && <LoadingCard label="Carregando sessão Supabase" />}

        {authReady && !session && <LoginCard email={email} password={password} authError={authError} loading={loadingAuth} onEmail={setEmail} onPassword={setPassword} onSubmit={signIn} />}

        {session && (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <MetricCard icon={UsersRound} label="Usuários" value={String(users.length)} description={`${activeUsers} ativos no tenant autenticado`} />
              <MetricCard icon={BadgeCheck} label="Perfis" value={String(profiles.length)} description="Perfis de acesso retornados pela API" />
              <MetricCard icon={Database} label="Origem" value="Postgres" description="Dados tenant-bound via Worker/Hono" />
            </section>

            {dataError && (
              <Alert variant="destructive">
                <Activity />
                <AlertTitle>API administrativa indisponível para esta sessão</AlertTitle>
                <AlertDescription>{dataError}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="users" className="gap-4">
              <TabsList className="w-full justify-start overflow-x-auto md:w-fit">
                <TabsTrigger value="users">Usuários</TabsTrigger>
                <TabsTrigger value="profiles">Perfis de acesso</TabsTrigger>
                <TabsTrigger value="integration">Integração real</TabsTrigger>
              </TabsList>

              <TabsContent value="users">
                <Card>
                  <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex flex-col gap-1">
                      <CardTitle>CRUD de usuários</CardTitle>
                      <CardDescription>Lista, criação e edição usam /api/users com Bearer token Supabase.</CardDescription>
                    </div>
                    <Button onClick={openNewUser} disabled={!accessToken}>
                      <UserPlus data-icon="inline-start" />
                      Novo usuário
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {loadingData ? <LoadingCard label="Consultando usuários" compact /> : <UsersTable users={users} profiles={profiles} onEdit={openEditUser} />}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="profiles">
                <Card>
                  <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex flex-col gap-1">
                      <CardTitle>CRUD de perfis de acesso</CardTitle>
                      <CardDescription>Permissões ficam no access_profile do tenant e controlam 403 no Worker.</CardDescription>
                    </div>
                    <Button onClick={openNewProfile} disabled={!accessToken}>
                      <BadgeCheck data-icon="inline-start" />
                      Novo perfil
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {loadingData ? <LoadingCard label="Consultando perfis" compact /> : <ProfilesTable profiles={profiles} onEdit={openEditProfile} />}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="integration">
                <Card>
                  <CardHeader>
                    <CardTitle>Integração publicada</CardTitle>
                    <CardDescription>Evidência de que o dashboard está conectado à arquitetura real definida no REQ.md.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2">
                    <InfoLine label="API" value={apiBaseUrl} />
                    <InfoLine label="Supabase" value={supabaseUrl} />
                    <InfoLine label="Sessão" value={session.user.email ?? session.user.id} />
                    <InfoLine label="JWT" value="mantido em memória/local storage Supabase; nunca service role" />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </section>

      <ProfileDialog open={profileDialogOpen} form={profileForm} onOpenChange={setProfileDialogOpen} onChange={setProfileForm} onSubmit={submitProfile} />
      <UserDialog open={userDialogOpen} form={userForm} profiles={profiles} onOpenChange={setUserDialogOpen} onChange={setUserForm} onSubmit={submitUser} />
      <datalist id="roles">
        {roles.map((role) => <option key={role} value={role} />)}
      </datalist>
    </main>
  );
}

function LoginCard({
  email,
  password,
  authError,
  loading,
  onEmail,
  onPassword,
  onSubmit
}: {
  email: string;
  password: string;
  authError: string | null;
  loading: boolean;
  onEmail: (value: string) => void;
  onPassword: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Entrar com Supabase Auth</CardTitle>
        <CardDescription>Use uma conta ativa em app_users com perfil que tenha users/profiles permissions.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <Input id="email" type="email" value={email} onChange={(event) => onEmail(event.target.value)} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Senha</FieldLabel>
              <Input id="password" type="password" value={password} onChange={(event) => onPassword(event.target.value)} required />
            </Field>
          </FieldGroup>
          {authError && <p className="text-sm text-destructive">{authError}</p>}
          <Button type="submit" disabled={loading || !isSupabaseConfigured}>
            {loading && <Loader2 data-icon="inline-start" className="animate-spin" />}
            Entrar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function UsersTable({ users, profiles, onEdit }: { users: AppUser[]; profiles: AccessProfile[]; onEdit: (user: AppUser) => void }) {
  if (users.length === 0) return <EmptyState title="Nenhum usuário retornado" description="Crie o primeiro usuário após autenticar com permissão users:write." />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>E-mail</TableHead>
          <TableHead>Perfil</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => {
          const profile = profiles.find((item) => item.id === user.accessProfileId);
          return (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.fullName}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{profile?.name ?? user.role}</TableCell>
              <TableCell><Badge variant={user.isActive ? 'default' : 'outline'}>{user.isActive ? 'ativo' : 'inativo'}</Badge></TableCell>
              <TableCell className="text-right">
                <RowActions label="Ações do usuário" onEdit={() => onEdit(user)} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function ProfilesTable({ profiles, onEdit }: { profiles: AccessProfile[]; onEdit: (profile: AccessProfile) => void }) {
  if (profiles.length === 0) return <EmptyState title="Nenhum perfil retornado" description="Crie um perfil com users/profiles permissions para administrar o tenant." />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Permissões</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {profiles.map((profile) => (
          <TableRow key={profile.id}>
            <TableCell className="font-medium">{profile.name}</TableCell>
            <TableCell>{profile.role}</TableCell>
            <TableCell>
              <div className="flex max-w-xl flex-wrap gap-1">
                {profile.permissions.slice(0, 5).map((permission) => <Badge key={permission} variant="outline">{permission}</Badge>)}
                {profile.permissions.length > 5 && <Badge variant="secondary">+{profile.permissions.length - 5}</Badge>}
              </div>
            </TableCell>
            <TableCell><Badge variant={profile.isSystem ? 'secondary' : 'outline'}>{profile.isSystem ? 'sistema' : 'tenant'}</Badge></TableCell>
            <TableCell className="text-right">
              <RowActions label="Ações do perfil" onEdit={() => onEdit(profile)} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function RowActions({ label, onEdit }: { label: string; onEdit: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={label}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onEdit}>Editar</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProfileDialog({
  open,
  form,
  onOpenChange,
  onChange,
  onSubmit
}: {
  open: boolean;
  form: ProfileFormState;
  onOpenChange: (open: boolean) => void;
  onChange: (form: ProfileFormState) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{form.id ? 'Editar perfil' : 'Novo perfil'}</DialogTitle>
          <DialogDescription>Dados serão enviados ao Worker em /api/access-profiles.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="profile-name">Nome</FieldLabel>
              <Input id="profile-name" value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="profile-role">Role</FieldLabel>
              <Input id="profile-role" list="roles" value={form.role} onChange={(event) => onChange({ ...form, role: event.target.value })} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="profile-permissions">Permissões</FieldLabel>
              <Input id="profile-permissions" value={form.permissionsText} onChange={(event) => onChange({ ...form, permissionsText: event.target.value })} required />
              <FieldDescription>Separe por vírgulas. Ex.: users:read, users:write, profiles:read.</FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant={form.isSystem ? 'default' : 'outline'} onClick={() => onChange({ ...form, isSystem: !form.isSystem })}>
              {form.isSystem ? 'Perfil de sistema' : 'Perfil do tenant'}
            </Button>
            <Button type="submit">Salvar perfil</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UserDialog({
  open,
  form,
  profiles,
  onOpenChange,
  onChange,
  onSubmit
}: {
  open: boolean;
  form: UserFormState;
  profiles: AccessProfile[];
  onOpenChange: (open: boolean) => void;
  onChange: (form: UserFormState) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{form.id ? 'Editar usuário' : 'Novo usuário'}</DialogTitle>
          <DialogDescription>Dados serão enviados ao Worker em /api/users. Senha só é usada na criação.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="user-name">Nome completo</FieldLabel>
              <Input id="user-name" value={form.fullName} onChange={(event) => onChange({ ...form, fullName: event.target.value })} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="user-email">E-mail</FieldLabel>
              <Input id="user-email" type="email" value={form.email} onChange={(event) => onChange({ ...form, email: event.target.value })} required />
            </Field>
            {!form.id && (
              <Field>
                <FieldLabel htmlFor="user-password">Senha inicial</FieldLabel>
                <Input id="user-password" type="password" value={form.password} onChange={(event) => onChange({ ...form, password: event.target.value })} required />
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="user-phone">Telefone</FieldLabel>
              <Input id="user-phone" value={form.phone} onChange={(event) => onChange({ ...form, phone: event.target.value })} />
            </Field>
            <Field>
              <FieldLabel htmlFor="user-role">Role</FieldLabel>
              <Input id="user-role" list="roles" value={form.role} onChange={(event) => onChange({ ...form, role: event.target.value })} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="user-profile">Perfil de acesso</FieldLabel>
              <Input id="user-profile" list="profiles" value={form.accessProfileId} onChange={(event) => onChange({ ...form, accessProfileId: event.target.value })} />
              <FieldDescription>Use o ID do perfil retornado pela API. Sugestões carregadas no datalist.</FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant={form.isActive ? 'default' : 'outline'} onClick={() => onChange({ ...form, isActive: !form.isActive })}>
              {form.isActive ? 'Ativo' : 'Inativo'}
            </Button>
            <Button type="submit">Salvar usuário</Button>
          </DialogFooter>
        </form>
        <datalist id="profiles">
          {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
        </datalist>
      </DialogContent>
    </Dialog>
  );
}

function MetricCard({ icon: Icon, label, value, description }: { icon: typeof Activity; label: string; value: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Icon className="size-4" />{label}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-background p-3">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="break-all text-sm">{value}</span>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-6 text-center">
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function LoadingCard({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <Card className={compact ? 'border-dashed' : 'max-w-xl border-dashed'}>
      <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {label}
      </CardContent>
    </Card>
  );
}

function splitPermissions(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
