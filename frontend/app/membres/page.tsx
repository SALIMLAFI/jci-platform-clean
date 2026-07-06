'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchApi } from '@/lib/apiClient';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TableSearch } from '@/components/table-search';
import { TableFilter } from '@/components/table-filter';
import { TablePagination } from '@/components/table-pagination';
import { exportToPDF } from '@/lib/export-pdf';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Crown, ShieldCheck, Building2, User, Mail, Download, Calendar, Coins, Plus } from 'lucide-react';

export default function MembresPage() {
  const [membres, setMembres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const router = useRouter();
  const [showContributionDialog, setShowContributionDialog] = useState(false);
  const [showCreateMemberDialog, setShowCreateMemberDialog] = useState(false);
  const [contributionData, setContributionData] = useState({ amount: '', proof: '' });
  const [memberData, setMemberData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member',
    membershipDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [creatingMember, setCreatingMember] = useState(false);
  const [contributionError, setContributionError] = useState('');
  const [memberError, setMemberError] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);

    async function fetchData() {
      try {
        if (user.role === 'admin') {
          const data = await fetchApi('/users');
          setMembres(data.users || []);
        } else {
          // For members, use localStorage data directly
          setMembres([user] || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  const handleContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setContributionError('');

    try {
      await fetchApi('/contributions', {
        method: 'POST',
        body: JSON.stringify({
          ...contributionData,
          amount: parseFloat(contributionData.amount),
          userId: user._id
        }),
      });
      setShowContributionDialog(false);
      setContributionData({ amount: '', proof: '' });
    } catch (err: any) {
      setContributionError(err.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await fetchApi(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      setMembres(membres.map(m => m._id === userId ? { ...m, role: newRole } : m));
    } catch (error) {
      alert("Erreur lors de la mise à jour du rôle.");
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingMember(true);
    setMemberError('');

    try {
      await fetchApi('/users', {
        method: 'POST',
        body: JSON.stringify(memberData),
      });
      setShowCreateMemberDialog(false);
      setMemberData({ name: '', email: '', password: '', role: 'member', membershipDate: '' });

      if (user?.role === 'admin') {
        const data = await fetchApi('/users');
        setMembres(data.users || []);
      }
    } catch (err: any) {
      setMemberError(err.message || 'Erreur lors de la création');
    } finally {
      setCreatingMember(false);
    }
  };

  const handleExportPDF = () => {
    const filteredData = filteredMembres.map(m => [
      m.name,
      m.email,
      m.role,
    ]);
    
    exportToPDF({
      title: 'Liste des Membres JCI',
      subtitle: `Total: ${filteredMembres.length} membres`,
      columns: ['Nom', 'Email', 'Rôle'],
      data: filteredData,
      fileName: 'membres_jci',
    });
  };

  const getRoleConfig = (role: string) => {
    switch(role) {
      case 'admin': 
        return { 
          icon: Crown, 
          color: 'from-purple-500 to-purple-600', 
          bg: 'bg-purple-500/10', 
          text: 'text-purple-400',
          border: 'border-purple-500/30'
        };
      case 'treasurer': 
        return { 
          icon: ShieldCheck, 
          color: 'from-green-500 to-green-600', 
          bg: 'bg-green-500/10', 
          text: 'text-green-400',
          border: 'border-green-500/30'
        };
      case 'director': 
        return { 
          icon: Building2, 
          color: 'from-orange-500 to-orange-600', 
          bg: 'bg-orange-500/10', 
          text: 'text-orange-400',
          border: 'border-orange-500/30'
        };
      default: 
        return { 
          icon: User, 
          color: 'from-blue-500 to-blue-600', 
          bg: 'bg-blue-500/10', 
          text: 'text-blue-400',
          border: 'border-blue-500/30'
        };
    }
  };

  const roleOptions = [
    { value: 'all', label: 'Tous les rôles' },
    { value: 'admin', label: 'Admin' },
    { value: 'treasurer', label: 'Trésorier' },
    { value: 'director', label: 'Directeur' },
    { value: 'member', label: 'Membre' },
  ];

  const filteredMembres = useMemo(() => {
    return membres.filter(membre => {
      const matchesSearch = membre.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           membre.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || membre.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [membres, searchQuery, roleFilter]);

  const paginatedMembres = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMembres.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMembres, currentPage]);

  const totalPages = Math.ceil(filteredMembres.length / itemsPerPage);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12,
      },
    },
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full"
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {user?.role === 'member' ? (
          // Member view - Account management
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Mon Compte
                  </h1>
                  <p className="text-muted-foreground">Gérez vos informations personnelles</p>
                </div>
              </div>
            </div>

            {membres.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-gradient-to-br from-secondary/5 to-secondary/0 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl"
              >
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-lg">
                    {membres[0].name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-1">{membres[0].name}</h2>
                    <p className="text-muted-foreground mb-2">{membres[0].email}</p>
                    <motion.div
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium uppercase">{membres[0].role}</span>
                    </motion.div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Mail className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">Email</h3>
                    </div>
                    <p className="text-muted-foreground">{membres[0].email}</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-secondary border border-border rounded-xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <User className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">Rôle</h3>
                    </div>
                    <p className="text-muted-foreground capitalize">{membres[0].role}</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-secondary border border-border rounded-xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Calendar className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">Membre depuis</h3>
                    </div>
                    <p className="text-muted-foreground">
                      {new Date(membres[0].createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-secondary border border-border rounded-xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">Statut</h3>
                    </div>
                    <p className="text-muted-foreground">Actif</p>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Contribution submission section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-gradient-to-br from-secondary/5 to-secondary/0 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl mt-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent rounded-xl flex items-center justify-center">
                    <Coins className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Soumission de Cotisation</h3>
                    <p className="text-muted-foreground">Soumettez vos preuves de paiement</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowContributionDialog(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent to-accent rounded-lg text-primary-foreground hover:from-accent hover:to-accent transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouvelle Cotisation</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          // Admin view - Full member management
          <>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Gestion des Membres
                    </h1>
                    <p className="text-muted-foreground">Consultez et modifiez les rôles des utilisateurs de JCI</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user?.role === 'admin' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowCreateMemberDialog(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-primary-light rounded-lg text-white hover:from-brand-primary-dark hover:to-brand-primary transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Nouveau Membre</span>
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent rounded-lg text-primary-foreground hover:from-primary hover:to-accent transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exporter PDF</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>

            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <TableSearch
                placeholder="Rechercher par nom ou email..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
              <TableFilter
                title="Rôle"
                options={roleOptions}
                selectedValue={roleFilter}
                onChange={setRoleFilter}
                onClear={() => setRoleFilter('all')}
              />
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="bg-gradient-to-br from-secondary/5 to-secondary/0 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden"
            >
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-secondary/5">
                    <TableHead className="text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Nom
                      </div>
                    </TableHead>
                    <TableHead className="text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </div>
                    </TableHead>
                    <TableHead className="text-white font-semibold">Rôle actuel</TableHead>
                    <TableHead className="text-white font-semibold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMembres.map((membre, index) => {
                    const roleConfig = getRoleConfig(membre.role);
                    const RoleIcon = roleConfig.icon;
                    return (
                      <motion.tr
                        key={membre._id}
                        variants={itemVariants}
                        className="border-border hover:bg-secondary/5 transition-colors"
                      >
                        <TableCell className="font-medium text-foreground">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${roleConfig.color} flex items-center justify-center text-white font-semibold`}>
                              {membre.name.charAt(0).toUpperCase()}
                            </div>
                            {membre.name}
                          </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{membre.email}</TableCell>
                    <TableCell>
                      <motion.div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${roleConfig.bg} ${roleConfig.border} ${roleConfig.text}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <RoleIcon className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase">{membre.role}</span>
                      </motion.div>
                    </TableCell>
                    <TableCell>
                      <Select defaultValue={membre.role} onValueChange={(val) => handleRoleChange(membre._id, val)}>
                        <SelectTrigger className="w-[180px] bg-secondary border-border text-foreground focus:ring-primary">
                          <SelectValue placeholder="Changer le rôle" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="member" className="text-foreground">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-primary" />
                              Membre
                            </div>
                          </SelectItem>
                          <SelectItem value="treasurer" className="text-foreground">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-accent" />
                              Trésorier
                            </div>
                          </SelectItem>
                          <SelectItem value="director" className="text-foreground">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-brand-gold" />
                              Directeur
                            </div>
                          </SelectItem>
                          <SelectItem value="admin" className="text-foreground">
                            <div className="flex items-center gap-2">
                              <Crown className="w-4 h-4 text-primary" />
                              Admin
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </motion.tr>
                );
              })}
              {paginatedMembres.length === 0 && (
                <motion.tr variants={itemVariants}>
                  <TableCell colSpan={4} className="text-center h-32 text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="w-12 h-12 text-muted-foreground" />
                      <span>Aucun membre trouvé</span>
                    </div>
                  </TableCell>
                </motion.tr>
              )}
            </TableBody>
          </Table>
        </motion.div>

        {totalPages > 1 && (
          <div className="mt-6">
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredMembres.length}
            />
          </div>
        )}
        </>
        )}
      </div>

      <Dialog open={showCreateMemberDialog} onOpenChange={setShowCreateMemberDialog}>
        <DialogContent className="bg-card/98 backdrop-blur-xl border-border max-w-2xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Nouveau Membre</DialogTitle>
          </DialogHeader>
          <div className="bg-gradient-to-r from-brand-primary/10 via-brand-primary/5 to-brand-teal/10 border-b border-border px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-lg shadow-brand-primary/20">
                <Users className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">Création de membre</p>
                <h3 className="mt-1 text-xl font-semibold text-foreground">Ajouter un nouvel utilisateur</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Créez un compte avec rôle, mot de passe initial et date d’adhésion.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleCreateMember} className="space-y-6 px-6 py-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nom complet</label>
                <input
                  type="text"
                  value={memberData.name}
                  onChange={(e) => setMemberData({ ...memberData, name: e.target.value })}
                  required
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                  placeholder="Ex: Amina Ben Salah"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <input
                  type="email"
                  value={memberData.email}
                  onChange={(e) => setMemberData({ ...memberData, email: e.target.value })}
                  required
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Mot de passe initial</label>
                <input
                  type="password"
                  value={memberData.password}
                  onChange={(e) => setMemberData({ ...memberData, password: e.target.value })}
                  required
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Rôle</label>
                <select
                  value={memberData.role}
                  onChange={(e) => setMemberData({ ...memberData, role: e.target.value })}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                >
                  <option value="member">Membre</option>
                  <option value="director">Directeur</option>
                  <option value="treasurer">Trésorier</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Date d’adhésion</label>
              <input
                type="date"
                value={memberData.membershipDate}
                onChange={(e) => setMemberData({ ...memberData, membershipDate: e.target.value })}
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
              />
            </div>

            <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-3 text-sm text-muted-foreground">
              Le compte sera actif immédiatement après création.
            </div>

            {memberError && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                {memberError}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateMemberDialog(false)}
                className="h-12 rounded-xl border-border px-5 text-foreground hover:bg-secondary"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={creatingMember}
                className="h-12 rounded-xl bg-gradient-to-r from-brand-primary to-brand-primary-light px-6 text-white shadow-lg shadow-brand-primary/20 transition-all hover:from-brand-primary-dark hover:to-brand-primary"
              >
                {creatingMember ? 'Création...' : 'Créer le membre'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Contribution Submission Dialog */}
      <Dialog open={showContributionDialog} onOpenChange={setShowContributionDialog}>
        <DialogContent className="bg-card/98 backdrop-blur-xl border-border max-w-2xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Soumettre une Cotisation</DialogTitle>
          </DialogHeader>
          <div className="bg-gradient-to-r from-brand-primary/10 via-brand-primary/5 to-brand-teal/10 border-b border-border px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-lg shadow-brand-primary/20">
                <span className="text-lg font-bold">$</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">Cotisation membre</p>
                <h3 className="mt-1 text-xl font-semibold text-foreground">Soumettre votre cotisation</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Renseignez un montant exact et ajoutez le lien du justificatif pour faciliter la validation.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleContributionSubmit} className="space-y-6 px-6 py-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Montant (TND)</label>
              <input
                type="text"
                inputMode="decimal"
                pattern="^[0-9]+([.,][0-9]{1,2})?$"
                value={contributionData.amount}
                onChange={(e) => setContributionData({ ...contributionData, amount: e.target.value })}
                required
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                placeholder="Ex: 125 ou 125,50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Preuve de paiement (URL)</label>
              <input
                type="text"
                value={contributionData.proof}
                onChange={(e) => setContributionData({ ...contributionData, proof: e.target.value })}
                required
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                placeholder="https://..."
              />
            </div>

            <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-3 text-sm text-muted-foreground">
              La cotisation sera enregistrée avec le statut <span className="font-medium text-foreground">en attente</span> puis validée par le trésorier.
            </div>

            {contributionError && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                {contributionError}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowContributionDialog(false)}
                className="h-12 rounded-xl border-border px-5 text-foreground hover:bg-secondary"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="h-12 rounded-xl bg-gradient-to-r from-brand-primary to-brand-primary-light px-6 text-white shadow-lg shadow-brand-primary/20 transition-all hover:from-brand-primary-dark hover:to-brand-primary"
              >
                {submitting ? 'Soumission...' : 'Soumettre la cotisation'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
