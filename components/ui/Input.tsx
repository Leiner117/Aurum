import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--color-foreground)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-10 w-full rounded-lg border px-3 text-sm",
            "bg-[var(--color-surface)] text-[var(--color-foreground)]",
            "border-[var(--color-border)] placeholder:text-[var(--color-muted-foreground)]",
            "transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-[var(--color-danger)] focus:ring-[var(--color-danger)]",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-[var(--color-danger)]">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-[var(--color-muted-foreground)]">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
