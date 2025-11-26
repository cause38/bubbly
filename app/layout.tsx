import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { GlobalHeader } from "@/components/global-header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  // TODO: 실제 배포 도메인으로 변경하세요.
  metadataBase: new URL("https://bubbly.example.com"),
  title: {
    default: "Bubbly Q&A",
    template: "%s | Bubbly Q&A",
  },
  description: "실시간 Q&A 진행자 컨펌 기반 소통 플랫폼",
  openGraph: {
    title: "Bubbly Q&A",
    description: "실시간 Q&A 진행자 컨펌 기반 소통 플랫폼",
    url: "/",
    siteName: "Bubbly Q&A",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Bubbly Q&A 실시간 질문 소통 화면",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bubbly Q&A",
    description: "실시간 Q&A 진행자 컨펌 기반 소통 플랫폼",
    images: ["/og-image.svg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
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
