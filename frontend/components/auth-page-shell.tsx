'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import jciLogo from '../jci_logo.png';

type Highlight = {
  icon: ReactNode;
  title: string;
  description: string;
  accentClass: string;
};

type AuthPageShellProps = {
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  highlights: Highlight[];
  children: ReactNode;
};

export function AuthPageShell({ title, subtitle, description, badge, highlights, children }: AuthPageShellProps) {
  return (
    <div className="min-h-screen relative overflow-x-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(31,71,137,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(87,188,188,0.14),transparent_24%),linear-gradient(135deg,rgba(247,249,252,1)_0%,rgba(232,237,245,0.92)_100%)]" />
      <div className="absolute -top-24 left-0 h-72 w-72 rounded-full bg-brand-primary/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-brand-teal/10 blur-3xl" />
      <div className="absolute top-1/3 right-1/4 h-32 w-32 rounded-full bg-brand-gold/10 blur-2xl" />

      <div className="relative z-10 flex min-h-screen px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl items-start pt-6 lg:pt-10">
          <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            <motion.aside
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col justify-center lg:pr-2"
            >
              <div className="mb-5 inline-flex items-center gap-3 self-start rounded-full border border-brand-primary/20 bg-card/80 px-4 py-2 shadow-sm backdrop-blur">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-brand-primary/15 bg-background shadow-lg shadow-brand-primary/20">
                  <Image src={jciLogo} alt="JCI Ledger" className="h-full w-full object-cover" unoptimized />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{badge}</p>
                  <p className="text-sm font-semibold text-foreground">JCI Ledger</p>
                </div>
              </div>

              <div className="max-w-xl space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-primary">{subtitle}</p>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
                  {title}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                  {description}
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {highlights.map((highlight) => (
                  <motion.div
                    key={highlight.title}
                    whileHover={{ y: -3 }}
                    className="rounded-2xl border border-border bg-card/85 p-3 shadow-lg shadow-slate-900/5 backdrop-blur sm:p-4"
                  >
                    <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${highlight.accentClass} text-white shadow-md`}>
                      {highlight.icon}
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{highlight.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">{highlight.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.aside>

            <motion.section
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="flex items-center justify-center pb-2 lg:pb-0"
            >
              <div className="w-full max-w-xl rounded-[2rem] border border-border bg-card/95 p-5 shadow-[0_24px_80px_rgba(15,29,51,0.12)] backdrop-blur-xl sm:p-6 lg:p-8">
                {children}
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
}
