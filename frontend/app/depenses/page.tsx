'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchApi } from '@/lib/apiClient';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TableSearch } from '@/components/table-search';
import { TableFilter } from '@/components/table-filter';
import { TablePagination } from '@/components/table-pagination';
import { exportToPDF } from '@/lib/export-pdf';
import { motion } from 'framer-motion';
import { Receipt, Calendar, FileText, Building2, TrendingDown, Eye, DollarSign, Download, Edit, Trash2 } from 'lucide-react';
import { ImageUpload } from '@/components/image-upload';

export default function DepensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    amount: '',
    date: '',
    description: '',
    projectId: '',
    proof: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const canManageExpenses = ['admin', 'treasurer'].includes(user?.role);
  const canDeleteExpenses = user?.role === 'admin';

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    setUser(currentUser);

    async function fetchData() {
      try {
        const [expensesData, projectsData] = await Promise.all([
          fetchApi('/expenses'),
          fetchApi('/projects')
        ]);
        setExpenses(expensesData.expenses || []);
        setProjects(projectsData.projects || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await fetchApi('/expenses', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          date: formData.date || new Date().toISOString()
        }),
      });
      setShowCreateDialog(false);
      setFormData({ amount: '', date: '', description: '', projectId: '', proof: '' });
      
      // Refresh expenses
      const data = await fetchApi('/expenses');
      setExpenses(data.expenses || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (expense: any) => {
    setSelectedExpense(expense);
    setFormData({
      amount: expense.amount?.toString() || '',
      date: expense.date ? new Date(expense.date).toISOString().slice(0, 10) : '',
      description: expense.description || '',
      projectId: expense.projectId?._id || '',
      proof: expense.proof || '',
    });
    setShowEditDialog(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await fetchApi('/expenses', {
        method: 'PUT',
        body: JSON.stringify({
          id: selectedExpense._id,
          ...formData,
          amount: parseFloat(formData.amount),
          date: formData.date || new Date().toISOString(),
        }),
      });
      setShowEditDialog(false);
      setSelectedExpense(null);
      setFormData({ amount: '', date: '', description: '', projectId: '', proof: '' });
      const data = await fetchApi('/expenses');
      setExpenses(data.expenses || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la modification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return;

    try {
      await fetchApi(`/expenses?id=${id}`, { method: 'DELETE' });
      const data = await fetchApi('/expenses');
      setExpenses(data.expenses || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleExportPDF = () => {
    const filteredData = filteredExpenses.map(e => [
      new Date(e.date || e.createdAt).toLocaleDateString('fr-FR'),
      e.description,
      e.projectId?.name || 'Non assigné',
      `${e.amount} TND`,
    ]);
    
    exportToPDF({
      title: 'Registre des Dépenses JCI',
      subtitle: `Total: ${filteredExpenses.length} dépenses`,
      columns: ['Date', 'Description', 'Projet', 'Montant'],
      data: filteredData,
      fileName: 'depenses_jci',
    });
  };

  const projectOptions = useMemo(() => {
    const projects = new Set(expenses.map(e => e.projectId?.name).filter(Boolean));
    return [
      { value: 'all', label: 'Tous les projets' },
      ...Array.from(projects).map(name => ({ value: name, label: name })),
    ];
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           e.amount.toString().includes(searchQuery);
      const matchesProject = projectFilter === 'all' || e.projectId?.name === projectFilter;
      return matchesSearch && matchesProject;
    });
  }, [expenses, searchQuery, projectFilter]);

  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredExpenses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredExpenses, currentPage]);

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
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
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-primary to-brand-teal bg-clip-text text-transparent">
                  Registre des Dépenses
                </h1>
                <p className="text-muted-foreground">Consultez toutes les dépenses enregistrées de la JCI</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {canManageExpenses && (
                <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white hover:from-green-600 hover:to-emerald-600 transition-colors"
              >
                <TrendingDown className="w-4 h-4" />
                <span>Nouvelle Dépense</span>
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-primary-light rounded-lg text-white hover:from-brand-primary-dark hover:to-brand-primary transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Exporter PDF</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <TableSearch
            placeholder="Rechercher par description ou montant..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
          <TableFilter
            title="Projet"
            options={projectOptions}
            selectedValue={projectFilter}
            onChange={setProjectFilter}
            onClear={() => setProjectFilter('all')}
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
                    <Calendar className="w-4 h-4" />
                    Date
                  </div>
                </TableHead>
                <TableHead className="text-foreground font-semibold">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Description
                  </div>
                </TableHead>
                <TableHead className="text-foreground font-semibold">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Projet associé
                  </div>
                </TableHead>
                <TableHead className="text-foreground font-semibold">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    Montant
                  </div>
                </TableHead>
                <TableHead className="text-foreground font-semibold text-right">Facture / Reçu</TableHead>
                {canManageExpenses && <TableHead className="text-foreground font-semibold text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedExpenses.map((e) => (
                <motion.tr
                  key={e._id}
                  variants={itemVariants}
                  className="border-border hover:bg-muted/40 transition-colors"
                >
                  <TableCell className="text-slate-300">
                    {new Date(e.date || e.createdAt).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{e.description}</TableCell>
                  <TableCell>
                    {e.projectId ? (
                      <motion.div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-brand-primary/10 border-brand-primary/30 text-brand-primary"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Building2 className="w-4 h-4" />
                        <span className="text-xs font-medium">{e.projectId.name}</span>
                      </motion.div>
                    ) : (
                      <span className="text-slate-500 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-foreground font-semibold">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-red-400" />
                      <span className="text-red-400">{e.amount}</span>
                      <span className="text-slate-400">TND</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {e.proof ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setReceiptUrl(e.proof)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border text-foreground hover:bg-secondary transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">Voir la facture</span>
                      </motion.button>
                    ) : (
                      <span className="text-slate-500 text-sm">Aucun reçu</span>
                    )}
                  </TableCell>
                  {canManageExpenses && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openEditDialog(e)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          <span className="text-sm">Modifier</span>
                        </motion.button>
                        {canDeleteExpenses && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDelete(e._id)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-sm">Supprimer</span>
                          </motion.button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </motion.tr>
              ))}
              {paginatedExpenses.length === 0 && (
                <motion.tr variants={itemVariants}>
                  <TableCell colSpan={canManageExpenses ? 6 : 5} className="text-center h-32 text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <Receipt className="w-12 h-12 text-slate-600" />
                      <span>Aucune dépense trouvée</span>
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
              totalItems={filteredExpenses.length}
            />
          </div>
        )}
      </div>

      <Dialog open={!!receiptUrl} onOpenChange={(open) => !open && setReceiptUrl(null)}>
        <DialogContent className="bg-card/98 backdrop-blur-xl border-border max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Facture / Justificatif
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 bg-muted/40 rounded-xl overflow-hidden min-h-[400px]">
            {receiptUrl ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <FileText className="w-16 h-16 text-brand-primary" />
                <p className="text-slate-300 text-center">Document disponible</p>
                <a 
                  href={receiptUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-primary-light rounded-lg text-white hover:from-brand-primary-dark hover:to-brand-primary transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Ouvrir le document
                </a>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <FileText className="w-12 h-12" />
                <span>Aucun document sélectionné</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Expense Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-card/98 backdrop-blur-xl border-border max-w-2xl max-h-[90vh] p-0 overflow-hidden shadow-2xl flex flex-col">
          <DialogHeader>
            <DialogTitle className="sr-only">Nouvelle Dépense</DialogTitle>
          </DialogHeader>
          <div className="bg-gradient-to-r from-brand-primary/10 via-brand-primary/5 to-brand-teal/10 border-b border-border px-6 py-5 shrink-0">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-lg shadow-brand-primary/20">
                <Receipt className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">Nouvelle dépense</p>
                <h3 className="mt-1 text-xl font-semibold text-foreground">Enregistrer une dépense</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Saisissez les informations essentielles et joignez un justificatif pour conserver un suivi propre et exploitable.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-6 px-6 py-6 overflow-y-auto flex-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Montant (TND)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="^[0-9]+([.,][0-9]{1,2})?$"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                  placeholder="Ex: 125 ou 125,50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                required
                className="w-full resize-none rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                placeholder="Décrivez brièvement la dépense et son contexte..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Projet associé</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                >
                  <option value="">Non assigné</option>
                  {projects.map(project => (
                    <option key={project._id} value={project._id}>{project.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <ImageUpload
              value={formData.proof}
              onChange={(url) => setFormData({ ...formData, proof: url })}
              label="Preuve de paiement"
              required
            />

            <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-3 text-sm text-muted-foreground">
              Le justificatif est obligatoire pour garantir la traçabilité et la validation comptable.
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
                {submitting ? 'Création...' : 'Créer la dépense'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-card/98 backdrop-blur-xl border-border max-w-2xl max-h-[90vh] p-0 overflow-hidden shadow-2xl flex flex-col">
          <DialogHeader>
            <DialogTitle className="sr-only">Modifier la dépense</DialogTitle>
          </DialogHeader>
          <div className="bg-gradient-to-r from-brand-primary/10 via-brand-primary/5 to-brand-teal/10 border-b border-border px-6 py-5 shrink-0">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-lg shadow-brand-primary/20">
                <Edit className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">Modifier la dépense</p>
                <h3 className="mt-1 text-xl font-semibold text-foreground">Mettre à jour l'enregistrement</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Corrigez le montant, le projet associé ou la preuve si nécessaire.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6 px-6 py-6 overflow-y-auto flex-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Montant (TND)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="^[0-9]+([.,][0-9]{1,2})?$"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                required
                className="w-full resize-none rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Projet associé</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground outline-none transition-all focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                >
                  <option value="">Non assigné</option>
                  {projects.map(project => (
                    <option key={project._id} value={project._id}>{project.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <ImageUpload
              value={formData.proof}
              onChange={(url) => setFormData({ ...formData, proof: url })}
              label="Preuve de paiement"
              required
            />

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
                {submitting ? 'Modification...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
