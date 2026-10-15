"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { Button, type ButtonSize, type ButtonVariant } from "./Button";
import { useToast } from "./Toast";

/** Copies text to the clipboard: its icon morphs to copy on hover, then to a check once copied. */
export function CopyButton({
  text,
  label = "Copy link",
  copiedLabel = "Copied",
  icon = <Link2 />,
  variant = "secondary",
  size = "sm",
}: {
  text: string;
  label?: string;
  icon?: React.ReactNode;
  copiedLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it manually.");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      icon={icon}
      hoverIcon={copied ? <Check /> : <Copy />}
      swapped={copied}
      onClick={copy}
    >
      {copied ? copiedLabel : label}
    </Button>
  );
}

/** Absolute URL for a path on the current site. */
export function siteUrl(path: string) {
  return typeof window === "undefined" ? path : `${window.location.origin}${path}`;
}
