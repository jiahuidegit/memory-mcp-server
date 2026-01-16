'use client';

import { Navbar } from '@/components/Navbar';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main Content - 留出 Navbar 空间 */}
      <main className="pt-24 px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
