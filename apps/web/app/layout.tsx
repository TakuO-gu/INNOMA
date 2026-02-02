import "./globals.css";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "INNOMA",
  description: "INNOMA web",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen flex flex-col">
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
