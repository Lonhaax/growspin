import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MockBet — Virtual Casino",
  description: "A provably fair virtual casino simulator. No real money involved.",
};

import { WalletProvider } from "@/context/WalletContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AuthModal } from "@/components/auth/AuthModal";
import { ChatSidebar } from "@/components/layout/ChatSidebar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full flex bg-bg-primary text-white overflow-hidden">
        <AuthProvider>
          <WalletProvider>
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <Topbar />
              <main className="flex-1 overflow-y-auto bg-bg-primary p-4">
                {children}
              </main>
            </div>
            <AuthModal />
            <ChatSidebar />
          </WalletProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
