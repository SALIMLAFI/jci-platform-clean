'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  photo?: string;
  createdAt?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const hasHydratedRef = useRef(false);

  const loadUserFromStorage = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const localUser = JSON.parse(userStr);
        console.log('[UserContext] Loaded user from localStorage:', localUser);
        setUser(localUser);
      } catch (error) {
        console.error('[UserContext] Error parsing user from localStorage:', error);
        localStorage.removeItem('user');
      }
    } else {
      console.log('[UserContext] No user found in localStorage');
    }
  };

  useEffect(() => {
    console.log('[UserContext] Initializing, session status:', status);
    
    // Check NextAuth session first
    if (status === 'loading') {
      console.log('[UserContext] Session loading, waiting...');
      return;
    }

    if (session?.user) {
      const userData = (session.user as any)?.userData;
      console.log('[UserContext] NextAuth session found, userData:', userData);
      
      if (userData) {
        setUser(userData);
        // Sync to localStorage for regular login compatibility
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('[UserContext] Synced NextAuth userData to localStorage');
        hasHydratedRef.current = true;
        setLoading(false);
        return;
      }
    }

    console.log('[UserContext] No NextAuth session, checking localStorage');
    // Fallback to localStorage for regular login
    loadUserFromStorage();
    hasHydratedRef.current = true;
    setLoading(false);
  }, [session, status]);

  // Also reload from localStorage when component mounts (for regular login)
  useEffect(() => {
    if (status === 'unauthenticated') {
      console.log('[UserContext] No NextAuth session, loading from localStorage on mount');
      loadUserFromStorage();
    }
  }, [status]);

  // Sync user changes to localStorage
  useEffect(() => {
    if (!hasHydratedRef.current) {
      return;
    }

    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      console.log('[UserContext] Synced user to localStorage:', user);
    } else {
      localStorage.removeItem('user');
      console.log('[UserContext] Removed user from localStorage');
    }
  }, [user]);

  const updateUser = (updates: Partial<User>) => {
    console.log('[UserContext] updateUser called with:', updates);
    setUser(prev => {
      const updated = prev ? { ...prev, ...updates } : null;
      console.log('[UserContext] User updated to:', updated);
      return updated;
    });
  };

  const refreshUser = async () => {
    console.log('[UserContext] refreshUser called');
    loadUserFromStorage();
  };

  return (
    <UserContext.Provider value={{ user, setUser, updateUser, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
