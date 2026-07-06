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
import { Coins, Calendar, User as UserIcon, CheckCircle, XCircle, Clock, Eye, FileText, TrendingUp, Download } from 'lucide-react';

export default function CotisationsPage() {
  const [contributions, setContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [proof, setProof] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const u = userStr ? JSON.parse(userStr) : null;
    setUser(u);

    async function fetchData() {
      try {
        const data = await fetchApi('/contributions');
        setContributions(data.contributions || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetchApi(`/contributions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      setContributions(contributions.map(c => c._id === id ? { ...c, status } : c));
    } catch (error) {
      alert("Erreur lors de la mise à jour (Êtes-vous bien Trésorier/Admin ?)");
    }
  };

  const isTreasurerOrAdmin = user?.role === 'treasurer' || user?.role === 'admin';

  const handleExportPDF = () => {
    const filteredData = filteredContributions.map(c => [
      new Date(c.createdAt).toLocaleDateString('fr-FR'),
      c.userId?.name || 'Inconnu',
      `${c.amount} TND`,
      c.status,
    ]);
    
    exportToPDF({
      title: 'Historique des Cotisations JCI',
      subtitle: `Total: ${filteredContributions.length} cotisations`,
      columns: ['Date', 'Membre', 'Montant', 'Statut'],
      data: filteredData,
      fileName: 'cotisations_jci',
    });
  };

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'approved', label: 'Approuvé' },
    { value: 'pending', label: 'En attente' },
    { value: 'rejected', label: 'Rejeté' },
  ];

  const filteredContributions = useMemo(() => {
    return contributions.filter(c => {
      const matchesSearch = c.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           c.amount.toString().includes(searchQuery);
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [contributions, searchQuery, statusFilter]);

  const paginatedContributions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredContributions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredContributions, currentPage]);

  const totalPages = Math.ceil(filteredContributions.length / itemsPerPage);

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'approved': 
        return { 
          icon: CheckCircle, 
          color: 'from-green-500 to-green-600', 
          bg: 'bg-green-500/10', 
          text: 'text-green-400',
          border: 'border-green-500/30',
          label: 'Approuvé'
        };
      case 'rejected': 
        return { 
          icon: XCircle, 
          color: 'from-red-500 to-red-600', 
          bg: 'bg-red-500/10', 
          text: 'text-red-400',
          border: 'border-red-500/30',
          label: 'Rejeté'
        };
      default: 
        return { 
          icon: Clock, 
          color: 'from-yellow-500 to-yellow-600', 
          bg: 'bg-yellow-500/10', 
          text: 'text-yellow-400',
          border: 'border-yellow-500/30',
          label: 'En attente'
        };
    }
  };

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
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-primary to-brand-teal bg-clip-text text-transparent">
                  Gestion des Cotisations
                </h1>
                <p className="text-muted-foreground">Historique et validation des paiements de cotisations</p>
              </div>
            </div>
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
        </motion.div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <TableSearch
            placeholder="Rechercher par membre ou montant..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
          <TableFilter
            title="Statut"
            options={statusOptions}
            selectedValue={statusFilter}
            onChange={setStatusFilter}
            onClear={() => setStatusFilter('all')}
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
                    <UserIcon className="w-4 h-4" />
                    Membre
                  </div>
                </TableHead>
                <TableHead className="text-foreground font-semibold">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Montant
                  </div>
                </TableHead>
                <TableHead className="text-foreground font-semibold">Statut</TableHead>
                <TableHead className="text-foreground font-semibold">Justificatif</TableHead>
                {isTreasurerOrAdmin && <TableHead className="text-foreground font-semibold text-right">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedContributions.map((c) => {
                const statusConfig = getStatusConfig(c.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <motion.tr
                    key={c._id}
                    variants={itemVariants}
                    className="border-border hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="text-slate-300">
                      {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center text-white font-semibold">
                          {c.userId?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        {c.userId?.name || 'Inconnu'}
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">{c.amount}</span>
                        <span className="text-slate-400">TND</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <motion.div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase">{statusConfig.label}</span>
                      </motion.div>
                    </TableCell>
                    <TableCell>
                      {c.proof ? (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setReceiptUrl(c.proof)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border text-foreground hover:bg-secondary transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-sm">Voir le reçu</span>
                        </motion.button>
                      ) : (
                        <span className="text-slate-500 text-sm">Aucun reçu</span>
                      )}
                    </TableCell>
                    {isTreasurerOrAdmin && (
                      <TableCell className="text-right">
                        {c.status === 'pending' && (
                          <div className="flex gap-2 justify-end">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleUpdateStatus(c._id, 'approved')}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-primary to-brand-teal text-white hover:from-brand-primary-dark hover:to-brand-teal-dark transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm">Approuver</span>
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleUpdateStatus(c._id, 'rejected')}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              <span className="text-sm">Rejeter</span>
                            </motion.button>
                          </div>
                        )}
                      </TableCell>
                    )}
                  </motion.tr>
                );
              })}
              {paginatedContributions.length === 0 && (
                <motion.tr variants={itemVariants}>
                  <TableCell colSpan={6} className="text-center h-32 text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <Coins className="w-12 h-12 text-slate-600" />
                      <span>Aucune cotisation trouvée</span>
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
              totalItems={filteredContributions.length}
            />
          </div>
        )}
      </div>

      <Dialog open={!!receiptUrl} onOpenChange={(open) => !open && setReceiptUrl(null)}>
        <DialogContent className="bg-card/98 backdrop-blur-xl border-border max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Justificatif de paiement
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
    </DashboardLayout>
  );
}
