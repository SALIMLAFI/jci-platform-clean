'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { fetchApi } from '@/lib/apiClient';

const COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#14B8A6'];

interface ChartData {
  monthlyData: Array<{ month: string; income: number; expenses: number }>;
  expenseBreakdown: Array<{ name: string; value: number }>;
}

export function Charts() {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetchApi('/reports');
        setData({
          monthlyData: response.monthlyData || [],
          expenseBreakdown: response.expenseBreakdown || [],
        });
      } catch (error) {
        console.error('Erreur lors du chargement des graphiques:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', maximumFractionDigits: 0 }).format(val);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-foreground font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-foreground font-medium">{payload[0].name}</p>
          <p className="text-sm text-brand-primary">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 bg-card border border-border rounded-2xl animate-pulse"></div>
        <div className="h-80 bg-card border border-border rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  const lineData = data?.monthlyData || [];
  const pieData = data?.expenseBreakdown || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      {/* Line Chart */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="lg:col-span-2 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
      >
        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-gradient-to-b from-brand-primary to-brand-teal rounded-full"></span>
          Évolution Revenus vs Dépenses
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              stroke="rgba(255,255,255,0.6)" 
              dataKey="month"
              tick={{ fill: 'rgba(255,255,255,0.6)' }}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.6)"
              tick={{ fill: 'rgba(255,255,255,0.6)' }}
              tickFormatter={(value) => `${value} TND`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ color: 'rgba(255,255,255,0.8)' }}
            />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#8B5CF6"
              strokeWidth={3}
              dot={{ fill: '#8B5CF6', r: 6, strokeWidth: 2 }}
              activeDot={{ r: 8, stroke: '#8B5CF6', strokeWidth: 2 }}
              name="Revenus"
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#EC4899"
              strokeWidth={3}
              dot={{ fill: '#EC4899', r: 6, strokeWidth: 2 }}
              activeDot={{ r: 8, stroke: '#EC4899', strokeWidth: 2 }}
              name="Dépenses"
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Pie Chart */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
      >
        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></span>
          Répartition des Dépenses
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}`}
              outerRadius={100}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              paddingAngle={2}
            >
              {pieData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {pieData.length > 0 && (
          <div className="mt-4 space-y-2">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-slate-300">{entry.name}</span>
                </div>
                <span className="text-foreground font-medium">{formatCurrency(entry.value)}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
