import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BoiControl — Gestão de Gado de Corte",
  description: "Aplicativo completo para gestão de gado de corte: controle de animais, saúde, reprodução, alimentação, peso e financeiro.",
  keywords: ["pecuária", "gado de corte", "gestão rural", "fazenda", "bovinocultura", "controle de rebanho"],
  authors: [{ name: "BoiControl" }],
  icons: {
    icon: "🥩",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BoiControl",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1f7a3f" },
    { media: "(prefers-color-scheme: dark)", color: "#0d2818" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} antialiased bg-background text-foreground overscroll-none`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
