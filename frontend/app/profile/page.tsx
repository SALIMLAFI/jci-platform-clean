'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/apiClient';
import { DashboardLayout } from '@/components/dashboard-layout';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, ShieldCheck, Camera, Save, X, Upload } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    photo: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const { user, loading, updateUser } = useUser();

  useEffect(() => {
    console.log('[ProfilePage] useEffect, user:', user, 'loading:', loading);
    
    if (!loading && !user) {
      console.log('[ProfilePage] No user, redirecting to login');
      router.push('/login');
      return;
    }
    if (user) {
      console.log('[ProfilePage] User found, setting form data:', user);
      setFormData({
        name: user.name,
        email: user.email,
        photo: user.photo || ''
      });
    }
  }, [user, loading, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      console.log('[ProfilePage] Saving profile, formData:', formData);
      
      const data = await fetchApi('/users/me', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });

      console.log('[ProfilePage] API response:', data);

      // Update user in context (this will automatically sync to localStorage)
      updateUser(data.user);

      console.log('[ProfilePage] User updated in context:', data.user);
      
      setSuccess('Profil mis à jour avec succès');
      setEditing(false);
    } catch (err: any) {
      console.error('[ProfilePage] Error:', err);
      setError(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({ ...formData, photo: base64String });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading image:', error);
      setError('Erreur lors de la lecture de l\'image');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-brand-primary/30 border-t-brand-primary rounded-full"
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-primary-light rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-primary to-brand-teal bg-clip-text text-transparent">
                Mon Profil
              </h1>
              <p className="text-muted-foreground">Gérez vos informations personnelles</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-xl"
        >
          {/* Profile Photo Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <div className="w-32 h-32 bg-gradient-to-br from-brand-primary to-brand-primary-light rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg overflow-hidden">
                {formData.photo ? (
                  <img src={formData.photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user?.name.charAt(0).toUpperCase()
                )}
              </div>
              {editing && (
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-brand-primary-dark transition-colors shadow-lg">
                  <Camera className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-primary" />
                  Nom complet
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!editing}
                  className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl text-foreground placeholder:text-muted-foreground outline-none focus:border-brand-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand-primary" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!editing}
                  className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl text-foreground placeholder:text-muted-foreground outline-none focus:border-brand-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-primary" />
                Rôle
              </label>
              <input
                type="text"
                value={user?.role || ''}
                disabled
                className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50 disabled:cursor-not-allowed capitalize"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-primary" />
                Membre depuis
              </label>
              <input
                type="text"
                value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : ''}
                disabled
                className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-300 text-sm">
                {success}
              </div>
            )}

            <div className="flex gap-3">
              {editing ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setFormData({ name: user?.name || '', email: user?.email || '', photo: user?.photo || '' });
                      setError('');
                      setSuccess('');
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-background border-2 border-border rounded-xl text-foreground hover:bg-secondary transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-primary-light rounded-xl text-white hover:from-brand-primary-dark hover:to-brand-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Enregistrer
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-primary-light rounded-xl text-white hover:from-brand-primary-dark hover:to-brand-primary transition-colors"
                >
                  <User className="w-4 h-4" />
                  Modifier le profil
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
