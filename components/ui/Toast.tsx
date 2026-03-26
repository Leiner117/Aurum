"use client";

import { cn } from "@/lib/utils";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  variant: ToastVariant;
  onClose: () => void;
}

const variantConfig: Record<
  ToastVariant,
  { icon: React.ReactNode; className: string }
> = {
  success: {
    icon: <CheckCircle className="h-4 w-4 text-green-500" />,
    className: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
  },
  error: {
    icon: <AlertCircle className="h-4 w-4 text-red-500" />,
    className: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    className: "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950",
  },
  info: {
    icon: <Info className="h-4 w-4 text-blue-500" />,
    className: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
  },
};

export const Toast = ({ message, variant, onClose }: ToastProps) => {
  const { icon, className } = variantConfig[variant];

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 shadow-md",
        "min-w-[280px] max-w-sm",
        "animate-in slide-in-from-right-full duration-300",
        className
      )}
      role="alert"
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <p className="flex-1 text-sm text-[var(--color-foreground)]">{message}</p>
      <button
        onClick={onClose}
        className="shrink-0 rounded p-0.5 hover:opacity-70 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
      </button>
    </div>
  );
};
