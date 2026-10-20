import type { Metadata } from 'next';
import { Bricolage_Grotesque, DM_Sans, DM_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/lib/toast-context';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SnapPresent — Face-Recognition Attendance System',
  description: 'Soft snapshot face-recognition attendance for modern classrooms and campuses. Quick 5-frame enrollment, real-time live presence scanning, and zero hassle.',
  icons: {
    icon: '/AMS.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bricolage.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body className="min-h-screen bg-[#FBF9FF] text-[#2B2A3A] font-sans antialiased selection:bg-[#C9B6F2] selection:text-[#2B2A3A]">
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
