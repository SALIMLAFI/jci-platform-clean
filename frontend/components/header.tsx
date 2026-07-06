'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Calendar, LogOut, User, Settings } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import jciLogo from '../jci_logo.png';

interface HeaderProps {
  sidebarWidth: number;
}

export function Header({ sidebarWidth }: HeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { user } = useUser();

  console.log('[Header] Rendering, user:', user, 'session:', session);

  // Use user.photo from UserContext (single source of truth)
  const profileImage = user?.photo || '';

  const handleLogout = async () => {
    try {
      // Call logout API to clear HTTP-only cookie
      await fetch('/api/auth', { method: 'DELETE' });
    } catch (error) {
      console.error('Logout API error:', error);
    }
    
    // Sign out from NextAuth if session exists
    if (session) {
      await signOut({ callbackUrl: '/login' });
    }
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <header
      className="fixed top-0 right-0 bg-gradient-to-r from-primary/95 via-accent/90 to-primary/95 backdrop-blur-xl border-b border-border shadow-2xl z-40 transition-all duration-300"
      style={{
        left: `${sidebarWidth}px`,
      }}
    >
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex-1">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
          >
            <span className="inline-flex h-10 w-10 overflow-hidden rounded-xl border border-primary/15 bg-background shadow-sm shadow-primary/15 bg-clip-border">
              <Image src={jciLogo} alt="JCI Ledger" className="h-full w-full object-cover" unoptimized />
            </span>
            Espace Financier
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-muted-foreground"
          >
            Bienvenue sur JCI Ledger
          </motion.p>
        </div>

        <div className="flex items-center gap-4">
          {/* Date */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-xl"
          >
            <Calendar className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-foreground">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </motion.div>

          {/* User Menu & Logout */}
          <div className="flex items-center gap-3 pl-4 border-l border-border">
            {user && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden sm:flex items-center gap-3"
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
              </motion.div>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/profile')}
              className="p-3 rounded-xl bg-secondary border border-border hover:bg-accent/20 transition-colors"
              aria-label="Profile"
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-destructive/20 border border-destructive/30 rounded-xl text-destructive hover:bg-destructive/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Déconnexion</span>
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
}
