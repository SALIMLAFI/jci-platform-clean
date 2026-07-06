'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/apiClient';
import { motion } from 'framer-motion';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle,
  ShieldCheck,
  CircleUserRound,
  Loader2,
} from 'lucide-react';
import { AuthPageShell } from '@/components/auth-page-shell';

export function CompletePasswordClient() {
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

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
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
      setError(err.message || 'Erreur lors de la création du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  // Loading (SSR safe)
  if (!mounted) {
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
            description:
              'Votre compte reste relié à Google pour les accès rapides et sécurisés.',
            accentClass: 'from-brand-primary to-brand-primary-light',
          },
          {
            icon: <ShieldCheck className="h-5 w-5" />,
            title: 'Accès local activé',
            description:
              'Ajoutez un mot de passe local pour accéder aussi avec email et mot de passe.',
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
        badge="Compte Google"
        subtitle="Création de mot de passe local"
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
      badge="Compte Google"
      subtitle="Création de mot de passe local"
      title="Ce compte est lié à Google"
      description="Définissez un mot de passe local pour compléter votre accès à JCI Ledger tout en conservant la connexion Google."
      highlights={[
        {
          icon: <CircleUserRound className="h-5 w-5" />,
          title: 'Connexion Google conservée',
          description:
            'Votre compte reste relié à Google pour les accès rapides et sécurisés.',
          accentClass: 'from-brand-primary to-brand-primary-light',
        },
        {
          icon: <ShieldCheck className="h-5 w-5" />,
          title: 'Accès local activé',
          description:
            'Ajoutez un mot de passe local pour accéder aussi avec email et mot de passe.',
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
      </div>

      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nouveau mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border p-4 pl-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-2xl border p-4 pl-12"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-100 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-black p-4 text-white"
          >
            {loading ? 'Chargement...' : 'Créer le mot de passe'}
          </button>
        </form>
      ) : (
        <div className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <p className="mt-4">Mot de passe créé avec succès</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 rounded-2xl bg-black p-3 text-white"
          >
            Aller à la connexion
          </button>
        </div>
      )}
    </AuthPageShell>
  );
}