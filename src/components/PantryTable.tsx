import { AlertCircle, Trash2, Edit2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PantryItem } from "@/types/app";
import { cn } from "@/lib/utils";

interface PantryTableProps {
  items: PantryItem[];
  editingId: string;
  editName: string;
  editQty: string;
  editExpiry: string;
  onEdit: (item: PantryItem) => void;
  onSave: (id: string) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onEditNameChange: (value: string) => void;
  onEditQtyChange: (value: string) => void;
  onEditExpiryChange: (value: string) => void;
}

function isLowStock(quantity: number): boolean {
  return Number(quantity) <= 2;
}

function statusMeta(status: PantryItem["status"]) {
  if (status === "Expired") {
    return {
      badgeClass: "bg-destructive/20 text-destructive",
      label: "Expired",
      rowClass: "border-destructive/50 bg-destructive/5",
      progressClass: "bg-destructive",
    };
  }
  if (status === "Expiring Soon") {
    return {
      badgeClass: "bg-warning/20 text-warning",
      label: "Expiring Soon",
      rowClass: "border-warning/50 bg-warning/5",
      progressClass: "bg-warning",
    };
  }
  return {
    badgeClass: "bg-success/20 text-success",
    label: "Safe",
    rowClass: "border-success/40 bg-success/5",
    progressClass: "bg-success",
  };
}

function expiryProgress(daysRemaining: number | null | undefined, alertDays: number): number {
  if (daysRemaining === null || daysRemaining === undefined) return 0;
  if (daysRemaining <= 0) return 100;
  const windowDays = Math.max(alertDays * 3, 30);
  const progress = ((windowDays - daysRemaining) / windowDays) * 100;
  return Math.max(0, Math.min(100, progress));
}

export function PantryTable({
  items,
  editingId,
  editName,
  editQty,
  editExpiry,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onEditNameChange,
  onEditQtyChange,
  onEditExpiryChange,
}: PantryTableProps) {
  // Sort items by expiry date
  const sortedItems = [...items].sort((a, b) => {
    if (!a.expiry_date) return 1;
    if (!b.expiry_date) return -1;
    return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
  });

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Pantry Inventory</h2>
        <p className="text-xs text-muted-foreground">Sorted by nearest expiry</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-border/50 bg-card p-8 text-center">
          <p className="text-muted-foreground">No pantry items yet. Add items to track your stock!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedItems.map((item, idx) => {
            const alertDays = 3;
            const isLow = isLowStock(item.quantity);
            const meta = statusMeta(item.status);
            const progress = expiryProgress(item.days_remaining, alertDays);

            return (
              <div
                key={item.id}
                className={cn(
                  "grid gap-2 md:grid-cols-6 items-center rounded-lg border p-3.5 transition-all duration-200",
                  idx % 2 === 0 ? "bg-muted/30" : "bg-background/40",
                  item.status && meta.rowClass,
                  isLow && item.status === "Safe" && "border-warning/50 bg-warning/5",
                  "hover:shadow-sm"
                )}
              >
                <div className="md:col-span-2 space-y-1">
                  <p className="font-medium text-sm md:text-base">{item.item_name}</p>
                  <div className="flex gap-2">
                    {isLow && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2 py-1 text-xs font-medium text-warning">
                        <AlertCircle className="w-3 h-3" /> Low Stock
                      </span>
                    )}
                    {item.expiry_date ? (
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium", meta.badgeClass)}>
                        <Clock className="w-3 h-3" /> {meta.label}
                      </span>
                    ) : null}
                  </div>
                </div>

                {editingId === item.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => onEditNameChange(e.target.value)}
                      className="md:col-span-1 rounded-md"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={editQty}
                      onChange={(e) => onEditQtyChange(e.target.value)}
                      className="rounded-md"
                    />
                    <Input
                      type="date"
                      value={editExpiry}
                      onChange={(e) => onEditExpiryChange(e.target.value)}
                      className="rounded-md"
                    />
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => onSave(item.id)}
                        className="rounded-md flex-1"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={onCancel}
                        className="rounded-md flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs md:text-sm font-medium">Qty: {item.quantity}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : "No expiry"}
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Remaining: {item.days_remaining ?? "-"} day(s)
                      </p>
                      {item.expiry_date ? (
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn("h-full transition-all", meta.progressClass)}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      ) : null}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(item)}
                        className="gap-1 rounded-md flex-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDelete(item.id)}
                        className="gap-1 rounded-md flex-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
