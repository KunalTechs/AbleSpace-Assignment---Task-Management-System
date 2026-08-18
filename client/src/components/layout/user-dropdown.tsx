'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sun, Moon, Settings, Check, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';
import { useThemeCustom } from '@/components/providers/theme-provider';
import { useUser } from '@/components/providers/user-provider';
import { COLOR_ACCENTS } from '@/lib/constants';

export function UserDropdown() {
  const { theme, color, setTheme, setColor } = useThemeCustom();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fullName = mounted && user?.fullName ? user.fullName : 'Dexter';
  const email = mounted && user?.email ? user.email : 'dexter@gmail.com';
  const avatarUrl = mounted && user?.avatarUrl ? user.avatarUrl : '';
  const initial = fullName ? fullName[0].toUpperCase() : 'D';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition text-left outline-none">
          <div className="flex items-center gap-3 overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-7 h-7 rounded-full object-cover shrink-0 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                {initial}
              </div>
            )}
            <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 truncate">
              {fullName}
            </span>
          </div>
          <span className="text-zinc-400 text-xs shrink-0">▼</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-64 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-3 z-50 animate-in fade-in-50"
      >
        <div className="flex flex-col items-center pb-3 border-b border-zinc-100 dark:border-zinc-800 text-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName}
              className="w-12 h-12 rounded-full object-cover mb-2 shadow ring-2 ring-zinc-100 dark:ring-zinc-800"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center font-bold text-lg mb-2 shadow">
              {initial}
            </div>
          )}
          <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate w-full px-2">
            {fullName}
          </p>
          <p className="text-xs text-zinc-500 truncate w-full px-2">{email}</p>
        </div>

        <div className="py-2 space-y-1">
          {/* Theme Switcher */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center justify-between w-full px-2.5 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg outline-none cursor-pointer">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4" />
                <span>Change Theme</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-36 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 p-1 z-50">
              <DropdownMenuItem
                onClick={() => setTheme('light')}
                className="flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none"
              >
                <span className="flex items-center gap-2"><Sun className="w-3.5 h-3.5" /> Light</span>
                {theme === 'light' && <Check className="w-3.5 h-3.5 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme('dark')}
                className="flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none"
              >
                <span className="flex items-center gap-2"><Moon className="w-3.5 h-3.5" /> Dark</span>
                {theme === 'dark' && <Check className="w-3.5 h-3.5 text-primary" />}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Color Mode */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center justify-between w-full px-2.5 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg outline-none cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-primary" />
                <span>Color Mode</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-44 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 p-1 z-50">
              {COLOR_ACCENTS.map((c) => (
                <DropdownMenuItem
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className="flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer outline-none"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${c.bgClass}`} />
                    <span>{c.name}</span>
                  </div>
                  {color === c.value && <Check className="w-3.5 h-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Settings Link */}
          <DropdownMenuItem asChild>
            <Link
              href="/settings/profile"
              className="flex items-center gap-2 px-2.5 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg outline-none cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}