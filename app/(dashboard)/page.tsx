import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/Skeleton";

// Dashboard overview — charts and summaries will be added in Phase 4
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's your financial overview."
      />

      {/* Summary cards placeholder */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardBody className="h-64 flex items-center justify-center text-[var(--color-muted-foreground)] text-sm">
            Spending by category — coming in Phase 4
          </CardBody>
        </Card>
        <Card>
          <CardBody className="h-64 flex items-center justify-center text-[var(--color-muted-foreground)] text-sm">
            Monthly trend — coming in Phase 4
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
