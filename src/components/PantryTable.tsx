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

function isExpiringWithin3Days(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  const today = new Date();
  const threeDaysOut = new Date(today);
  threeDaysOut.setDate(threeDaysOut.getDate() + 3);
  const expiry = new Date(expiryDate);
  return expiry >= today && expiry <= threeDaysOut;
}

function isLowStock(quantity: number): boolean {
  return Number(quantity) <= 2;
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
    <div className="space-y-4 rounded-xl border border-border bg-card/95 p-4">
      <h2 className="text-xl font-bold">Pantry Items (Sorted by Expiry)</h2>

      {items.length === 0 ? (
        <div className="rounded-lg border border-border/50 bg-card p-8 text-center">
          <p className="text-muted-foreground">No pantry items yet. Add items to track your stock!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedItems.map((item, idx) => {
            const isExpiring = isExpiringWithin3Days(item.expiry_date);
            const isLow = isLowStock(item.quantity);

            return (
              <div
                key={item.id}
                className={cn(
                  "grid gap-2 md:grid-cols-6 items-center rounded-lg border p-3 transition-all duration-200",
                  idx % 2 === 0 ? "bg-muted/30" : "bg-background/40",
                  isExpiring && "border-destructive/50 bg-destructive/5",
                  isLow && !isExpiring && "border-warning/50 bg-warning/5",
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
                    {isExpiring && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 px-2 py-1 text-xs font-medium text-destructive">
                        <Clock className="w-3 h-3" /> Expiring Soon
                      </span>
                    )}
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
