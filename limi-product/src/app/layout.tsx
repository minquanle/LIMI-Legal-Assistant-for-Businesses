import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LIMI Product",
  description: "LIMI — Legal Intelligence, Monitoring & Insights",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
