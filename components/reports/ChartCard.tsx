import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  isLoading?: boolean;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const ChartCard = ({ title, isLoading, children, action, className }: ChartCardProps) => {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{title}</h3>
        {action}
      </CardHeader>
      <CardBody className="flex-1">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          children
        )}
      </CardBody>
    </Card>
  );
};
