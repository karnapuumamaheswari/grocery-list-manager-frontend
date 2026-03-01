import { useMemo } from "react";
import { AlertTriangle, Package, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { PantryItem, MonthlySummary } from "@/types/app";
import { cn } from "@/lib/utils";

interface DashboardProps {
  pantryItems: PantryItem[];
  summary: MonthlySummary | null;
}

function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function Dashboard({ pantryItems, summary }: DashboardProps) {
  const currentMonth = Number(summary?.current_month_total ?? 0);

  const expiringCount = useMemo(() => {
    return pantryItems.filter(
      (item) => item.status === "Expiring Soon" || item.status === "Expired",
    ).length;
  }, [pantryItems]);

  const stats = [
    {
      title: "Pantry Items",
      value: pantryItems.length,
      icon: Package,
      color: "text-success",
      bgColor: "bg-success/15",
    },
    {
      title: "This Month Spending",
      value: formatINR(currentMonth),
      icon: Wallet,
      color: "text-primary",
      bgColor: "bg-primary/15",
    },
    {
      title: "Expiring Soon",
      value: expiringCount,
      icon: AlertTriangle,
      color: "text-warning",
      bgColor: "bg-warning/15",
      warning: expiringCount > 0,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quick overview of pantry health and monthly spend.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className={cn(
                "h-full rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-colors hover:border-primary/35",
                stat.warning && "border-warning/40"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{stat.value}</p>
                </div>
                <div className={cn("rounded-xl p-2", stat.bgColor)}>
                  <Icon className={cn("h-5 w-5", stat.color)} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
