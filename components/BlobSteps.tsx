"use client";

import { Blobatar } from "@blobatar/react";
import { useGaze } from "@blobatar/react/gaze";
import { motion } from "motion/react";
import "blobatar/gaze.css";

export type BlobStep = { seed: string; title: string; body: React.ReactNode };

/** Numbered steps, each fronted by a large blob whose eyes follow the pointer. */
export function BlobSteps({ steps }: { steps: BlobStep[] }) {
  return (
    <ol className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${steps.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
      {steps.map((step, i) => (
        <motion.li
          key={step.seed}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring", stiffness: 260, damping: 26, delay: i * 0.08 }}
          className="flex flex-col rounded-[20px] border border-border bg-surface p-6 shadow-sm-t"
        >
          <div className="mb-5 flex items-start justify-between">
            <GazingBlob seed={step.seed} />
            <span className="mono text-xs text-text-3">0{i + 1}</span>
          </div>
          <div className="mb-1.5 text-[16px] font-semibold tracking-[-0.01em]">{step.title}</div>
          <div className="text-sm leading-relaxed text-text-2">{step.body}</div>
        </motion.li>
      ))}
    </ol>
  );
}

function GazingBlob({ seed }: { seed: string }) {
  const { ref } = useGaze({ travel: 3, lookAt: "pointer" });
  return <Blobatar ref={ref} name={seed} size={72} background="squircle" animate="always" />;
}
