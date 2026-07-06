'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/apiClient';
import { DashboardLayout } from '@/components/dashboard-layout';
import { KPICards } from '@/components/kpi-cards';
import { Charts } from '@/components/charts';
import { exportReportBundle, exportToExcel } from '@/lib/export-pdf';
import { motion } from 'framer-motion';
import { BarChart3, Download, FileSpreadsheet, FileText, Filter } from 'lucide-react';

export default function RapportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await fetchApi('/reports');
        setReportData(data);
      } catch (error) {
        console.error('Erreur lors du chargement des rapports:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleExportPDF = () => {
    if (!reportData) return;

    const summarySection = [
      ['Métrique', 'Valeur'],
      ['Total des Recettes', `${reportData.totalIncome} TND`],
      ['Total des Dépenses', `${reportData.totalExpenses} TND`],
      ['Solde Net', `${reportData.balance} TND`],
      ['Total Membres', reportData.totalMembers],
      ['Membres Actifs', reportData.activeContributors],
      ['En Attente', reportData.pendingApprovals],
      ['Total Projets', reportData.totalProjects],
      ['Moyenne Cotisation', `${Number(reportData.avgContribution || 0).toFixed(2)} TND`],
      ['Moyenne Dépense', `${Number(reportData.avgExpense || 0).toFixed(2)} TND`],
    ];

    const monthlySection = [
      ['Mois', 'Recettes', 'Dépenses'],
      ...(reportData.monthlyData || []).map((m: any) => [
        m.month,
        `${m.income} TND`,
        `${m.expenses} TND`,
      ]),
    ];

    const expenseSection = [
      ['Projet / Catégorie', 'Montant'],
      ...(reportData.expenseBreakdown || []).map((e: any) => [
        e.name,
        `${e.value} TND`,
      ]),
    ];

    const recentContributionSection = [
      ['Utilisateur', 'Montant', 'Date'],
      ...(reportData.recentContributions || []).map((item: any) => [
        item.user,
        `${item.amount} TND`,
        new Date(item.date).toLocaleDateString('fr-FR'),
      ]),
    ];

    const recentExpenseSection = [
      ['Description', 'Projet', 'Montant', 'Date'],
      ...(reportData.recentExpenses || []).map((item: any) => [
        item.description,
        item.project,
        `${item.amount} TND`,
        new Date(item.date).toLocaleDateString('fr-FR'),
      ]),
    ];

    exportReportBundle({
      title: 'Rapport Financier JCI',
      subtitle: `Généré le ${new Date().toLocaleDateString('fr-FR')}`,
      sections: [
        { title: 'Synthèse financière', columns: summarySection[0], data: summarySection.slice(1) },
        { title: 'Évolution mensuelle', columns: monthlySection[0], data: monthlySection.slice(1) },
        { title: 'Répartition des dépenses', columns: expenseSection[0], data: expenseSection.slice(1) },
        { title: 'Cotisations récentes', columns: recentContributionSection[0], data: recentContributionSection.slice(1) },
        { title: 'Dépenses récentes', columns: recentExpenseSection[0], data: recentExpenseSection.slice(1) },
      ],
      fileName: 'rapport_financier_jci',
    });
  };

  const handleExportExcel = () => {
    if (!reportData) return;

    const excelData = [
      { section: 'Synthèse', metric: 'Total des Recettes', value: reportData.totalIncome },
      { section: 'Synthèse', metric: 'Total des Dépenses', value: reportData.totalExpenses },
      { section: 'Synthèse', metric: 'Solde Net', value: reportData.balance },
      { section: 'Synthèse', metric: 'Total Membres', value: reportData.totalMembers },
      { section: 'Synthèse', metric: 'Membres Actifs', value: reportData.activeContributors },
      { section: 'Synthèse', metric: 'En Attente', value: reportData.pendingApprovals },
      { section: 'Synthèse', metric: 'Total Projets', value: reportData.totalProjects },
      { section: 'Synthèse', metric: 'Moyenne Cotisation', value: Number(reportData.avgContribution || 0).toFixed(2) },
      { section: 'Synthèse', metric: 'Moyenne Dépense', value: Number(reportData.avgExpense || 0).toFixed(2) },
      ...(reportData.monthlyData || []).flatMap((m: any) => ([
        { section: 'Évolution mensuelle', metric: `Recettes ${m.month}`, value: m.income },
        { section: 'Évolution mensuelle', metric: `Dépenses ${m.month}`, value: m.expenses },
      ])),
      ...(reportData.expenseBreakdown || []).map((e: any) => ({
        section: 'Répartition des dépenses',
        metric: e.name,
        value: e.value,
      })),
      ...(reportData.recentContributions || []).map((item: any) => ({
        section: 'Cotisations récentes',
        metric: item.user,
        value: item.amount,
      })),
      ...(reportData.recentExpenses || []).map((item: any) => ({
        section: 'Dépenses récentes',
        metric: item.description,
        value: item.amount,
      })),
    ];

    exportToExcel(excelData, 'rapport_complet_jci');
  };

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
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-primary to-brand-teal bg-clip-text text-transparent">
                  Rapports et Statistiques
                </h1>
                <p className="text-muted-foreground">Vue d'ensemble détaillée des finances de la JCI</p>
              </div>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportPDF}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-brand-primary to-brand-primary-light text-white hover:from-brand-primary-dark hover:to-brand-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Exporter PDF</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportExcel}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted border border-border text-foreground hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="text-sm">Exporter Excel</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <KPICards />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Charts />
        </motion.section>
      </div>
    </DashboardLayout>
  );
}
