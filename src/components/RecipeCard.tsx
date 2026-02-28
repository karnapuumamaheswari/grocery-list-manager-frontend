import { Recipe } from '@/types/grocery';
import { cn } from '@/lib/utils';

interface RecipeCardProps {
  recipes: Recipe[];
}

export default function RecipeCard({ recipes }: RecipeCardProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Recipes matched to your grocery list & pantry ingredients
      </p>
      {recipes.map(recipe => {
        const pct = Math.round((recipe.matchCount / recipe.totalIngredients) * 100);
        return (
          <div key={recipe.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg">{recipe.emoji} {recipe.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">⏱ {recipe.cookTime}</p>
              </div>
              <span className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded-full",
                pct === 100 ? "bg-primary/15 text-primary" :
                pct >= 50 ? "bg-warning/15 text-warning" :
                "bg-muted text-muted-foreground"
              )}>
                {recipe.matchCount}/{recipe.totalIngredients} ingredients
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className={cn("h-2 rounded-full transition-all", pct === 100 ? "bg-primary" : pct >= 50 ? "bg-warning" : "bg-muted-foreground/30")}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recipe.ingredients.map(ing => (
                <span key={ing} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                  {ing}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
