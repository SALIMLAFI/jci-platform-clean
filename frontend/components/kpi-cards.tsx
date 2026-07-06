'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchApi } from '@/lib/apiClient';
import { TrendingUp, TrendingDown, Users, Wallet, Clock, Building2, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KPIData {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  totalMembers: number;
  activeContributors: number;
  pendingApprovals: number;
  totalProjects: number;
  avgContribution: number;
  avgExpense: number;
}

export function KPICards() {
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetchApi('/reports');
        setData(response);
      } catch (error) {
        console.error('Erreur lors du chargement des KPIs:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', maximumFractionDigits: 0 }).format(val);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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

  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse h-32 bg-secondary border border-border rounded-2xl"></div>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total des Recettes',
      value: formatCurrency(data.totalIncome || 0),
      icon: TrendingUp,
      gradient: 'from-primary/20 to-accent/20',
      borderColor: 'border-primary/30',
      textColor: 'text-primary',
      iconBg: 'bg-primary',
    },
    {
      title: 'Total des Dépenses',
      value: formatCurrency(data.totalExpenses || 0),
      icon: TrendingDown,
      gradient: 'from-destructive/20 to-destructive/20',
      borderColor: 'border-destructive/30',
      textColor: 'text-destructive',
      iconBg: 'bg-destructive',
    },
    {
      title: 'Solde Net',
      value: formatCurrency(data.balance || 0),
      icon: Wallet,
      gradient: data.balance >= 0 ? 'from-accent/20 to-accent/20' : 'from-brand-gold/20 to-destructive/20',
      borderColor: data.balance >= 0 ? 'border-accent/30' : 'border-brand-gold/30',
      textColor: data.balance >= 0 ? 'text-accent' : 'text-brand-gold',
      iconBg: data.balance >= 0 ? 'bg-accent' : 'bg-brand-gold',
    },
    {
      title: 'Membres Actifs',
      value: `${data.activeContributors}/${data.totalMembers}`,
      icon: Users,
      gradient: 'from-primary/20 to-accent/20',
      borderColor: 'border-primary/30',
      textColor: 'text-primary',
      iconBg: 'bg-primary',
    },
    {
      title: 'En Attente',
      value: data.pendingApprovals.toString(),
      icon: Clock,
      gradient: 'from-brand-gold/20 to-brand-gold/20',
      borderColor: 'border-brand-gold/30',
      textColor: 'text-brand-gold',
      iconBg: 'bg-brand-gold',
    },
    {
      title: 'Projets',
      value: data.totalProjects.toString(),
      icon: Building2,
      gradient: 'from-primary/20 to-accent/20',
      borderColor: 'border-primary/30',
      textColor: 'text-primary',
      iconBg: 'bg-primary',
    },
    {
      title: 'Moy. Cotisation',
      value: formatCurrency(data.avgContribution || 0),
      icon: DollarSign,
      gradient: 'from-accent/20 to-accent/20',
      borderColor: 'border-accent/30',
      textColor: 'text-accent',
      iconBg: 'bg-accent',
    },
    {
      title: 'Moy. Dépense',
      value: formatCurrency(data.avgExpense || 0),
      icon: ArrowDownRight,
      gradient: 'from-destructive/20 to-destructive/20',
      borderColor: 'border-destructive/30',
      textColor: 'text-destructive',
      iconBg: 'bg-destructive',
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {kpis.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={idx}
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -4 }}
            className={`bg-gradient-to-br ${card.gradient} backdrop-blur-xl border ${card.borderColor} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className={`flex items-center gap-1 ${card.textColor}`}>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{card.title}</h3>
            <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
