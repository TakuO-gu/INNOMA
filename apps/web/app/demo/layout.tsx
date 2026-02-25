import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "INNOMA デモ",
  description:
    "INNOMAを体験しよう！情報探しタイムトライアルとイノマ工場見学",
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {children}
    </div>
  );
}
