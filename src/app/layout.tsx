/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * E a MOLDURA de todas as paginas do site. Tudo que aparece na tela fica
 * dentro dele.
 *
 * Aqui sao definidos: o idioma da pagina (portugues do Brasil), as fontes
 * usadas e o titulo que aparece na aba do navegador e nos resultados de
 * busca. O bloco openGraph e o que gera a previa bonita quando alguem
 * compartilha o link no WhatsApp.
 *
 * Para a apresentacao: e a capa comum a todas as telas.
 */

import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";

// BLOCO 1 - As tres fontes do sistema.
//   Inter          -> os textos em geral.
//   Outfit         -> os titulos.
//   JetBrains Mono -> os protocolos, por ter largura fixa em cada caractere.
// O "display: swap" mostra o texto com uma fonte comum enquanto a definitiva
// carrega. Assim a pagina nunca aparece em branco em uma internet lenta.
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

// BLOCO 2 - A "identidade" do site.
// O "template" faz cada pagina virar algo como "Fazer denúncia | Web Complaint"
// na aba do navegador.
// Os blocos openGraph e twitter geram a previa com titulo, descricao e imagem
// quando alguem compartilha o link no WhatsApp ou em uma rede social.
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
    // BLOCO 3 - A estrutura basica da pagina.
    // O lang="pt-BR" nao e detalhe: e ele que faz o leitor de tela pronunciar
    // o conteudo em portugues, e nao com sotaque de outro idioma.
    // O {children} e o lugar onde cada tela do site e encaixada.
    <html lang="pt-BR">
      <body className={`${inter.variable} ${outfit.variable} ${jetBrainsMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
