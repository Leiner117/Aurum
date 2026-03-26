import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-[3px]",
};

export const Spinner = ({ size = "md", className }: SpinnerProps) => (
  <div
    className={cn(
      "animate-spin rounded-full",
      "border-[var(--color-border)] border-t-[var(--color-primary)]",
      SIZE_CLASSES[size],
      className
    )}
  />
);

interface PageSpinnerProps {
  className?: string;
}

export const PageSpinner = ({ className }: PageSpinnerProps) => (
  <div className={cn("flex flex-1 items-center justify-center py-24", className)}>
    <Spinner size="lg" />
  </div>
);
