import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "매경 PR사업팀 콘텐츠 작성 에이전트",
  description: "보도자료 규정 점검 및 기사식광고 초안 작성 도구",
  icons: {
    icon: [
      { url: "/favicon.png?v=mk_m_v2", type: "image/png" },
      { url: "/favicon.ico?v=mk_m_v2", sizes: "any" },
    ],
    shortcut: "/favicon.ico?v=mk_m_v2",
    apple: "/favicon.png?v=mk_m_v2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-w-[1280px] min-h-screen bg-surface-subtle text-ink">
        {children}
      </body>
    </html>
  );
}
