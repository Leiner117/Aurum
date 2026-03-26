import { cn } from "@/lib/utils";
import { type SelectHTMLAttributes, forwardRef } from "react";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-[var(--color-foreground)]"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "h-10 w-full rounded-lg border px-3 text-sm",
            "bg-[var(--color-surface)] text-[var(--color-foreground)]",
            "border-[var(--color-border)]",
            "transition-colors duration-150 cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-[var(--color-danger)]",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-xs text-[var(--color-danger)]">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
