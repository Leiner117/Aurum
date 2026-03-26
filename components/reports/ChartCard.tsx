import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface ChartCardProps {
  title: string;
  isLoading?: boolean;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export const ChartCard = ({ title, isLoading, children, action }: ChartCardProps) => {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{title}</h3>
        {action}
      </CardHeader>
      <CardBody>
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
