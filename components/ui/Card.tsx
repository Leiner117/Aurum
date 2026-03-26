import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className }: CardProps) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--color-border)]",
        "bg-[var(--color-surface)] shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className }: CardHeaderProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-5 py-4",
        "border-b border-[var(--color-border)]",
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardBody = ({ children, className }: CardBodyProps) => {
  return (
    <div className={cn("px-5 py-4", className)}>
      {children}
    </div>
  );
};
