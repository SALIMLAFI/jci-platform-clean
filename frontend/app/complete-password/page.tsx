import { Suspense } from 'react';
import { CompletePasswordClient } from './CompletePasswordClient';
import { AuthPageShell } from '@/components/auth-page-shell';
import { CircleUserRound, ShieldCheck, Loader2 } from 'lucide-react';

// Force dynamic rendering to prevent prerendering errors
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

function LoadingState() {
  return (
    <AuthPageShell
      badge="Compte Google"
      subtitle="Création de mot de passe local"
      title="Ce compte est lié à Google"
      description="Définissez un mot de passe local pour compléter votre accès à JCI Ledger tout en conservant la connexion Google."
      highlights={[
        {
          icon: <CircleUserRound className="h-5 w-5" />,
          title: 'Connexion Google conservée',
          description: 'Votre compte reste relié à Google pour les accès rapides et sécurisés.',
          accentClass: 'from-brand-primary to-brand-primary-light',
        },
        {
          icon: <ShieldCheck className="h-5 w-5" />,
          title: 'Accès local activé',
          description: 'Ajoutez un mot de passe local pour accéder aussi avec email et mot de passe.',
          accentClass: 'from-brand-teal to-brand-teal-dark',
        },
      ]}
    >
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    </AuthPageShell>
  );
}

export default function CompletePasswordPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CompletePasswordClient />
    </Suspense>
  );
}