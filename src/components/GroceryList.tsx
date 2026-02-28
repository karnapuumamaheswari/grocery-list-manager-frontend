import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Trash2, Plus, ShoppingBag } from 'lucide-react';
import { GroceryItem, Category, CATEGORY_CONFIG } from '@/types/grocery';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GroceryListProps {
  groupedItems: Partial<Record<Category, GroceryItem[]>>;
  shoppingMode: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (item: Omit<GroceryItem, 'id' | 'checked'>) => void;
  onToggleShoppingMode: () => void;
}

export default function GroceryList({ groupedItems, shoppingMode, onToggle, onRemove, onAdd, onToggleShoppingMode }: GroceryListProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('produce');
  const [newQty, setNewQty] = useState('1');
  const [newPrice, setNewPrice] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd({
      name: newName.trim(),
      category: newCategory,
      quantity: parseInt(newQty) || 1,
      unit: 'pcs',
      price: parseFloat(newPrice) || 0,
    });
    setNewName('');
    setNewPrice('');
    setNewQty('1');
  };

  const categories = Object.keys(groupedItems) as Category[];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={onToggleShoppingMode}
          variant={shoppingMode ? "default" : "outline"}
          className="gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          {shoppingMode ? 'Exit Shopping' : 'Shopping Mode'}
        </Button>
        {!shoppingMode && (
          <Button variant="outline" onClick={() => setShowAdd(!showAdd)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showAdd && !shoppingMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <Input
                placeholder="Item name..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              <div className="flex gap-2">
                <Select value={newCategory} onValueChange={v => setNewCategory(v as Category)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.emoji} {cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input className="w-20" type="number" placeholder="Qty" value={newQty} onChange={e => setNewQty(e.target.value)} />
                <Input className="w-24" type="number" placeholder="Price" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
              </div>
              <Button onClick={handleAdd} className="w-full">Add to List</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {categories.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Your list is empty</p>
          <p className="text-sm">Add items to get started</p>
        </div>
      ) : (
        categories.map(cat => {
          const cfg = CATEGORY_CONFIG[cat];
          const items = groupedItems[cat]!;
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", cfg.colorClass)}>
                  {cfg.emoji} {cfg.label}
                </span>
                <span className="text-xs text-muted-foreground">{items.length} items</span>
              </div>
              <div className="space-y-1.5">
                <AnimatePresence>
                  {items.map(item => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      className={cn(
                        "flex items-center gap-3 bg-card rounded-xl px-4 py-3 border border-border transition-all",
                        item.checked && "opacity-60"
                      )}
                    >
                      <button
                        onClick={() => onToggle(item.id)}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
                          item.checked
                            ? "bg-primary border-primary animate-check-bounce"
                            : "border-border hover:border-primary"
                        )}
                      >
                        {item.checked && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-medium text-sm", item.checked && "line-through text-muted-foreground")}>
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} {item.unit}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                      {!shoppingMode && (
                        <button onClick={() => onRemove(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
