import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap"
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://proj-web-complaint.vercel.app"),
  title: {
    default: "Web Complaint",
    template: "%s | Web Complaint"
  },
  description: "Canal acolhedor para registrar e acompanhar denúncias escolares.",
  icons: {
    icon: "/img/logo.svg",
    shortcut: "/img/logo.svg",
    apple: "/img/logo.svg"
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Web Complaint",
    title: "Web Complaint",
    description: "Canal acolhedor para registrar e acompanhar denúncias escolares.",
    images: [{ url: "/img/logo.svg", width: 128, height: 128, alt: "Logo do Web Complaint" }]
  },
  twitter: {
    card: "summary",
    title: "Web Complaint",
    description: "Canal acolhedor para registrar e acompanhar denúncias escolares.",
    images: ["/img/logo.svg"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${outfit.variable} ${jetBrainsMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
