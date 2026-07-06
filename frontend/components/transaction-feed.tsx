'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/apiClient';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Transaction {
  id: string;
  type: 'contribution' | 'expense';
  amount: number;
  date: string;
  description: string;
  status: string;
}

export function TransactionFeed() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [contributionsData, expensesData] = await Promise.all([
          fetchApi('/contributions').catch(() => ({ contributions: [] })),
          fetchApi('/expenses').catch(() => ({ expenses: [] }))
        ]);

        const mappedContributions = (contributionsData.contributions || []).map((c: any) => ({
          id: c._id,
          type: 'contribution',
          amount: c.amount,
          date: c.createdAt,
          description: `Cotisation de ${c.userId?.name || 'Membre'}`,
          status: c.status
        }));

        const mappedExpenses = (expensesData.expenses || []).map((e: any) => ({
          id: e._id,
          type: 'expense',
          amount: -Math.abs(e.amount),
          date: e.date || e.createdAt,
          description: e.description,
          status: 'approved' // Par défaut on affiche approved
        }));

        const allTransactions = [...mappedContributions, ...mappedExpenses]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10);

        setTransactions(allTransactions);
      } catch (error) {
        console.error('Erreur', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="p-4">Chargement des transactions...</div>;

  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Dernières Transactions</h3>
      {transactions.length === 0 ? (
        <p className="text-muted-foreground text-sm">Aucune transaction trouvée.</p>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-lg transition-colors">
              <div>
                <p className="font-medium">{tx.description}</p>
                <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString('fr-TN')}</p>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount} TND
                </p>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1 bg-muted rounded-full">
                  {tx.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function QuickActions() {
  const [contribOpen, setContribOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Forms state
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file) throw new Error("Le justificatif est obligatoire.");
    const formData = new FormData();
    formData.append('file', file);
    
    // Upload via API Client using FormData
    const response = await fetchApi('/upload', {
      method: 'POST',
      body: formData,
    });
    return response.url;
  };

  const handlePayContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const proofUrl = await handleUpload();
      await fetchApi('/contributions', {
        method: 'POST',
        body: JSON.stringify({ amount: Number(amount), proof: proofUrl }),
      });
      setContribOpen(false);
      window.location.reload(); 
    } catch (error) {
      alert("Erreur lors de la soumission de la cotisation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-4">
      {/* PAYER COTISATION DIALOG */}
      <Button
        variant="secondary"
        onClick={() => setContribOpen(true)}
        className="h-12 rounded-xl border border-border bg-card px-5 text-foreground shadow-sm transition-all hover:border-brand-primary/30 hover:bg-secondary"
      >
        Payer ma cotisation
      </Button>
      <Dialog open={contribOpen} onOpenChange={setContribOpen}>
        <DialogContent className="bg-card/98 max-w-2xl overflow-hidden border-border p-0 shadow-2xl backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Payer ma cotisation</DialogTitle>
          </DialogHeader>
          <div className="bg-gradient-to-r from-brand-primary/10 via-brand-primary/5 to-brand-teal/10 border-b border-border px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-lg shadow-brand-primary/20">
                <span className="text-lg font-bold">$</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">Cotisation membre</p>
                <h3 className="mt-1 text-xl font-semibold text-foreground">Soumettre un paiement</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Saisissez le montant exact et joignez un justificatif clair pour validation par le trésorier.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handlePayContribution} className="space-y-6 px-6 py-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Montant payé (TND)</Label>
              <Input
                type="text"
                inputMode="decimal"
                pattern="^[0-9]+([.,][0-9]{1,2})?$"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Ex: 125 ou 125,50"
                className="h-12 rounded-xl border-2 border-border bg-background px-4 text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Justificatif de paiement</Label>
              <Input
                type="file"
                required
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="h-12 rounded-xl border-2 border-border bg-background px-4 text-foreground outline-none transition-all file:mr-4 file:rounded-lg file:border-0 file:bg-brand-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-primary hover:file:bg-brand-primary/15 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
              />
              <p className="text-xs text-muted-foreground">
                Formats acceptés: reçu bancaire, capture de virement ou document PDF lisible.
              </p>
            </div>

            <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-3 text-sm text-muted-foreground">
              Le paiement sera enregistré comme <span className="font-medium text-foreground">en attente</span> jusqu’à validation.
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setContribOpen(false)}
                className="h-12 rounded-xl border-border px-5 text-foreground hover:bg-secondary"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-12 rounded-xl bg-gradient-to-r from-brand-primary to-brand-primary-light px-6 text-white shadow-lg shadow-brand-primary/20 transition-all hover:from-brand-primary-dark hover:to-brand-primary"
              >
                {loading ? 'Soumission en cours...' : 'Soumettre le paiement'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
