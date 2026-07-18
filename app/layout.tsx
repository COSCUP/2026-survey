import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: "COSCUP × UbuCon Asia 2026｜報名者快照",
    description: "從報名節奏、社群輪廓、開源角色、AI 使用到議程興趣，看見 COSCUP 2026 參與者樣貌。",
    icons: {
      icon: "/favicon.png",
      shortcut: "/favicon.png",
    },
    openGraph: {
      title: "COSCUP × UbuCon Asia 2026｜報名者快照",
      description: "從 98 筆報名，看見今年的開源海岸線。",
      type: "website",
      locale: "zh_TW",
      images: [
        {
          url: `${origin}/og.png`,
          width: 1536,
          height: 1024,
          alt: "COSCUP × UbuCon Asia 2026 報名者快照",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "COSCUP × UbuCon Asia 2026｜報名者快照",
      description: "從 98 筆報名，看見今年的開源海岸線。",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
