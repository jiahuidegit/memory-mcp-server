'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, Clock, Network, Search, Menu, X, Sparkles, FolderTree } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { ProjectSelector } from './ProjectSelector';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: '记忆管理', href: '/memories', icon: Brain },
  { name: '时间线', href: '/timeline', icon: Clock },
  { name: '关系链', href: '/relations', icon: Network },
  { name: '项目组', href: '/project-groups', icon: FolderTree },
  { name: '搜索', href: '/search', icon: Search },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleNavClick() {
    setMobileMenuOpen(false);
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* 背景模糊层 */}
      <div className="absolute inset-0 glassDark" />

      {/* 渐变光线效果 */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-lg blur-lg group-hover:bg-blue-500/30 transition-all duration-300" />
              <div className="relative p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20">
                <Brain className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-lg leading-tight textGradient">
                Context Memory
              </span>
              <span className="text-[10px] text-muted-foreground leading-none">
                AI 记忆系统
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {/* 项目选择器 */}
            <ProjectSelector />

            {/* 分隔线 */}
            <div className="w-px h-6 bg-border/50 mx-2" />

            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer group',
                    isActive
                      ? 'text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {/* 激活状态背景 */}
                  {isActive && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg" />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg blur-lg opacity-50" />
                    </>
                  )}

                  {/* 悬停背景 */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-foreground/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}

                  <Icon className="relative w-4 h-4" />
                  <span className="relative">{item.name}</span>
                </Link>
              );
            })}

            {/* 分隔线 */}
            <div className="w-px h-6 bg-border/50 mx-2" />

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg glassDark hover:bg-foreground/10 transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/30 animate-slide-down">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      'relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer',
                      isActive
                        ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/10 text-blue-600 dark:text-blue-400 border-l-2 border-blue-500'
                        : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                    {isActive && (
                      <Sparkles className="w-3 h-3 ml-auto text-blue-400" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
