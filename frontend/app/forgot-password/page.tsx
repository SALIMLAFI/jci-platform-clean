'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/apiClient';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, ShieldCheck, LayoutDashboard } from 'lucide-react';
import { AuthPageShell } from '@/components/auth-page-shell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recaptchaToken) {
      setError('Veuillez compléter le reCAPTCHA');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetchApi('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email, recaptchaToken }),
      });
      if (response?.resetUrl) {
        setResetUrl(response.resetUrl);
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi de l\'email');
    } finally {
      setLoading(false);
    }
  };

  const handleRecaptcha = (token: string) => {
    setRecaptchaToken(token);
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    (window as any).handleRecaptcha = handleRecaptcha;

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <AuthPageShell
      badge="JCI Ben Guerdane"
      subtitle="Accès au compte"
      title="Recevoir un lien sécurisé"
      description="JCI Ledger envoie un lien personnalisé pour réinitialiser un mot de passe local ou créer l’accès local d’un compte lié à Google."
      highlights={[
        {
          icon: <LayoutDashboard className="h-5 w-5" />,
          title: 'Parcours unifié',
          description: 'Le même espace permet de retrouver l’accès local ou de compléter un compte Google.',
          accentClass: 'from-brand-primary to-brand-primary-light',
        },
        {
          icon: <ShieldCheck className="h-5 w-5" />,
          title: 'Lien temporaire',
          description: 'Le lien reçu est limité dans le temps et protège l’ouverture de session.',
          accentClass: 'from-brand-teal to-brand-teal-dark',
        },
      ]}
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-primary transition-colors hover:text-brand-primary-light"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <div className="h-2 w-2 rounded-full bg-brand-gold" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-6"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-primary">Accès au compte</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Saisissez votre adresse email</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Nous vous enverrons un lien sécurisé pour définir un nouveau mot de passe local ou compléter un compte Google.
        </p>
      </motion.div>

      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Adresse email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                placeholder="votre.email@jci.tn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-2xl border border-border bg-background pl-12 pr-4 py-4 text-foreground placeholder:text-muted-foreground outline-none transition-all duration-300 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex justify-center">
            <div
              className="g-recaptcha"
              data-sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
              data-callback="handleRecaptcha"
            ></div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-teal px-4 py-4 font-semibold text-white shadow-lg shadow-brand-primary/20 transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                />
                Préparation du lien...
              </>
            ) : (
              'Recevoir le lien sécurisé'
            )}
          </button>
        </form>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 text-center"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-teal/15 text-brand-teal">
            <Mail className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Lien envoyé</h3>
          <p className="text-sm leading-6 text-muted-foreground">
            Vérifiez votre boîte de réception. Si votre compte est lié à Google, le lien ouvre la page de création de mot de passe local.
          </p>
          {resetUrl && (
            <div className="rounded-2xl border border-border bg-muted/40 p-4 text-left text-xs text-muted-foreground break-all">
              <p className="mb-2 font-semibold text-foreground">Mode développement</p>
              <p className="mb-2">Le lien de réinitialisation n’a pas pu être délivré par email. Utilisez ce lien pour tester localement :</p>
              <a href={resetUrl} className="text-brand-primary underline" target="_blank" rel="noreferrer">
                {resetUrl}
              </a>
            </div>
          )}
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-teal px-4 py-3 font-semibold text-white transition-all duration-300 hover:brightness-110"
          >
            Retour à l’authentification
          </button>
        </motion.div>
      )}
    </AuthPageShell>
  );
}
