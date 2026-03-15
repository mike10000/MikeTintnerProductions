import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "600", "800"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Mike Tintner Productions | High-Performance Web Design",
  description:
    "We build high-performance digital experiences engineered to turn visitors into loyal customers. Specialized for environmental pioneers, non-profits, and sustainable businesses.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
