'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { KPICards } from '@/components/kpi-cards';
import { Charts } from '@/components/charts';
import { TransactionFeed, QuickActions } from '@/components/transaction-feed';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [checkedRole, setCheckedRole] = useState(false);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    const sessionRole = (session?.user as any)?.role;
    let localRole = '';

    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          localRole = JSON.parse(storedUser)?.role || '';
        }
      } catch {
        localRole = '';
      }
    }

    const role = sessionRole || localRole;

    if (role === 'member') {
      router.replace('/membres');
      return;
    }

    setCheckedRole(true);
  }, [router, session, status]);

  if (!checkedRole && status !== 'loading') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <section className="mb-8">
          <KPICards />
        </section>

        <section className="mb-8">
          <Charts />
        </section>

        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">Actions Rapides</h2>
          </div>
          <QuickActions />
        </section>

        <section>
          <TransactionFeed />
        </section>
      </div>
    </DashboardLayout>
  );
}
