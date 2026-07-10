'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { fetchApi } from '@/lib/apiClient';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, ShieldCheck, Building2, Calendar, LayoutDashboard, Crown } from 'lucide-react';
import { AuthPageShell } from '@/components/auth-page-shell';

function getHomeRoute(role?: string) {
  if (role === 'member') return '/membres';
  return '/';
}

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('member');
  const [membershipDate, setMembershipDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const router = useRouter();

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // --- Contrôle de Saisie (Logique Métier) ---
    if (name.trim().length < 3) {
      setError('Le nom complet doit contenir au moins 3 caractères.');
      nameRef.current?.focus();
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('L\'adresse email saisie n\'est pas au bon format.');
      emailRef.current?.focus();
      return;
    }
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      setError('Le mot de passe doit faire au moins 8 caractères, inclure une majuscule, une minuscule, un chiffre et un caractère spécial.');
      passwordRef.current?.focus();
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      confirmPasswordRef.current?.focus();
      return;
    }
    if (!recaptchaToken) {
      setError('Veuillez compléter le reCAPTCHA');
      return;
    }
    // ------------------------------------------
    
    setLoading(true);

    try {
      const data = await fetchApi('/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'register', name, email, password, role, membershipDate, recaptchaToken }),
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      router.push(getHomeRoute(data.user?.role));
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleRecaptcha = (token: string) => {
    setRecaptchaToken(token);
    setError(''); // Clear error if recaptcha was the issue
  };

  const resetRecaptcha = () => {
    setRecaptchaToken('');
    if (window.grecaptcha) {
      window.grecaptcha.reset();
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signIn('google', { callbackUrl: '/' });
      if (result?.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion Google');
    }
  };

  useEffect(() => {
    // Load reCAPTCHA script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?hl=fr`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    // Make handleRecaptcha available globally
    (window as any).handleRecaptcha = handleRecaptcha;

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12,
      },
    },
  };

  const roles = [
    { value: 'member', label: 'Membre', icon: User, color: 'from-blue-500 to-blue-600' },
    { value: 'treasurer', label: 'Trésorier', icon: ShieldCheck, color: 'from-green-500 to-green-600' },
    { value: 'director', label: 'Directeur de projet', icon: Building2, color: 'from-orange-500 to-orange-600' },
    { value: 'admin', label: 'Administrateur', icon: Crown, color: 'from-violet-500 to-violet-600' },
  ];

  return (
    <AuthPageShell
      badge="JCI Ben Guerdane"
      subtitle="Ouverture de compte"
      title="Rejoindre JCI Ledger"
      description="Créez un accès sécurisé à la plateforme officielle de gestion financière de JCI Ben Guerdane pour contribuer à une gouvernance claire, structurée et traçable."
      highlights={[
        {
          icon: <LayoutDashboard className="h-5 w-5" />,
          title: 'Centralisation des contributions',
          description: 'Rassemblez les cotisations, les recettes et les justificatifs dans un cadre unique et organisé.',
          accentClass: 'from-brand-primary to-brand-primary-light',
        },
        {
          icon: <Crown className="h-5 w-5" />,
          title: 'Gestion par rôle',
          description: 'Attribuez les droits selon les profils Membre, Trésorier, Directeur de projet et Administrateur.',
          accentClass: 'from-brand-gold to-brand-gold-dark',
        },
        {
          icon: <ShieldCheck className="h-5 w-5" />,
          title: 'Traçabilité complète',
          description: 'Chaque compte participe à un circuit de validation transparent et sécurisé.',
          accentClass: 'from-brand-teal to-brand-teal-dark',
        },
      ]}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-8"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-primary">Accès institutionnel</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Créer votre accès JCI Ledger</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Inscrivez-vous pour intégrer un environnement dédié au suivi des cotisations, des dépenses, des pièces justificatives et des rapports financiers.
        </p>
      </motion.div>

      <form onSubmit={handleSignup} noValidate className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Nom complet</label>
          <div className="relative">
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'name' ? 'text-brand-primary' : 'text-muted-foreground'}`}>
              <User className="w-5 h-5" />
            </div>
            <input
              ref={nameRef}
              type="text"
              placeholder="Ex : Prénom Nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              required
              className={`w-full rounded-2xl border bg-background pl-12 pr-4 py-4 text-foreground placeholder:text-muted-foreground outline-none transition-all duration-300 ${focusedField === 'name' ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-border hover:border-brand-primary/40'}`}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Adresse email</label>
          <div className="relative">
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'email' ? 'text-brand-primary' : 'text-muted-foreground'}`}>
              <Mail className="w-5 h-5" />
            </div>
            <input
              ref={emailRef}
              type="email"
              placeholder="prenom.nom@jci.tn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              required
              className={`w-full rounded-2xl border bg-background pl-12 pr-4 py-4 text-foreground placeholder:text-muted-foreground outline-none transition-all duration-300 ${focusedField === 'email' ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-border hover:border-brand-primary/40'}`}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Mot de passe</label>
          <div className="relative">
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'password' ? 'text-brand-primary' : 'text-muted-foreground'}`}>
              <Lock className="w-5 h-5" />
            </div>
            <input
              ref={passwordRef}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              required
              className={`w-full rounded-2xl border bg-background pl-12 pr-12 py-4 text-foreground placeholder:text-muted-foreground outline-none transition-all duration-300 ${focusedField === 'password' ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-border hover:border-brand-primary/40'}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-brand-primary"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Confirmer le mot de passe</label>
          <div className="relative">
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'confirmPassword' ? 'text-brand-primary' : 'text-muted-foreground'}`}>
              <Lock className="w-5 h-5" />
            </div>
            <input
              ref={confirmPasswordRef}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setFocusedField('confirmPassword')}
              onBlur={() => setFocusedField(null)}
              required
              className={`w-full rounded-2xl border bg-background pl-12 pr-12 py-4 text-foreground placeholder:text-muted-foreground outline-none transition-all duration-300 ${focusedField === 'confirmPassword' ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-border hover:border-brand-primary/40'}`}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-brand-primary"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Rôle</label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {roles.map((r) => {
              const Icon = r.icon;
              const isActive = role === r.value;

              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`relative flex h-24 flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all duration-300 ${isActive ? 'border-transparent bg-gradient-to-br from-brand-primary to-brand-teal text-white shadow-lg shadow-brand-primary/20' : 'border-border bg-card text-foreground hover:border-brand-primary/40 hover:bg-secondary'}`}
                >
                  <Icon className="mb-2 h-6 w-6" />
                  <span className="text-sm font-medium">{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Date de début d’adhésion JCI</label>
          <div className="relative">
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'membershipDate' ? 'text-brand-primary' : 'text-muted-foreground'}`}>
              <Calendar className="w-5 h-5" />
            </div>
            <input
              type="date"
              value={membershipDate}
              onChange={(e) => setMembershipDate(e.target.value)}
              onFocus={() => setFocusedField('membershipDate')}
              onBlur={() => setFocusedField(null)}
              required
              className={`w-full rounded-2xl border bg-background pl-12 pr-4 py-4 text-foreground outline-none transition-all duration-300 ${focusedField === 'membershipDate' ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-border hover:border-brand-primary/40'}`}
            />
          </div>
        </div>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-card px-4 text-muted-foreground">ou poursuivre avec</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 font-semibold text-foreground transition-all duration-300 hover:border-brand-primary/40 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuer avec Google
        </button>

        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex flex-col items-center gap-2">
          <div
            className="g-recaptcha"
            data-sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
            data-callback="handleRecaptcha"
          ></div>
          <button
            type="button"
            onClick={resetRecaptcha}
            className="text-xs text-muted-foreground hover:text-brand-primary transition-colors"
          >
            Le reCAPTCHA ne s'affiche pas ? Actualiser
          </button>
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
              Création du compte en cours...
            </>
          ) : (
            <>
              Créer le compte
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Vous avez déjà un compte ?{' '}
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="font-medium text-brand-primary transition-colors hover:text-brand-primary-light"
          >
            Accéder à JCI Ledger
          </button>
        </p>
      </form>
    </AuthPageShell>
  );
}
