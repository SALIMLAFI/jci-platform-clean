'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Coins, 
  Receipt, 
  BarChart3, 
  ChevronLeft, 
  ChevronRight, 
  LogOut,
  Menu,
  X,
  Sparkles,
  Building2
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import jciLogo from '../jci_logo.png';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  href: string;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, href: '/', roles: ['treasurer', 'admin'] },
  { id: 'members', label: 'Membres', icon: Users, href: '/membres', roles: ['admin', 'member'] },
  { id: 'projects', label: 'Projets', icon: Building2, href: '/projets', roles: ['admin', 'director', 'treasurer'] },
  { id: 'contributions', label: 'Cotisations', icon: Coins, href: '/cotisations', roles: ['member', 'treasurer', 'admin', 'director'] },
  { id: 'expenses', label: 'Dépenses', icon: Receipt, href: '/depenses', roles: ['treasurer', 'director', 'admin'] },
  { id: 'reports', label: 'Rapports', icon: BarChart3, href: '/rapports', roles: ['treasurer', 'director', 'admin'] },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();

  console.log('[Sidebar] Rendering, user:', user);

  // Use user.photo from UserContext (single source of truth)
  const profileImage = user?.photo || '';

  const filteredItems = NAV_ITEMS.filter(item => 
    user && item.roles.includes(user.role)
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const sidebarVariants = {
    expanded: { width: '220px' },
    collapsed: { width: '70px' },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gradient-to-br from-brand-primary to-brand-primary-light rounded-lg text-white shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'fixed left-0 top-0 h-screen bg-gradient-to-b from-brand-primary-dark via-brand-primary to-brand-primary border-r border-border z-50 flex flex-col shadow-2xl',
          'hidden lg:flex'
        )}
      >
        {/* Logo / Brand */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 overflow-hidden rounded-xl border border-white/15 bg-background shadow-lg">
                <Image src={jciLogo} alt="JCI Ledger" className="h-full w-full object-cover" unoptimized />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-brand-teal-light bg-clip-text text-transparent">
                JCI Ledger
              </span>
            </motion.div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors text-foreground hover:text-brand-primary"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-6 px-3">
          <div className="space-y-2">
            {filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden',
                      isActive
                        ? 'bg-gradient-to-r from-brand-primary/20 to-brand-teal/20 text-foreground border border-brand-primary/30 shadow-lg shadow-brand-primary/10'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent'
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-gradient-to-r from-brand-primary/30 to-brand-teal/20"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <div className={cn(
                      'relative z-10 flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
                      isActive ? 'bg-brand-primary text-white' : 'bg-secondary group-hover:bg-secondary/80'
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {!isCollapsed && (
                      <span className="relative z-10 font-medium">{item.label}</span>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-border">
          {!isCollapsed && user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border"
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center text-white font-bold uppercase shadow-lg">
                  {user.name.substring(0, 2)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate capitalize">{user.role}</p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-screen w-72 bg-gradient-to-b from-brand-primary-dark via-brand-primary to-brand-primary border-r border-border z-50 flex flex-col shadow-2xl lg:hidden"
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 overflow-hidden rounded-xl border border-white/15 bg-background shadow-lg">
                  <Image src={jciLogo} alt="JCI Ledger" className="h-full w-full object-cover" unoptimized />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-white to-brand-teal-light bg-clip-text text-transparent">
                  JCI Ledger
                </span>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-6 px-3">
              <div className="space-y-2">
                {filteredItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300',
                        isActive
                          ? 'bg-gradient-to-r from-brand-primary/20 to-brand-teal/20 text-foreground border border-brand-primary/30'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      )}
                    >
                      <div className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
                        isActive ? 'bg-primary' : 'bg-secondary'
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="p-4 border-t border-border space-y-3">
              {user && (
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl border border-border">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold uppercase">
                    {user.name.substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate capitalize">{user.role}</p>
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-destructive hover:bg-destructive/10 hover:text-destructive/90 border border-transparent hover:border-destructive/30"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Déconnexion</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
