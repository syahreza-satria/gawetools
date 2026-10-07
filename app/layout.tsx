import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MotionProvider } from "@/components/motion";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0ea5e9",
};

export const metadata: Metadata = {
  title: "GaweTools",
  description: "Gabung, potong, kompres, dan kunci PDF secara instan langsung di browser Anda tanpa upload ke server. Aman, cepat, dan 100% gratis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('theme');
                if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-100 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 font-sans transition-colors duration-150">
        <ServiceWorkerRegister />
        <Navbar />
        <main className="flex flex-col flex-1">
          <MotionProvider>{children}</MotionProvider>
        </main>
        <Footer />
      </body>
    </html>
  );
}
