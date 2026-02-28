import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { PantryItem, Category, CATEGORY_CONFIG } from '@/types/grocery';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PantryViewProps {
  items: PantryItem[];
  expiringItems: PantryItem[];
  onAdd: (item: Omit<PantryItem, 'id'>) => void;
  onRemove: (id: string) => void;
}

export default function PantryView({ items, expiringItems, onAdd, onRemove }: PantryViewProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('pantry');
  const [qty, setQty] = useState('1');
  const [expDate, setExpDate] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), category, quantity: parseInt(qty) || 1, unit: 'pcs', expirationDate: expDate || undefined });
    setName(''); setQty('1'); setExpDate('');
  };

  return (
    <div className="space-y-4">
      {expiringItems.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="text-sm font-semibold text-warning">Expiring Soon</span>
          </div>
          {expiringItems.map(item => (
            <p key={item.id} className="text-sm text-foreground">
              {item.name} — expires {item.expirationDate}
            </p>
          ))}
        </div>
      )}

      <Button variant="outline" onClick={() => setShowAdd(!showAdd)} className="gap-2">
        <Plus className="w-4 h-4" /> Add to Pantry
      </Button>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <Input placeholder="Item name..." value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
              <div className="flex gap-2">
                <Select value={category} onValueChange={v => setCategory(v as Category)}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_CONFIG).map(([k, c]) => (
                      <SelectItem key={k} value={k}>{c.emoji} {c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input className="w-20" type="number" placeholder="Qty" value={qty} onChange={e => setQty(e.target.value)} />
              </div>
              <Input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} />
              <Button onClick={handleAdd} className="w-full">Add to Pantry</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Pantry is empty</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map(item => {
            const cfg = CATEGORY_CONFIG[item.category];
            return (
              <motion.div key={item.id} layout className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 border border-border">
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", cfg.colorClass)}>{cfg.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.quantity} {item.unit}{item.expirationDate ? ` · Exp: ${item.expirationDate}` : ''}</p>
                </div>
                <button onClick={() => onRemove(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
