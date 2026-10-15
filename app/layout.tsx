import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Space_Grotesk,
  Instrument_Sans,
  JetBrains_Mono,
  Manrope,
  IBM_Plex_Mono,
} from "next/font/google";
import "blobatar/motion.css";
import "generative-loaders/styles.css";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeScript } from "@/components/theme/ThemeScript";

// Hub
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
// Poker
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });
// Retro
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const ibmPlex = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex",
});

const fontVars = [
  geist.variable,
  geistMono.variable,
  spaceGrotesk.variable,
  instrument.variable,
  jetbrains.variable,
  manrope.variable,
  ibmPlex.variable,
].join(" ");

export const metadata: Metadata = {
  title: "Spotflow Agile Tools",
  description: "Planning poker and sprint retros for the Spotflow team.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVars} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
