import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
