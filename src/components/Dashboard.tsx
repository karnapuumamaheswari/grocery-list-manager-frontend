import { useMemo } from "react";
import { AlertTriangle, Clock3, Package, Sparkles, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { GroceryItem, PantryItem, MonthlySummary } from "@/types/app";
import { cn } from "@/lib/utils";

interface DashboardProps {
  groceryItems: GroceryItem[];
  pantryItems: PantryItem[];
  summary: MonthlySummary | null;
  checkedCount: number;
  shoppingSnapshotAt?: string | null;
}

function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function Dashboard({
  groceryItems,
  pantryItems,
  summary,
  checkedCount,
  shoppingSnapshotAt,
}: DashboardProps) {
  const currentMonth = Number(summary?.current_month_total ?? 0);
  const previousMonth = Number(summary?.previous_month_total ?? 0);

  const expiringCount = useMemo(() => {
    return pantryItems.filter(
      (item) => item.status === "Expiring Soon" || item.status === "Expired",
    ).length;
  }, [pantryItems]);

  const expiringPreview = useMemo(
    () =>
      pantryItems
        .filter((item) => item.status === "Expiring Soon" || item.status === "Expired")
        .sort((a, b) => Number(a.days_remaining ?? 9999) - Number(b.days_remaining ?? 9999))
        .slice(0, 4),
    [pantryItems],
  );

  const budgetProgress = useMemo(() => {
    if (previousMonth <= 0) return 35;
    const progress = (currentMonth / previousMonth) * 100;
    return Math.max(10, Math.min(100, progress));
  }, [currentMonth, previousMonth]);

  const completionRate = useMemo(() => {
    if (groceryItems.length === 0) return 0;
    return Math.round((checkedCount / groceryItems.length) * 100);
  }, [checkedCount, groceryItems.length]);

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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Pantry Risk Radar</h2>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </div>
          <div className="mt-3 space-y-2">
            {expiringPreview.length === 0 ? (
              <p className="text-xs text-muted-foreground">No urgent pantry items right now.</p>
            ) : (
              expiringPreview.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border/70 bg-background/70 px-3 py-2"
                >
                  <p className="text-sm font-medium">{item.item_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.status === "Expired"
                      ? `Expired ${Math.abs(Number(item.days_remaining ?? 0))} day(s) ago`
                      : `${item.days_remaining} day(s) remaining`}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Spend Pulse</h2>
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            This month vs previous month baseline
          </p>
          <div className="mt-2 h-2 w-full rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${budgetProgress}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md border border-border/70 bg-background/70 p-2">
              <p className="text-muted-foreground">Current</p>
              <p className="font-semibold">{formatINR(currentMonth)}</p>
            </div>
            <div className="rounded-md border border-border/70 bg-background/70 p-2">
              <p className="text-muted-foreground">Previous</p>
              <p className="font-semibold">{formatINR(previousMonth)}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Shopping Momentum</h2>
            <Sparkles className="h-4 w-4 text-accent" />
          </div>
          <div className="mt-3 space-y-2">
            <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
              <p className="text-xs text-muted-foreground">List Completion</p>
              <p className="text-lg font-semibold text-foreground">{completionRate}%</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
              <p className="text-xs text-muted-foreground">Checked Items</p>
              <p className="text-lg font-semibold text-foreground">
                {checkedCount}/{groceryItems.length}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
              <p className="text-xs text-muted-foreground">Saved Snapshot</p>
              <p className="text-xs font-medium text-foreground inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
                {shoppingSnapshotAt ? new Date(shoppingSnapshotAt).toLocaleString() : "Not saved yet"}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
