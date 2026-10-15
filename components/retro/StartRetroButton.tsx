"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, type ButtonSize } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/supabase/client";
import { retroApi } from "@/lib/retro/api";

/** Creates a board on the server and opens it straight away. No setup step. */
export function StartRetroButton({ size = "lg", label = "Start a new retro" }: { size?: ButtonSize; label?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [starting, setStarting] = useState(false);

  const start = async () => {
    setStarting(true);
    try {
      const slug = await retroApi.createBoard();
      router.push(`/retro/${slug}`);
    } catch (e) {
      toast.error(errorMessage(e));
      setStarting(false);
    }
  };

  return (
    <Button size={size} icon={<Plus />} arrow loading={starting} onClick={start}>
      {starting ? "Opening your board" : label}
    </Button>
  );
}
