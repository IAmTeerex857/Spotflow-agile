import type { Metadata, Viewport } from "next";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://agile.spotflow.one";
export const SITE_NAME = "Spotflow Agile Tools";

/**
 * Link-preview tags for Slack, WhatsApp, X and the like. Next replaces these
 * objects per route segment instead of merging them, so each section passes
 * its full set. The preview image itself comes from the nearest
 * `opengraph-image.png` file.
 */
export function shareTags({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: { type: "website", siteName: SITE_NAME, url: path, title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** Browser chrome colour, matched to each section's page background. */
export function themeColors(light: string, dark: string): Viewport["themeColor"] {
  return [
    { media: "(prefers-color-scheme: light)", color: light },
    { media: "(prefers-color-scheme: dark)", color: dark },
  ];
}

/** Rooms and boards are private links, so search engines shouldn't list them. */
export const unlisted: Metadata["robots"] = { index: false, follow: false };
