import type { Metadata } from "next";
import { Anton, Cormorant_Garamond, Inter } from "next/font/google";
import { Footer } from "@/components/Footer";
import { GoldCursor } from "@/components/GoldCursor";
import { IntroLoader } from "@/components/IntroLoader";
import { Nav } from "@/components/Nav";
import { PageTransition } from "@/components/PageTransition";
import { Providers } from "@/components/Providers";
import { site } from "@/data/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "TRUE", template: "%s — TRUE" },
  description: site.slogan,
  icons: { icon: "/logos/logo-horizon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${inter.variable} ${cormorant.variable} ${anton.variable}`} data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem("true-theme")==="light")document.documentElement.dataset.theme="light"}catch(e){}})()`,
          }}
        />
      </head>
      <body className="bg-ink font-sans text-bone antialiased">
        <Providers>
          <GoldCursor />
          <Nav />
          <IntroLoader />
          <PageTransition />
          <div id="contenu">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
