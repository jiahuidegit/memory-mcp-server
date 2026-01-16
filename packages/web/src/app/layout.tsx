import type { Metadata } from 'next';
import { Poppins, Open_Sans } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

// 字体配置 - Modern Professional
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-open-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Context Memory System',
  description: '精准、结构化的 AI 上下文记忆系统',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${poppins.variable} ${openSans.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
