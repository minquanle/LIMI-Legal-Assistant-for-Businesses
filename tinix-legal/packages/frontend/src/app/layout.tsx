import type { Metadata } from 'next';
import { Inter, Geist } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ThemeProvider } from '@/context/ThemeContext';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { VoiceAssistantModal } from '@/components/copilot/VoiceAssistantModal';
import ChatWidget from '@/components/chat/ChatWidget';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Hệ thống Tra cứu Văn bản Pháp luật & Trợ lý Enterprise AI',
  description:
    'Tra cứu, tìm kiếm, soạn thảo và quản lý hợp đồng pháp lý doanh nghiệp với AI Copilot.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${geist.variable}`}>
      <body className={`${inter.className} min-h-screen flex flex-col bg-[#F0F2F5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[1000] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[#0B1D51] focus:text-white focus:text-sm focus:font-semibold focus:shadow-lg"
        >
          Bỏ qua tới nội dung chính
        </a>
        <ThemeProvider>
          <Header />
          <main id="main-content" className="flex-1">{children}</main>
          <Footer />
          <CommandPalette />
          <VoiceAssistantModal />
          <ChatWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}
