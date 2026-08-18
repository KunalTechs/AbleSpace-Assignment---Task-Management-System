'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, User, Sun, Palette, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [navSearch, setNavSearch] = useState('');

  const navItems = [
    { name: 'Profile', href: '/settings/profile', icon: User },
    { name: 'Theme', href: '/settings/theme', icon: Sun },
    { name: 'Color', href: '/settings/color', icon: Palette },
  ];

  const filteredNav = navItems.filter((item) =>
    item.name.toLowerCase().includes(navSearch.toLowerCase())
  );

  return (
    <div className="flex flex-1 min-h-screen bg-white dark:bg-zinc-950">
      {/* Settings Navigation Sidebar matching Figma */}
      <aside className="w-64 border-r border-zinc-200/80 dark:border-zinc-800 p-6 space-y-6 select-none bg-white dark:bg-zinc-950 shrink-0">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to app</span>
        </Link>

        {/* Sidebar Navigation Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            placeholder="Search"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50/80 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:ring-1 focus:ring-primary text-zinc-800 dark:text-zinc-200"
          />
        </div>

        <nav className="space-y-1">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition',
                  active
                    ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold'
                    : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-800 dark:hover:text-zinc-200'
                )}
              >
                <Icon className="w-4 h-4 text-zinc-400" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Settings Canvas */}
      <main className="flex-1 p-10 md:p-14 overflow-y-auto max-w-4xl">
        {children}
      </main>
    </div>
  );
}