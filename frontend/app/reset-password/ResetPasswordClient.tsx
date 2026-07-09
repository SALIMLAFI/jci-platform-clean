'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/apiClient';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, LayoutDashboard, ShieldCheck, Loader2 } from 'lucide-react';
import { AuthPageShell } from '@/components/auth-page-shell';

export function ResetPasswordClient() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Mount safe (client only)
  useEffect(() => {
    setMounted(true);

    const params = new URLSearchParams(window.location.search);
    setToken(params.get('token'));
  }, []);

  // Redirect safe (no SSR crash)
  useEffect(() => {
    if (mounted && !token) {
      router.replace('/login');
    }
  }, [mounted, token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError('Token manquant');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await fetchApi('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  // Loading (SSR safe)
  if (!mounted) {
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

  // No token fallback (avoid SSR crash)
  if (!token) {
    return (
      <AuthPageShell
        badge="Sécurité"
        subtitle="Réinitialisation"
        title="Redirection..."
        description=""
        highlights={[]}
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      </AuthPageShell>
    );
  }

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
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-primary">Nouveau mot de passe</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Réinitialisez votre accès</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Choisissez un mot de passe fort pour sécuriser votre compte.
        </p>
      </motion.div>

      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nouveau mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-2xl border border-border bg-background pl-12 pr-12 py-4 text-foreground placeholder:text-muted-foreground outline-none transition-all duration-300 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-brand-primary"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Confirmer le mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                Réinitialisation...
              </>
            ) : (
              'Réinitialiser le mot de passe'
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
            <CheckCircle className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Mot de passe réinitialisé</h3>
          <p className="text-sm leading-6 text-muted-foreground">
            Votre mot de passe a été modifié avec succès.
          </p>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-teal px-4 py-3 font-semibold text-white transition-all duration-300 hover:brightness-110"
          >
            Se connecter
          </button>
        </motion.div>
      )}
    </AuthPageShell>
  );
}
