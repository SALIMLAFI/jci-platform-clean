'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('[DashboardLayout] useEffect, session status:', status);
    
    // Check NextAuth session first
    if (status === 'loading') {
      console.log('[DashboardLayout] Session loading, waiting...');
      return; // Wait for session to load
    }

    if (session) {
      console.log('[DashboardLayout] NextAuth session found:', session.user);
      setIsAuthenticated(true);
      
      // Sync NextAuth session with localStorage for component compatibility
      const userData = (session.user as any)?.userData;
      const apiToken = (session.user as any)?.apiToken;
      
      if (userData && apiToken) {
        localStorage.setItem('token', apiToken);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('[DashboardLayout] Synced NextAuth session to localStorage:', userData);
      }
    } else {
      console.log('[DashboardLayout] No NextAuth session, checking localStorage');
      // Fallback to localStorage token for regular login
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      console.log('[DashboardLayout] localStorage check:', {
        token: token ? 'present' : 'missing',
        user: userStr ? 'present' : 'missing'
      });
      
      if (!token) {
        console.log('[DashboardLayout] No token found, redirecting to login');
        router.push('/login');
      } else {
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            console.log('[DashboardLayout] Using localStorage for regular login:', userData);
          } catch (error) {
            console.error('[DashboardLayout] Error parsing user from localStorage:', error);
            localStorage.removeItem('user');
            router.push('/login');
            return;
          }
        }
        setIsAuthenticated(true);
      }
    }
  }, [session, status, router]);

  if (status === 'loading' || !isAuthenticated) return null;

  return (
    <div className="bg-background min-h-screen">
      <Sidebar />
      <Header sidebarWidth={220} />
      <main className="transition-all duration-300 md:ml-[220px] mt-[80px]">
        {children}
      </main>
    </div>
  );
}
