'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/apiClient';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TableSearch } from '@/components/table-search';
import { TablePagination } from '@/components/table-pagination';
import { exportToPDF } from '@/lib/export-pdf';
import { motion } from 'framer-motion';
import { Building2, Plus, Edit, Trash2, Download, Calendar, DollarSign, Users } from 'lucide-react';

export default function ProjetsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const router = useRouter();

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    directorId: '',
    startDate: '',
    endDate: '',
    budget: '',
    status: 'planning',
    priority: 'medium'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const u = userStr ? JSON.parse(userStr) : null;
    if (!u) {
      router.push('/login');
      return;
    }
    setUser(u);

    async function fetchProjects() {
      try {
        const data = await fetchApi('/projects');
        setProjects(data.projects || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, [router]);

  const filteredProjects = useMemo(() => {
    return projects.filter(project =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProjects, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await fetchApi('/projects', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowCreateDialog(false);
      setFormData({ name: '', description: '', directorId: '', startDate: '', endDate: '', budget: '', status: 'planning', priority: 'medium' });
      
      // Refresh projects
      const data = await fetchApi('/projects');
      setProjects(data.projects || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await fetchApi(`/projects/${selectedProject._id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      setShowEditDialog(false);
      setSelectedProject(null);
      setFormData({ name: '', description: '', directorId: '', startDate: '', endDate: '', budget: '', status: 'planning', priority: 'medium' });
      
      // Refresh projects
      const data = await fetchApi('/projects');
      setProjects(data.projects || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la modification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return;

    try {
      await fetchApi(`/projects/${id}`, {
        method: 'DELETE',
      });
      
      // Refresh projects
      const data = await fetchApi('/projects');
      setProjects(data.projects || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const openCreateDialog = () => {
    // Auto-assign current user as director if they have director or admin role
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    
    setFormData({
      name: '',
      description: '',
      directorId: (currentUser?.role === 'director' || currentUser?.role === 'admin') ? currentUser._id : '',
      startDate: '',
      endDate: '',
      budget: '',
      status: 'planning',
      priority: 'medium'
    });
    setShowCreateDialog(true);
  };

  const handleExportPDF = () => {
    exportToPDF({
      title: 'Rapport des Projets',
      subtitle: 'Liste complète des projets JCI',
      columns: ['Nom', 'Description', 'Directeur'],
      data: filteredProjects.map(p => [
        p.name,
        p.description || '-',
        p.directorId?.name || 'Non assigné'
      ]),
    });
  };

  const openEditDialog = (project: any) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      directorId: project.directorId?._id || '',
      startDate: project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().slice(0, 10) : '',
      budget: project.budget?.toString() || '',
      status: project.status || 'planning',
      priority: project.priority || 'medium'
    });
    setShowEditDialog(true);
  };

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
    },
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
      <div className="p-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-primary-light rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-primary to-brand-teal bg-clip-text text-transparent">
                  Gestion des Projets
                </h1>
                <p className="text-muted-foreground">Créez et gérez les projets JCI</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-primary-light rounded-lg text-white hover:from-brand-primary-dark hover:to-brand-primary transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Exporter PDF</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openCreateDialog}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-primary-light rounded-lg text-white hover:from-brand-primary-dark hover:to-brand-primary transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Projet</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        <div className="mb-6">
          <TableSearch
            placeholder="Rechercher par nom ou description..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-xl overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-muted/50">
                <TableHead className="text-foreground font-semibold">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Nom
                  </div>
                </TableHead>
                <TableHead className="text-foreground font-semibold">Description</TableHead>
                <TableHead className="text-foreground font-semibold">Directeur</TableHead>
                <TableHead className="text-foreground font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProjects.map((project, index) => (
                <motion.tr
                  key={project._id}
                  variants={itemVariants}
                  className="border-border hover:bg-muted/40 transition-colors"
                >
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-primary-light rounded-lg flex items-center justify-center text-white font-semibold">
                        {project.name.charAt(0).toUpperCase()}
                      </div>
                      {project.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {project.description || '-'}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-brand-primary" />
                      {project.directorId?.name || 'Non assigné'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openEditDialog(project)}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(project._id)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
              {paginatedProjects.length === 0 && (
                <motion.tr variants={itemVariants}>
                  <TableCell colSpan={4} className="text-center h-32 text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <Building2 className="w-12 h-12 text-slate-600" />
                      <span>Aucun projet trouvé</span>
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
              totalItems={filteredProjects.length}
            />
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-card/98 backdrop-blur-xl border-border max-w-2xl max-h-[90vh] p-0 overflow-hidden shadow-2xl flex flex-col">
          <DialogHeader>
            <DialogTitle className="sr-only">Nouveau Projet</DialogTitle>
          </DialogHeader>
          <div className="bg-gradient-to-r from-brand-primary/10 via-brand-primary/5 to-brand-teal/10 border-b border-border px-6 py-5 shrink-0">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-lg shadow-brand-primary/20">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">Nouveau projet</p>
                <h3 className="mt-1 text-xl font-semibold text-foreground">Créer une fiche projet claire</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Définissez le nom, la description et la structure du projet pour un suivi plus lisible dans le tableau de bord.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-6 px-6 py-6 overflow-y-auto flex-1">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nom du projet</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                placeholder="Ex: Projet Annuel 2024"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full resize-none rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                placeholder="Expliquez l'objectif, le périmètre et le contexte du projet..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Date de début</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Date de fin</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Budget (TND)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  required
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                  placeholder="Ex: 5000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Statut</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                >
                  <option value="planning">Planification</option>
                  <option value="active">En cours</option>
                  <option value="completed">Terminé</option>
                  <option value="on-hold">En pause</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Priorité</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-3 text-sm text-muted-foreground">
              Un projet bien nommé et bien décrit facilite le suivi des dépenses et des rapports financiers.
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="h-12 rounded-xl border-border px-5 text-foreground hover:bg-secondary"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="h-12 rounded-xl bg-gradient-to-r from-brand-primary to-brand-primary-light px-6 text-white shadow-lg shadow-brand-primary/20 transition-all hover:from-brand-primary-dark hover:to-brand-primary"
              >
                {submitting ? 'Création...' : 'Créer le projet'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-card/98 backdrop-blur-xl border-border max-w-2xl max-h-[90vh] p-0 overflow-hidden shadow-2xl flex flex-col">
          <DialogHeader>
            <DialogTitle className="sr-only">Modifier le Projet</DialogTitle>
          </DialogHeader>
          <div className="bg-gradient-to-r from-brand-primary/10 via-brand-primary/5 to-brand-teal/10 border-b border-border px-6 py-5 shrink-0">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-lg shadow-brand-primary/20">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">Modifier le projet</p>
                <h3 className="mt-1 text-xl font-semibold text-foreground">Mettre à jour les informations</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Corrigez le titre ou la description pour garder les données du projet propres et faciles à suivre.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6 px-6 py-6 overflow-y-auto flex-1">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nom du projet</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full resize-none rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Date de début</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Date de fin</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Budget (TND)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  required
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Statut</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                >
                  <option value="planning">Planification</option>
                  <option value="active">En cours</option>
                  <option value="completed">Terminé</option>
                  <option value="on-hold">En pause</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Priorité</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="h-12 rounded-xl border-border px-5 text-foreground hover:bg-secondary"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="h-12 rounded-xl bg-gradient-to-r from-brand-primary to-brand-primary-light px-6 text-white shadow-lg shadow-brand-primary/20 transition-all hover:from-brand-primary-dark hover:to-brand-primary"
              >
                {submitting ? 'Modification...' : 'Enregistrer les modifications'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
