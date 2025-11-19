import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { GlobalHeader } from "@/components/global-header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bubbly Q&A",
  description: "실시간 Q&A 진행자 컨펌 기반 소통 플랫폼",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Providers>
          <GlobalHeader />
          <main className="py-4 h-[100svh] max-h-[calc(100svh-61px)] overflow-y-auto">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
