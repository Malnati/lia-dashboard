import { Activity, Database, ShieldCheck } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const links = [
  { label: 'Portal', href: 'https://aneety.com/' },
  { label: 'API health', href: 'https://api.aneety.com/api/health' },
  { label: 'Core', href: 'https://core.aneety.com/' }
];

export function App() {
  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-3">
            <Badge className="w-fit" variant="secondary">Administração e perfis</Badge>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">Lia Dashboard</h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">Administrativo para consultórios, clínicas e bureau, incluindo CRUD usuários/perfis.</p>
            </div>
          </div>
          <Button asChild>
            <a href="https://dashboard.aneety.com/">Abrir URL pública</a>
          </Button>
        </div>

        <Alert>
          <ShieldCheck />
          <AlertTitle>Arquitetura vigente</AlertTitle>
          <AlertDescription>Cloudflare Pages Free + Supabase Auth + API real Worker/Hono + Supabase/Postgres. Sem backend local de navegador como aceite.</AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Activity className="size-4" />CRUD usuários/perfis</CardTitle>
              <CardDescription>Sidebar via shadcn/ui + Tailwind.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Database className="size-4" />Associação usuário, perfil e tenant</CardTitle>
              <CardDescription>Table via shadcn/ui + Tailwind.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="size-4" />White-label e métricas</CardTitle>
              <CardDescription>Form/Field via shadcn/ui + Tailwind.</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Baseline shadcn/ui</CardTitle>
            <CardDescription>Este repo versiona components.json, aliases @/* e componentes shadcn em src/components/ui.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="outline">Sidebar</Badge>
            <Badge variant="outline">Table</Badge>
            <Badge variant="outline">Form/Field</Badge>
            <Badge variant="outline">Dialog/Sheet</Badge>
            <Badge variant="outline">Tabs</Badge>
            <Badge variant="outline">Badge</Badge>
            <Badge variant="outline">DropdownMenu</Badge>
            <Badge variant="outline">sonner</Badge>
          </CardContent>
        </Card>

        <nav className="flex flex-wrap gap-3">
          {links.map((link) => (
            <Button key={link.href} asChild variant="outline">
              <a href={link.href}>{link.label}</a>
            </Button>
          ))}
        </nav>
      </section>
    </main>
  );
}
