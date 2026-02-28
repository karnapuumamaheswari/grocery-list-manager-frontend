import { useState, useCallback, useMemo } from 'react';
import { GroceryItem, PantryItem, MealPlan, Recipe, SAMPLE_ITEMS, SAMPLE_PANTRY, SAMPLE_RECIPES, Category } from '@/types/grocery';

export function useGroceryStore() {
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>(SAMPLE_ITEMS);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>(SAMPLE_PANTRY);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [shoppingMode, setShoppingMode] = useState(false);

  const toggleItem = useCallback((id: string) => {
    setGroceryItems(prev => prev.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  }, []);

  const addItem = useCallback((item: Omit<GroceryItem, 'id' | 'checked'>) => {
    setGroceryItems(prev => [...prev, { ...item, id: Date.now().toString(), checked: false }]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setGroceryItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const addPantryItem = useCallback((item: Omit<PantryItem, 'id'>) => {
    setPantryItems(prev => [...prev, { ...item, id: Date.now().toString() }]);
  }, []);

  const removePantryItem = useCallback((id: string) => {
    setPantryItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const totalCost = useMemo(() =>
    groceryItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [groceryItems]
  );

  const checkedCount = useMemo(() =>
    groceryItems.filter(i => i.checked).length,
    [groceryItems]
  );

  const groupedItems = useMemo(() => {
    const groups: Partial<Record<Category, GroceryItem[]>> = {};
    groceryItems.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category]!.push(item);
    });
    return groups;
  }, [groceryItems]);

  const recipes = useMemo(() => {
    const allIngredients = [
      ...groceryItems.map(i => i.name.toLowerCase()),
      ...pantryItems.map(i => i.name.toLowerCase()),
    ];
    return SAMPLE_RECIPES.map(r => ({
      ...r,
      matchCount: r.ingredients.filter(ing => 
        allIngredients.some(ai => ai.includes(ing.toLowerCase()) || ing.toLowerCase().includes(ai))
      ).length,
    })).sort((a, b) => b.matchCount - a.matchCount);
  }, [groceryItems, pantryItems]);

  const expiringItems = useMemo(() => {
    const now = new Date();
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    return pantryItems.filter(item => {
      if (!item.expirationDate) return false;
      return new Date(item.expirationDate) <= threeDays;
    });
  }, [pantryItems]);

  return {
    groceryItems, pantryItems, mealPlans, shoppingMode,
    toggleItem, addItem, removeItem, addPantryItem, removePantryItem,
    setShoppingMode, setMealPlans,
    totalCost, checkedCount, groupedItems, recipes, expiringItems,
  };
}
