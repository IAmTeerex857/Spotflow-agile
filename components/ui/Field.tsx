export const fieldClass =
  "w-full rounded-[10px] border border-border-strong bg-surface-2 px-3.5 py-2.5 text-sm text-text outline-none transition-colors placeholder:text-text-3 focus:border-accent";

export function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-text-2">
      {children}
    </label>
  );
}

export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldClass} ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldClass} resize-y ${className}`} {...props} />;
}
