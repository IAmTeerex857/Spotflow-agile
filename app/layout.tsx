import type { Metadata, Viewport } from "next";
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
import { SITE_NAME, SITE_URL, shareTags, themeColors } from "@/lib/site";

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

const description =
  "Planning poker and anonymous sprint retros for the Spotflow team. Open a session, share the link, and everyone is in. Nobody has to sign up.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description,
  applicationName: SITE_NAME,
  ...shareTags({ title: SITE_NAME, description, path: "/" }),
};

export const viewport: Viewport = { themeColor: themeColors("#ffffff", "#000000") };

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
