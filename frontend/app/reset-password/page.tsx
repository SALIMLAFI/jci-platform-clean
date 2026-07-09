import { Suspense } from 'react';
import { ResetPasswordClient } from './ResetPasswordClient';
import { AuthPageShell } from '@/components/auth-page-shell';
import { LayoutDashboard, ShieldCheck, Loader2 } from 'lucide-react';

// Force dynamic rendering to prevent prerendering errors
export const dynamic = 'force-dynamic';

function LoadingState() {
  return (
    <AuthPageShell
      badge="Sécurité"
      subtitle="Réinitialisation"
      title="Définissez un nouveau mot de passe"
      description="La page de réinitialisation reprend la même identité visuelle que le dashboard et le reste du parcours d'authentification."
      highlights={[
        {
          icon: <LayoutDashboard className="h-5 w-5" />,
          title: 'Charte unifiée',
          description: 'Même palette et mêmes cartes que le tableau de bord principal.',
          accentClass: 'from-brand-primary to-brand-primary-light',
        },
        {
          icon: <ShieldCheck className="h-5 w-5" />,
          title: 'Mot de passe protégé',
          description: 'Validation du lien et du nouveau mot de passe avant mise à jour.',
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ResetPasswordClient />
    </Suspense>
  );
}
