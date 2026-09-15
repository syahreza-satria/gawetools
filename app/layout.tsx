import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "GaweTools - Alat Utilitas File PDF Online Cepat & Aman",
  description: "Gabung dan pisah PDF secara instan langsung di browser Anda tanpa upload ke server. Aman, cepat, dan 100% gratis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800 font-sans">
        <Navbar />
        <main className="flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
