export type Category = 
  | 'produce' | 'dairy' | 'bakery' | 'meat' 
  | 'frozen' | 'pantry' | 'beverages' | 'snacks' | 'other';

export interface GroceryItem {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unit: string;
  price: number;
  checked: boolean;
}

export interface PantryItem {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unit: string;
  expirationDate?: string;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  matchCount: number;
  totalIngredients: number;
  cookTime: string;
  emoji: string;
}

export interface MealPlan {
  id: string;
  day: string;
  meal: 'breakfast' | 'lunch' | 'dinner';
  recipeName: string;
}

export const CATEGORY_CONFIG: Record<Category, { label: string; colorClass: string; emoji: string }> = {
  produce: { label: 'Produce', colorClass: 'bg-produce/15 text-produce', emoji: '🥬' },
  dairy: { label: 'Dairy', colorClass: 'bg-dairy/15 text-dairy', emoji: '🥛' },
  bakery: { label: 'Bakery', colorClass: 'bg-bakery/15 text-bakery', emoji: '🍞' },
  meat: { label: 'Meat & Seafood', colorClass: 'bg-meat/15 text-meat', emoji: '🥩' },
  frozen: { label: 'Frozen', colorClass: 'bg-frozen/15 text-frozen', emoji: '🧊' },
  pantry: { label: 'Pantry', colorClass: 'bg-pantry-cat/15 text-pantry-cat', emoji: '🥫' },
  beverages: { label: 'Beverages', colorClass: 'bg-beverages/15 text-beverages', emoji: '🥤' },
  snacks: { label: 'Snacks', colorClass: 'bg-snacks/15 text-snacks', emoji: '🍿' },
  other: { label: 'Other', colorClass: 'bg-muted text-muted-foreground', emoji: '📦' },
};

export const SAMPLE_ITEMS: GroceryItem[] = [
  { id: '1', name: 'Avocados', category: 'produce', quantity: 3, unit: 'pcs', price: 1.50, checked: false },
  { id: '2', name: 'Spinach', category: 'produce', quantity: 1, unit: 'bag', price: 3.49, checked: false },
  { id: '3', name: 'Greek Yogurt', category: 'dairy', quantity: 2, unit: 'cups', price: 4.99, checked: false },
  { id: '4', name: 'Whole Milk', category: 'dairy', quantity: 1, unit: 'gal', price: 4.29, checked: false },
  { id: '5', name: 'Sourdough Bread', category: 'bakery', quantity: 1, unit: 'loaf', price: 5.99, checked: false },
  { id: '6', name: 'Chicken Breast', category: 'meat', quantity: 2, unit: 'lbs', price: 8.99, checked: false },
  { id: '7', name: 'Salmon Fillet', category: 'meat', quantity: 1, unit: 'lb', price: 12.99, checked: false },
  { id: '8', name: 'Frozen Berries', category: 'frozen', quantity: 1, unit: 'bag', price: 4.99, checked: false },
  { id: '9', name: 'Olive Oil', category: 'pantry', quantity: 1, unit: 'bottle', price: 7.99, checked: false },
  { id: '10', name: 'Brown Rice', category: 'pantry', quantity: 1, unit: 'bag', price: 3.49, checked: false },
];

export const SAMPLE_PANTRY: PantryItem[] = [
  { id: 'p1', name: 'Pasta', category: 'pantry', quantity: 2, unit: 'boxes', expirationDate: '2026-06-15' },
  { id: 'p2', name: 'Canned Tomatoes', category: 'pantry', quantity: 4, unit: 'cans', expirationDate: '2027-01-01' },
  { id: 'p3', name: 'Eggs', category: 'dairy', quantity: 12, unit: 'pcs', expirationDate: '2026-03-05' },
  { id: 'p4', name: 'Butter', category: 'dairy', quantity: 1, unit: 'block', expirationDate: '2026-04-10' },
  { id: 'p5', name: 'Garlic', category: 'produce', quantity: 3, unit: 'heads' },
  { id: 'p6', name: 'Onions', category: 'produce', quantity: 5, unit: 'pcs' },
];

export const SAMPLE_RECIPES: Recipe[] = [
  { id: 'r1', name: 'Avocado Toast with Eggs', ingredients: ['Avocados', 'Sourdough Bread', 'Eggs', 'Olive Oil'], matchCount: 0, totalIngredients: 4, cookTime: '10 min', emoji: '🥑' },
  { id: 'r2', name: 'Chicken Stir-Fry', ingredients: ['Chicken Breast', 'Brown Rice', 'Garlic', 'Olive Oil', 'Spinach'], matchCount: 0, totalIngredients: 5, cookTime: '25 min', emoji: '🍳' },
  { id: 'r3', name: 'Berry Smoothie Bowl', ingredients: ['Frozen Berries', 'Greek Yogurt', 'Whole Milk'], matchCount: 0, totalIngredients: 3, cookTime: '5 min', emoji: '🫐' },
  { id: 'r4', name: 'Salmon & Rice Bowl', ingredients: ['Salmon Fillet', 'Brown Rice', 'Avocados', 'Spinach'], matchCount: 0, totalIngredients: 4, cookTime: '30 min', emoji: '🍣' },
  { id: 'r5', name: 'Pasta Pomodoro', ingredients: ['Pasta', 'Canned Tomatoes', 'Garlic', 'Olive Oil', 'Onions'], matchCount: 0, totalIngredients: 5, cookTime: '20 min', emoji: '🍝' },
];
