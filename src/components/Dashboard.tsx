import { useMemo } from "react";
import { TrendingDown, TrendingUp, ShoppingCart, Package, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { GroceryItem, PantryItem, MonthlySummary } from "@/types/app";
import { cn } from "@/lib/utils";

interface DashboardProps {
  groceryItems: GroceryItem[];
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

export function Dashboard({ groceryItems, pantryItems, summary }: DashboardProps) {
  const currentMonth = Number(summary?.current_month_total ?? 0);
  const previousMonth = Number(summary?.previous_month_total ?? 0);
  const difference = currentMonth - previousMonth;
  const percentChange = previousMonth > 0 ? ((difference / previousMonth) * 100).toFixed(1) : "0.0";

  const lowStockCount = useMemo(() => pantryItems.filter((item) => Number(item.quantity) <= 2).length, [pantryItems]);

  const expiringCount = useMemo(() => {
    const today = new Date();
    const threeDaysOut = new Date(today);
    threeDaysOut.setDate(threeDaysOut.getDate() + 3);

    return pantryItems.filter((item) => {
      if (!item.expiry_date) return false;
      const exp = new Date(item.expiry_date);
      return exp >= today && exp <= threeDaysOut;
    }).length;
  }, [pantryItems]);

  const groceryTotal = useMemo(
    () => groceryItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0),
    [groceryItems]
  );

  const stats = [
    {
      title: "Grocery Items",
      value: groceryItems.length,
      icon: ShoppingCart,
      color: "text-info",
      bgColor: "bg-info/15",
    },
    {
      title: "Pantry Items",
      value: pantryItems.length,
      icon: Package,
      color: "text-success",
      bgColor: "bg-success/15",
    },
    {
      title: "Cart Total",
      value: formatINR(groceryTotal),
      icon: ShoppingCart,
      color: "text-primary",
      bgColor: "bg-primary/15",
    },
    {
      title: "Low Stock",
      value: lowStockCount,
      icon: TrendingDown,
      color: "text-warning",
      bgColor: "bg-warning/15",
      warning: lowStockCount > 0,
    },
    {
      title: "Expiring Soon",
      value: expiringCount,
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/15",
      warning: expiringCount > 0,
    },
  ];

  return (
    <div className="mt-4 space-y-6 pt-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Overview of your list, pantry, and budget health</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className={cn(
                "glass-panel hover-lift p-5 transition-all duration-300 hover:border-accent/40",
                stat.warning && "border-warning/30"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={cn("rounded-xl p-2", stat.bgColor)}>
                  <Icon className={cn("h-5 w-5", stat.color)} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="glass-panel shimmer-border hover-lift p-6 hover:border-primary/40 transition-all duration-300">
        <h2 className="mb-5 text-xl font-bold text-foreground">Monthly Spending Comparison</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
            <p className="mb-2 text-sm text-muted-foreground">This Month</p>
            <p className="text-3xl font-bold text-primary">{formatINR(currentMonth)}</p>
          </div>

          <div className="rounded-xl border border-border/70 bg-secondary/20 p-4">
            <p className="mb-2 text-sm text-muted-foreground">Last Month</p>
            <p className="text-3xl font-bold text-foreground">{formatINR(previousMonth)}</p>
          </div>

          <div
            className={cn(
              "rounded-xl border p-4",
              difference > 0 ? "border-destructive/30 bg-destructive/10" : "border-success/30 bg-success/10"
            )}
          >
            <p className="mb-2 text-sm text-muted-foreground">Difference</p>
            <div className="flex items-center gap-2">
              <p className={cn("text-3xl font-bold", difference > 0 ? "text-destructive" : "text-success")}>
                {formatINR(Math.abs(difference))}
              </p>
              {difference > 0 ? (
                <TrendingUp className="h-6 w-6 text-destructive" />
              ) : (
                <TrendingDown className="h-6 w-6 text-success" />
              )}
            </div>
            <p className={cn("mt-2 text-sm", difference > 0 ? "text-destructive" : "text-success")}>
              {difference > 0 ? "Up" : "Down"} {percentChange}% from last month
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
