import { ShoppingCart, Package, ChefHat, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'list' | 'pantry' | 'recipes' | 'budget';

interface AppHeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  shoppingMode: boolean;
  checkedCount: number;
  totalItems: number;
}

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'list', label: 'My List', icon: <ShoppingCart className="w-4 h-4" /> },
  { id: 'pantry', label: 'Pantry', icon: <Package className="w-4 h-4" /> },
  { id: 'recipes', label: 'Recipes', icon: <ChefHat className="w-4 h-4" /> },
  { id: 'budget', label: 'Budget', icon: <BarChart3 className="w-4 h-4" /> },
];

export default function AppHeader({ activeTab, onTabChange, shoppingMode, checkedCount, totalItems }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-display text-foreground">
              🥗 Grocery List
            </h1>
            {shoppingMode && (
              <p className="text-sm text-primary font-medium mt-0.5">
                Shopping Mode — {checkedCount}/{totalItems} items
              </p>
            )}
          </div>
        </div>

        <nav className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
