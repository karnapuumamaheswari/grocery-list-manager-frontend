export type Category =
  | "Produce"
  | "Dairy"
  | "Bakery"
  | "Meat"
  | "Frozen"
  | "Pantry"
  | "Beverages"
  | "Snacks"
  | "Other";

export interface GroceryItem {
  id: string;
  user_id: string;
  name: string;
  category: Category | string;
  quantity: number;
  price: number;
  created_at: string;
}

export interface PantryItem {
  id: string;
  user_id: string;
  item_name: string;
  quantity: number;
  expiry_date: string | null;
  created_at: string;
}

export interface PurchaseHistoryItem {
  id: string;
  user_id: string;
  total_amount: number;
  purchase_date: string;
  items_snapshot: GroceryItem[];
}

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: number;
  brand: string | null;
  store: string;
}

export interface MonthlySummary {
  current_month_total: number;
  previous_month_total: number;
  change_amount: number;
  savings: number;
  trend: "up" | "down";
}
