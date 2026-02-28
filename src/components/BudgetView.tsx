import { GroceryItem } from '@/types/grocery';
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';

interface BudgetViewProps {
  items: GroceryItem[];
  totalCost: number;
}

export default function BudgetView({ items, totalCost }: BudgetViewProps) {
  const budget = 75;
  const remaining = budget - totalCost;
  const pct = Math.min((totalCost / budget) * 100, 100);

  const topItems = [...items].sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border p-6 text-center">
        <p className="text-sm text-muted-foreground mb-1">Estimated Total</p>
        <p className="text-4xl font-display text-foreground">${totalCost.toFixed(2)}</p>
        <div className="w-full bg-secondary rounded-full h-3 mt-4">
          <div
            className={`h-3 rounded-full transition-all ${remaining >= 0 ? 'bg-primary' : 'bg-destructive'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>$0</span>
          <span>Budget: ${budget}</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {remaining >= 0 ? (
            <>
              <TrendingDown className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">${remaining.toFixed(2)} under budget</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">${Math.abs(remaining).toFixed(2)} over budget</span>
            </>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-display text-lg mb-3 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" /> Top Expenses
        </h3>
        <div className="space-y-2">
          {topItems.map(item => {
            const cost = item.price * item.quantity;
            const barPct = (cost / totalCost) * 100;
            return (
              <div key={item.id} className="bg-card rounded-lg border border-border px-4 py-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted-foreground">${cost.toFixed(2)}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-accent" style={{ width: `${barPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-display text-lg mb-2">📊 Quick Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-secondary rounded-lg">
            <p className="text-2xl font-display text-foreground">{items.length}</p>
            <p className="text-xs text-muted-foreground">Total Items</p>
          </div>
          <div className="text-center p-3 bg-secondary rounded-lg">
            <p className="text-2xl font-display text-foreground">${items.length > 0 ? (totalCost / items.length).toFixed(2) : '0'}</p>
            <p className="text-xs text-muted-foreground">Avg. per Item</p>
          </div>
        </div>
      </div>
    </div>
  );
}
