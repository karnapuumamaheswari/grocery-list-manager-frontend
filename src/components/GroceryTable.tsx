import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2 } from "lucide-react";
import { Category, GroceryItem } from "@/types/app";
import { cn } from "@/lib/utils";

interface GroceryTableProps {
  items: Record<string, GroceryItem[]>;
  editingId: string;
  editName: string;
  editCategory: Category;
  editQty: string;
  editPrice: string;
  categories: Category[];
  totalCost: number;
  formatInr: (value: number) => string;
  onEdit: (item: GroceryItem) => void;
  onSave: (id: string) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onEditNameChange: (value: string) => void;
  onEditCategoryChange: (value: Category) => void;
  onEditQtyChange: (value: string) => void;
  onEditPriceChange: (value: string) => void;
}

export function GroceryTable({
  items,
  editingId,
  editName,
  editCategory,
  editQty,
  editPrice,
  categories,
  totalCost,
  formatInr,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onEditNameChange,
  onEditCategoryChange,
  onEditQtyChange,
  onEditPriceChange,
}: GroceryTableProps) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card/95 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Grocery Items</h2>
        <p className="text-lg font-semibold text-primary">Total: {formatInr(totalCost)}</p>
      </div>

      {Object.keys(items).length === 0 ? (
        <div className="rounded-lg border border-border/50 bg-card p-8 text-center">
          <p className="text-muted-foreground">No items added yet. Start by adding items to your grocery list!</p>
        </div>
      ) : (
        Object.entries(items).map(([category, categoryItems]) => (
          <div key={category} className="space-y-3">
            <h3 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">{category}</h3>
            <div className="space-y-2">
              {categoryItems.map((item, idx) => (
                <div
                  key={item.id}
                  className={cn(
                    "grid gap-2 md:grid-cols-7 items-center rounded-lg border border-border/50 p-3 transition-all duration-200",
                    idx % 2 === 0 ? "bg-muted/30" : "bg-background/40",
                    "hover:border-primary/50 hover:shadow-sm"
                  )}
                >
                  {editingId === item.id ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => onEditNameChange(e.target.value)}
                        className="md:col-span-2 rounded-md"
                      />
                      <select
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={editCategory}
                        onChange={(e) => onEditCategoryChange(e.target.value as Category)}
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={editQty}
                        onChange={(e) => onEditQtyChange(e.target.value)}
                        className="rounded-md"
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editPrice}
                        onChange={(e) => onEditPriceChange(e.target.value)}
                        className="rounded-md"
                      />
                      <Button size="sm" onClick={() => onSave(item.id)} className="rounded-md">
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={onCancel}
                        className="rounded-md"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="md:col-span-2 font-medium text-sm md:text-base">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                      <p className="text-xs md:text-sm font-medium">{item.quantity}x</p>
                      <p className="text-xs md:text-sm font-medium text-primary">
                        {formatInr(Number(item.price))}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(item)}
                        className="gap-1 rounded-md"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDelete(item.id)}
                        className="gap-1 rounded-md"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
