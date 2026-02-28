import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { jsPDF } from "jspdf";
import {
  CalendarDays,
  ChefHat,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Copy,
  Download,
  Info,
  Plus,
  RefreshCw,
  Search,
  Eye,
  EyeOff,
  Share2,
  ShoppingCart,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiRequest } from "@/services/api";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { AuthModal } from "@/components/AuthModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Dashboard } from "@/components/Dashboard";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { GroceryTable } from "@/components/GroceryTable";
import { PantryTable } from "@/components/PantryTable";
import type {
  Category,
  GroceryItem,
  MonthlySummary,
  PantryItem,
  ProductItem,
  PurchaseHistoryItem,
} from "@/types/app";

type Tab = "grocery" | "current" | "pantry" | "recipes" | "budget" | "history";
type Store = "BigBasket" | "JioMart" | "Blinkit" | "Instamart";
type DietPreference = "all" | "vegetarian" | "high-protein" | "low-carb" | "gluten-free";

const categories: Category[] = [
  "Produce",
  "Dairy",
  "Bakery",
  "Meat",
  "Frozen",
  "Pantry",
  "Beverages",
  "Snacks",
  "Other",
];

const stores: Record<Store, string> = {
  BigBasket: "BigBasket",
  JioMart: "JioMart",
  Blinkit: "Blinkit",
  Instamart: "Instamart",
};

const tabs: Tab[] = ["grocery", "current", "pantry", "recipes", "budget", "history"];
const tabLabels: Record<Tab, string> = {
  grocery: "Grocery",
  current: "Current List",
  pantry: "Pantry",
  recipes: "Recipes",
  budget: "Budget",
  history: "History",
};
const tabRouteMap: Record<Tab, string> = {
  grocery: "/grocery",
  current: "/current-list",
  pantry: "/pantry",
  recipes: "/recipes",
  budget: "/budget",
  history: "/history",
};
const routeTabMap: Record<string, Tab> = {
  "/": "grocery",
  "/grocery": "grocery",
  "/current-list": "current",
  "/pantry": "pantry",
  "/recipes": "recipes",
  "/budget": "budget",
  "/history": "history",
};
const SESSION_STARTED_KEY = "grocery_session_started_at";
const PURCHASE_HISTORY_CACHE_PREFIX = "grocery_purchase_history_";
const BUDGET_LIMIT_CACHE_PREFIX = "grocery_budget_limit_";
const PRODUCT_CATALOG_LIMIT = 1000;
const DEFAULT_BUDGET_LIMIT = 2500;
const sessionTimeoutMinutes = Number(import.meta.env.VITE_SESSION_TIMEOUT_MINUTES ?? "60");
const sessionTimeoutMs = Math.max(sessionTimeoutMinutes, 1) * 60 * 1000;

const toAmount = (value: number) => Number(value ?? 0);
const formatInr = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    Number(value ?? 0),
  );

const startOfTodayUtc = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

const getHistoryCacheKey = (userId: string) => `${PURCHASE_HISTORY_CACHE_PREFIX}${userId}`;

const readCachedHistory = (userId: string): PurchaseHistoryItem[] => {
  try {
    const raw = localStorage.getItem(getHistoryCacheKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeCachedHistory = (userId: string, history: PurchaseHistoryItem[]) => {
  try {
    localStorage.setItem(getHistoryCacheKey(userId), JSON.stringify(history));
  } catch {
    // ignore storage write errors
  }
};

const buildStoreSearchUrl = (store: Store, itemName: string) => {
  const query = encodeURIComponent(itemName.trim());
  switch (store) {
    case "BigBasket":
      return `https://www.bigbasket.com/ps/?q=${query}`;
    case "JioMart":
      return `https://www.jiomart.com/search/${query}`;
    case "Blinkit":
      return `https://blinkit.com/s/?q=${query}`;
    case "Instamart":
      return `https://www.swiggy.com/instamart/search?query=${query}&custom_back=true`;
    default:
      return `https://www.bigbasket.com/ps/?q=${query}`;
  }
};

const toTabFromPath = (pathname: string): Tab => routeTabMap[pathname] ?? "grocery";

const toCategory = (value?: string | null): Category => {
  const normalized = String(value ?? "").trim().toLowerCase();
  const match = categories.find((category) => category.toLowerCase() === normalized);
  return match ?? "Other";
};

const normalizeToken = (value?: string | null) => String(value ?? "").trim().toLowerCase();

const heroDropItems = [
  { name: "Milk", icon: "/items/milk.svg", price: 68 },
  { name: "Tomato", icon: "/items/tomato.svg", price: 44 },
  { name: "Bread", icon: "/items/bread.svg", price: 38 },
];

const recipeCatalog = [
  {
    id: "recipe-1",
    name: "Paneer & Veggie Stir Fry",
    diet: ["vegetarian", "high-protein", "gluten-free", "low-carb"],
    calories: 420,
    protein: 23,
    ingredients: ["Paneer", "Bell Pepper", "Onion", "Olive Oil", "Garlic"],
  },
  {
    id: "recipe-2",
    name: "Chicken Rice Bowl",
    diet: ["high-protein", "gluten-free"],
    calories: 510,
    protein: 34,
    ingredients: ["Chicken Breast", "Rice", "Spinach", "Tomato", "Olive Oil"],
  },
  {
    id: "recipe-3",
    name: "Masala Oats Bowl",
    diet: ["vegetarian"],
    calories: 330,
    protein: 12,
    ingredients: ["Oats", "Tomato", "Onion", "Peas", "Spices"],
  },
  {
    id: "recipe-4",
    name: "Egg Bhurji Wrap",
    diet: ["high-protein"],
    calories: 390,
    protein: 21,
    ingredients: ["Eggs", "Onion", "Tomato", "Whole Wheat Bread", "Butter"],
  },
  {
    id: "recipe-5",
    name: "Greek Yogurt Fruit Bowl",
    diet: ["vegetarian", "gluten-free", "low-carb"],
    calories: 280,
    protein: 14,
    ingredients: ["Greek Yogurt", "Apple", "Banana", "Honey"],
  },
  {
    id: "recipe-6",
    name: "Dal Tadka",
    diet: ["vegetarian", "gluten-free"],
    calories: 310,
    protein: 15,
    ingredients: ["Toor Dal", "Onion", "Tomato", "Garlic", "Spices", "Oil"],
  },
  {
    id: "recipe-7",
    name: "Chana Masala",
    diet: ["vegetarian", "high-protein", "gluten-free"],
    calories: 360,
    protein: 16,
    ingredients: ["Chickpeas", "Onion", "Tomato", "Garlic", "Spices", "Oil"],
  },
  {
    id: "recipe-8",
    name: "Rajma Curry",
    diet: ["vegetarian", "high-protein", "gluten-free"],
    calories: 390,
    protein: 15,
    ingredients: ["Rajma", "Onion", "Tomato", "Garlic", "Spices", "Oil"],
  },
  {
    id: "recipe-9",
    name: "Aloo Gobi",
    diet: ["vegetarian", "gluten-free"],
    calories: 280,
    protein: 7,
    ingredients: ["Potato", "Cauliflower", "Onion", "Tomato", "Spices", "Oil"],
  },
  {
    id: "recipe-10",
    name: "Bhindi Masala",
    diet: ["vegetarian", "gluten-free", "low-carb"],
    calories: 240,
    protein: 6,
    ingredients: ["Bhindi", "Onion", "Tomato", "Spices", "Oil"],
  },
  {
    id: "recipe-11",
    name: "Baingan Bharta",
    diet: ["vegetarian", "gluten-free", "low-carb"],
    calories: 230,
    protein: 6,
    ingredients: ["Brinjal", "Onion", "Tomato", "Garlic", "Spices", "Oil"],
  },
  {
    id: "recipe-12",
    name: "Palak Paneer",
    diet: ["vegetarian", "high-protein", "gluten-free", "low-carb"],
    calories: 410,
    protein: 19,
    ingredients: ["Paneer", "Spinach", "Onion", "Tomato", "Garlic", "Spices"],
  },
  {
    id: "recipe-13",
    name: "Paneer Butter Masala",
    diet: ["vegetarian", "high-protein", "gluten-free"],
    calories: 470,
    protein: 18,
    ingredients: ["Paneer", "Tomato", "Onion", "Butter", "Cream", "Spices"],
  },
  {
    id: "recipe-14",
    name: "Matar Paneer",
    diet: ["vegetarian", "high-protein", "gluten-free"],
    calories: 420,
    protein: 17,
    ingredients: ["Paneer", "Peas", "Onion", "Tomato", "Spices", "Oil"],
  },
  {
    id: "recipe-15",
    name: "Egg Curry",
    diet: ["high-protein", "gluten-free", "low-carb"],
    calories: 360,
    protein: 22,
    ingredients: ["Eggs", "Onion", "Tomato", "Garlic", "Spices", "Oil"],
  },
  {
    id: "recipe-16",
    name: "Chicken Curry",
    diet: ["high-protein", "gluten-free", "low-carb"],
    calories: 460,
    protein: 30,
    ingredients: ["Chicken", "Onion", "Tomato", "Garlic", "Spices", "Oil"],
  },
  {
    id: "recipe-17",
    name: "Chicken Tikka",
    diet: ["high-protein", "gluten-free", "low-carb"],
    calories: 390,
    protein: 35,
    ingredients: ["Chicken", "Yogurt", "Garlic", "Ginger", "Spices", "Lemon"],
  },
  {
    id: "recipe-18",
    name: "Fish Curry",
    diet: ["high-protein", "gluten-free", "low-carb"],
    calories: 370,
    protein: 29,
    ingredients: ["Fish", "Onion", "Tomato", "Garlic", "Spices", "Oil"],
  },
  {
    id: "recipe-19",
    name: "Vegetable Pulao",
    diet: ["vegetarian", "gluten-free"],
    calories: 430,
    protein: 10,
    ingredients: ["Rice", "Carrot", "Peas", "Beans", "Onion", "Spices"],
  },
  {
    id: "recipe-20",
    name: "Jeera Rice",
    diet: ["vegetarian", "gluten-free"],
    calories: 320,
    protein: 6,
    ingredients: ["Rice", "Jeera", "Ghee", "Salt"],
  },
  {
    id: "recipe-21",
    name: "Poha",
    diet: ["vegetarian", "gluten-free"],
    calories: 290,
    protein: 7,
    ingredients: ["Poha", "Onion", "Potato", "Peanuts", "Spices", "Oil"],
  },
  {
    id: "recipe-22",
    name: "Upma",
    diet: ["vegetarian"],
    calories: 310,
    protein: 8,
    ingredients: ["Suji", "Onion", "Carrot", "Peas", "Spices", "Oil"],
  },
  {
    id: "recipe-23",
    name: "Idli",
    diet: ["vegetarian", "gluten-free"],
    calories: 250,
    protein: 8,
    ingredients: ["Idli Batter", "Oil", "Salt"],
  },
  {
    id: "recipe-24",
    name: "Dosa",
    diet: ["vegetarian", "gluten-free"],
    calories: 320,
    protein: 9,
    ingredients: ["Dosa Batter", "Oil", "Potato", "Onion", "Spices"],
  },
  {
    id: "recipe-25",
    name: "Sambar",
    diet: ["vegetarian", "gluten-free"],
    calories: 270,
    protein: 11,
    ingredients: ["Toor Dal", "Tamarind", "Onion", "Tomato", "Vegetables", "Spices"],
  },
  {
    id: "recipe-26",
    name: "Lemon Rice",
    diet: ["vegetarian", "gluten-free"],
    calories: 330,
    protein: 7,
    ingredients: ["Rice", "Lemon", "Peanuts", "Spices", "Oil"],
  },
  {
    id: "recipe-27",
    name: "Curd Rice",
    diet: ["vegetarian", "gluten-free"],
    calories: 300,
    protein: 9,
    ingredients: ["Rice", "Curd", "Mustard Seeds", "Curry Leaves", "Salt"],
  },
  {
    id: "recipe-28",
    name: "Kadhi Pakora",
    diet: ["vegetarian"],
    calories: 410,
    protein: 12,
    ingredients: ["Curd", "Besan", "Onion", "Spices", "Oil"],
  },
  {
    id: "recipe-29",
    name: "Besan Chilla",
    diet: ["vegetarian", "high-protein", "gluten-free", "low-carb"],
    calories: 280,
    protein: 14,
    ingredients: ["Besan", "Onion", "Tomato", "Spices", "Oil"],
  },
  {
    id: "recipe-30",
    name: "Moong Dal Chilla",
    diet: ["vegetarian", "high-protein", "gluten-free", "low-carb"],
    calories: 260,
    protein: 15,
    ingredients: ["Moong Dal", "Onion", "Spices", "Oil"],
  },
  {
    id: "recipe-31",
    name: "Khichdi",
    diet: ["vegetarian", "gluten-free"],
    calories: 340,
    protein: 11,
    ingredients: ["Rice", "Moong Dal", "Ghee", "Jeera", "Spices"],
  },
  {
    id: "recipe-32",
    name: "Veg Hakka Noodles",
    diet: ["vegetarian"],
    calories: 450,
    protein: 10,
    ingredients: ["Noodles", "Carrot", "Cabbage", "Capsicum", "Soy Sauce", "Oil"],
  },
  {
    id: "recipe-33",
    name: "Soya Chunk Curry",
    diet: ["vegetarian", "high-protein"],
    calories: 350,
    protein: 22,
    ingredients: ["Soya Chunks", "Onion", "Tomato", "Garlic", "Spices", "Oil"],
  },
  {
    id: "recipe-34",
    name: "Aloo Paratha",
    diet: ["vegetarian"],
    calories: 430,
    protein: 10,
    ingredients: ["Wheat Flour", "Potato", "Onion", "Spices", "Ghee"],
  },
  {
    id: "recipe-35",
    name: "Paneer Bhurji",
    diet: ["vegetarian", "high-protein", "gluten-free", "low-carb"],
    calories: 360,
    protein: 20,
    ingredients: ["Paneer", "Onion", "Tomato", "Spices", "Oil"],
  },
];

const guessCategoryFromName = (name: string): Category => {
  const normalized = name.toLowerCase();
  if (/(milk|cheese|yogurt|butter|paneer)/.test(normalized)) return "Dairy";
  if (/(bread|bun|cake|biscuit|rusk)/.test(normalized)) return "Bakery";
  if (/(chicken|mutton|fish|egg|meat)/.test(normalized)) return "Meat";
  if (/(frozen|ice cream|nugget|peas)/.test(normalized)) return "Frozen";
  if (/(rice|flour|atta|oil|salt|sugar|dal|lentil|spice)/.test(normalized)) return "Pantry";
  if (/(juice|cola|soda|water|tea|coffee)/.test(normalized)) return "Beverages";
  if (/(chips|nacho|chocolate|cookie|snack)/.test(normalized)) return "Snacks";
  return "Produce";
};

export default function Index() {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [protectedRouteModalOpen, setProtectedRouteModalOpen] = useState(false);
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [confirmBudgetUpdate, setConfirmBudgetUpdate] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>(() => toTabFromPath(location.pathname));
  const [loadingData, setLoadingData] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionInfo, setActionInfo] = useState("");
  const [usingCachedHistory, setUsingCachedHistory] = useState(false);

  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);

  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<Category>("Other");
  const [newItemQty, setNewItemQty] = useState("1");
  const [newItemPrice, setNewItemPrice] = useState("0");
  const [allowPantryDuplicateAdd, setAllowPantryDuplicateAdd] = useState(false);
  const [budgetLimit, setBudgetLimit] = useState<number>(DEFAULT_BUDGET_LIMIT);
  const [budgetInput, setBudgetInput] = useState<string>(String(DEFAULT_BUDGET_LIMIT));
  const [detailHints, setDetailHints] = useState<ProductItem[]>([]);
  const [detailHintsLoading, setDetailHintsLoading] = useState(false);

  const [editItemId, setEditItemId] = useState("");
  const [editItemName, setEditItemName] = useState("");
  const [editItemCategory, setEditItemCategory] = useState<Category>("Other");
  const [editItemQty, setEditItemQty] = useState("1");
  const [editItemPrice, setEditItemPrice] = useState("0");

  const [pantryName, setPantryName] = useState("");
  const [pantryQty, setPantryQty] = useState("1");
  const [pantryExpiry, setPantryExpiry] = useState("");
  const [editPantryId, setEditPantryId] = useState("");
  const [editPantryName, setEditPantryName] = useState("");
  const [editPantryQty, setEditPantryQty] = useState("1");
  const [editPantryExpiry, setEditPantryExpiry] = useState("");

  const [selectedStore, setSelectedStore] = useState<Store>("BigBasket");
  const [shoppingChecked, setShoppingChecked] = useState<Record<string, boolean>>({});
  const [dietPreference, setDietPreference] = useState<DietPreference>("all");
  const [recipeQuery, setRecipeQuery] = useState("");
  const [plannedMeals, setPlannedMeals] = useState<Record<string, string>>({
    Monday: "",
    Tuesday: "",
    Wednesday: "",
    Thursday: "",
    Friday: "",
    Saturday: "",
    Sunday: "",
  });
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productStoreFilter, setProductStoreFilter] = useState("all");
  const [productSort, setProductSort] = useState<"name" | "price_asc" | "price_desc">("name");
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyDateFilter, setHistoryDateFilter] = useState("");
  const [historyMinAmount, setHistoryMinAmount] = useState("");
  const [historySort, setHistorySort] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [heroDropIndex, setHeroDropIndex] = useState(0);

  const token = session?.access_token ?? "";
  const sessionDisplayName =
    (session?.user?.user_metadata?.username as string | undefined) ||
    (session?.user?.user_metadata?.full_name as string | undefined) ||
    session?.user?.email?.split("@")[0] ||
    "User";
  const heroCurrentItem = heroDropItems[heroDropIndex % heroDropItems.length];
  const heroRunningTotal = heroDropItems
    .slice(0, (heroDropIndex % heroDropItems.length) + 1)
    .reduce((sum, item) => sum + item.price, 0);

  useEffect(() => {
    let mounted = true;
    const sessionCheckGuard = window.setTimeout(() => {
      if (!mounted) return;
      setCheckingSession(false);
    }, 8000);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setSession(null);
      })
      .finally(() => {
        if (!mounted) return;
        window.clearTimeout(sessionCheckGuard);
        setCheckingSession(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "SIGNED_IN") {
        localStorage.setItem(SESSION_STARTED_KEY, String(Date.now()));
      }
      if (event === "SIGNED_OUT") {
        localStorage.removeItem(SESSION_STARTED_KEY);
      }
      setSession(nextSession ?? null);
    });

    return () => {
      mounted = false;
      window.clearTimeout(sessionCheckGuard);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return;

    const startedAtRaw = localStorage.getItem(SESSION_STARTED_KEY);
    const startedAt = startedAtRaw ? Number(startedAtRaw) : Date.now();
    if (!startedAtRaw) {
      localStorage.setItem(SESSION_STARTED_KEY, String(startedAt));
    }

    const elapsed = Date.now() - startedAt;
    if (elapsed >= sessionTimeoutMs) {
      supabase.auth.signOut();
      setAuthError(`Session expired after ${sessionTimeoutMinutes} minutes. Please log in again.`);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      supabase.auth.signOut();
      setAuthError(`Session expired after ${sessionTimeoutMinutes} minutes. Please log in again.`);
    }, sessionTimeoutMs - elapsed);

    return () => window.clearTimeout(timeoutId);
  }, [session]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const cachedHistory = readCachedHistory(session.user.id);
    if (cachedHistory.length > 0) {
      setPurchaseHistory(cachedHistory);
    }
  }, [session]);

  useEffect(() => {
    if (!session?.user?.id) return;
    try {
      const raw = localStorage.getItem(`grocery_meal_plan_${session.user.id}`);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        setPlannedMeals((current) => ({ ...current, ...parsed }));
      }
    } catch {
      // ignore invalid cache payload
    }
  }, [session]);

  useEffect(() => {
    if (!session?.user?.id) return;
    try {
      localStorage.setItem(`grocery_meal_plan_${session.user.id}`, JSON.stringify(plannedMeals));
    } catch {
      // ignore storage write errors
    }
  }, [plannedMeals, session]);

  useEffect(() => {
    if (!session?.user?.id) return;
    try {
      const raw = localStorage.getItem(`${BUDGET_LIMIT_CACHE_PREFIX}${session.user.id}`);
      if (!raw) return;
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed <= 0) return;
      setBudgetLimit(parsed);
      setBudgetInput(String(parsed));
    } catch {
      // ignore invalid cache payload
    }
  }, [session]);

  useEffect(() => {
    if (!session?.user?.id) return;
    try {
      localStorage.setItem(`${BUDGET_LIMIT_CACHE_PREFIX}${session.user.id}`, String(budgetLimit));
    } catch {
      // ignore storage write errors
    }
  }, [budgetLimit, session]);

  useEffect(() => {
    const tabFromPath = toTabFromPath(location.pathname);
    setActiveTab((current) => (current === tabFromPath ? current : tabFromPath));
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== "/auth") return;
    const mode = new URLSearchParams(location.search).get("mode");
    if (mode === "signup") setIsLogin(false);
    if (mode === "login") setIsLogin(true);
  }, [location.pathname, location.search]);

  const totalCost = useMemo(
    () =>
      groceryItems.reduce(
        (sum, item) => sum + toAmount(item.price) * toAmount(item.quantity),
        0,
      ),
    [groceryItems],
  );

  const groupedGrocery = useMemo(() => {
    const grouped: Record<string, GroceryItem[]> = {};
    groceryItems.forEach((item) => {
      const key = item.category || "Other";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    return grouped;
  }, [groceryItems]);

  const lowStock = useMemo(
    () => pantryItems.filter((item) => toAmount(item.quantity) <= 2),
    [pantryItems],
  );

  const checkedCount = useMemo(
    () => groceryItems.filter((item) => shoppingChecked[item.id]).length,
    [groceryItems, shoppingChecked],
  );

  const currentListCompletion = useMemo(() => {
    if (groceryItems.length === 0) return 0;
    return Math.round((checkedCount / groceryItems.length) * 100);
  }, [checkedCount, groceryItems.length]);

  const expiringSoon = useMemo(() => {
    const today = startOfTodayUtc();
    const threeDaysOut = new Date(today);
    threeDaysOut.setUTCDate(threeDaysOut.getUTCDate() + 3);
    return pantryItems.filter((item) => {
      if (!item.expiry_date) return false;
      const exp = new Date(`${item.expiry_date}T00:00:00Z`);
      return exp >= today && exp <= threeDaysOut;
    });
  }, [pantryItems]);

  const nameQuery = useMemo(() => newItemName.trim().toLowerCase(), [newItemName]);

  const historyHints = useMemo(() => {
    if (!nameQuery) return [] as GroceryItem[];
    const snapshots = purchaseHistory.flatMap((record) => record.items_snapshot ?? []);
    const ranked = snapshots
      .filter((item) => item?.name?.toLowerCase().includes(nameQuery))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    const uniqueByName = new Map<string, GroceryItem>();
    ranked.forEach((item) => {
      const key = item.name.toLowerCase();
      if (!uniqueByName.has(key)) uniqueByName.set(key, item);
    });
    return Array.from(uniqueByName.values()).slice(0, 4);
  }, [nameQuery, purchaseHistory]);

  const pantryMatchForNewItem = useMemo(() => {
    const lookup = newItemName.trim().toLowerCase();
    if (!lookup) return null;
    return (
      pantryItems.find(
        (item) =>
          item.item_name.trim().toLowerCase() === lookup && Number(item.quantity ?? 0) > 0,
      ) ?? null
    );
  }, [newItemName, pantryItems]);

  const catalogHints = useMemo(() => {
    if (!nameQuery) return [] as ProductItem[];
    const ranked = products
      .filter((product) => product.name.toLowerCase().includes(nameQuery))
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(nameQuery) ? 1 : 0;
        const bStarts = b.name.toLowerCase().startsWith(nameQuery) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;
        return a.name.localeCompare(b.name);
      });
    return ranked.slice(0, 4);
  }, [nameQuery, products]);

  const monthlyHistoryChartData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - index), 1));
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      return {
        key,
        label: date.toLocaleDateString(undefined, { month: "short" }),
        amount: 0,
      };
    });

    const totalsByMonth = new Map<string, number>();
    purchaseHistory.forEach((record) => {
      const date = new Date(record.purchase_date);
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      totalsByMonth.set(key, (totalsByMonth.get(key) ?? 0) + Number(record.total_amount ?? 0));
    });

    return months.map((month) => ({
      month: month.label,
      amount: Number((totalsByMonth.get(month.key) ?? 0).toFixed(2)),
    }));
  }, [purchaseHistory]);

  const recentPurchaseTrendData = useMemo(() => {
    const sorted = [...purchaseHistory]
      .sort(
        (a, b) =>
          new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime(),
      )
      .slice(-10);

    return sorted.map((record, index) => ({
      purchase: `#${index + 1}`,
      amount: Number(Number(record.total_amount ?? 0).toFixed(2)),
      date: new Date(record.purchase_date).toLocaleDateString(),
    }));
  }, [purchaseHistory]);

  const averagePurchaseAmount = useMemo(() => {
    if (purchaseHistory.length === 0) return 0;
    const total = purchaseHistory.reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0);
    return total / purchaseHistory.length;
  }, [purchaseHistory]);

  const filteredHistory = useMemo(() => {
    const query = historyQuery.trim().toLowerCase();
    const minAmount = Number(historyMinAmount || 0);

    const rows = purchaseHistory.filter((record) => {
      const amount = Number(record.total_amount ?? 0);
      const isoDate = new Date(record.purchase_date).toISOString().slice(0, 10);
      const displayDate = new Date(record.purchase_date).toLocaleDateString().toLowerCase();
      const items = Array.isArray(record.items_snapshot) ? record.items_snapshot : [];
      const itemText = items
        .map((item) => `${item.name} ${toCategory(item.category)} ${Number(item.quantity ?? 0)}`)
        .join(" ")
        .toLowerCase();

      const matchesDate = historyDateFilter ? isoDate === historyDateFilter : true;
      const matchesMinAmount = minAmount > 0 ? amount >= minAmount : true;
      const matchesQuery =
        query.length === 0
          ? true
          : `${amount} ${displayDate} ${isoDate} ${items.length} ${itemText}`.includes(query);

      return matchesDate && matchesMinAmount && matchesQuery;
    });

    rows.sort((a, b) => {
      if (historySort === "oldest") {
        return new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime();
      }
      if (historySort === "highest") {
        return Number(b.total_amount ?? 0) - Number(a.total_amount ?? 0);
      }
      if (historySort === "lowest") {
        return Number(a.total_amount ?? 0) - Number(b.total_amount ?? 0);
      }
      return new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime();
    });

    return rows;
  }, [purchaseHistory, historyQuery, historyDateFilter, historyMinAmount, historySort]);

  const filteredHistoryAverage = useMemo(() => {
    if (filteredHistory.length === 0) return 0;
    const total = filteredHistory.reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0);
    return total / filteredHistory.length;
  }, [filteredHistory]);

  const budgetComparisonData = useMemo(
    () => [
      { label: "Previous", amount: Number(summary?.previous_month_total ?? 0) },
      { label: "Current", amount: Number(summary?.current_month_total ?? 0) },
    ],
    [summary],
  );

  const currentMonthSpend = useMemo(() => Number(summary?.current_month_total ?? 0), [summary]);
  const projectedMonthSpend = useMemo(
    () => currentMonthSpend + totalCost,
    [currentMonthSpend, totalCost],
  );
  const budgetRemaining = useMemo(
    () => budgetLimit - projectedMonthSpend,
    [budgetLimit, projectedMonthSpend],
  );
  const isOverBudget = budgetRemaining < 0;

  const budgetRemovalSuggestions = useMemo(() => {
    if (!isOverBudget) return [] as GroceryItem[];

    const pantryNames = new Set(
      pantryItems
        .filter((item) => Number(item.quantity ?? 0) > 0)
        .map((item) => item.item_name.trim().toLowerCase()),
    );

    const ranked = [...groceryItems].sort((a, b) => {
      const aPantry = pantryNames.has(a.name.trim().toLowerCase()) ? 1 : 0;
      const bPantry = pantryNames.has(b.name.trim().toLowerCase()) ? 1 : 0;
      if (aPantry !== bPantry) return bPantry - aPantry;
      const aCost = Number(a.price) * Number(a.quantity);
      const bCost = Number(b.price) * Number(b.quantity);
      return bCost - aCost;
    });

    const picks: GroceryItem[] = [];
    let recovered = 0;
    const needed = Math.min(totalCost, Math.abs(budgetRemaining));
    for (const item of ranked) {
      picks.push(item);
      recovered += Number(item.price) * Number(item.quantity);
      if (recovered >= needed) break;
    }
    return picks;
  }, [budgetRemaining, groceryItems, isOverBudget, pantryItems, totalCost]);

  const pantryBasedRecipes = useMemo(() => {
    const pantryIngredients = new Set<string>();
    pantryItems.forEach((item) => {
      if (Number(item.quantity ?? 0) > 0) {
        pantryIngredients.add(item.item_name.toLowerCase());
      }
    });

    const normalizedRecipeQuery = recipeQuery.trim().toLowerCase();

    const ranked = recipeCatalog
      .filter((recipe) => {
        if (dietPreference === "all") return true;
        return recipe.diet.includes(dietPreference);
      })
      .filter((recipe) => {
        if (!normalizedRecipeQuery) return true;
        return recipe.name.toLowerCase().includes(normalizedRecipeQuery);
      })
      .map((recipe) => {
        const matched = recipe.ingredients.filter((ingredient) =>
          pantryIngredients.has(ingredient.toLowerCase()),
        );
        const missing = recipe.ingredients.filter(
          (ingredient) => !pantryIngredients.has(ingredient.toLowerCase()),
        );
        return {
          ...recipe,
          matchedCount: matched.length,
          totalCount: recipe.ingredients.length,
          matchPercent: Math.round((matched.length / recipe.ingredients.length) * 100),
          missingIngredients: missing,
          isPantryReady: missing.length === 0,
        };
      })
      .sort((a, b) => b.matchPercent - a.matchPercent);

    return {
      cookNow: ranked.filter((recipe) => recipe.isPantryReady),
      needItems: ranked.filter((recipe) => !recipe.isPantryReady),
      all: ranked,
    };
  }, [dietPreference, pantryItems, recipeQuery]);

  const productCategoryOptions = useMemo(() => {
    const options = Array.from(new Set(products.map((product) => toCategory(product.category))));
    return options.sort((a, b) => a.localeCompare(b));
  }, [products]);

  const productStoreOptions = useMemo(() => {
    const options = Array.from(
      new Set(
        products
          .map((product) => String(product.store ?? "").trim())
          .filter((store) => store.length > 0),
      ),
    );
    return options.sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeToken(productSearch);
    let rows = [...products];

    if (normalizedSearch) {
      rows = rows.filter((product) => product.name.toLowerCase().includes(normalizedSearch));
    }

    if (productCategoryFilter !== "all") {
      rows = rows.filter(
        (product) => normalizeToken(toCategory(product.category)) === normalizeToken(productCategoryFilter),
      );
    }

    if (productStoreFilter !== "all") {
      rows = rows.filter(
        (product) => normalizeToken(product.store) === normalizeToken(productStoreFilter),
      );
    }

    rows.sort((a, b) => {
      if (productSort === "price_asc") return Number(a.price ?? 0) - Number(b.price ?? 0);
      if (productSort === "price_desc") return Number(b.price ?? 0) - Number(a.price ?? 0);
      return a.name.localeCompare(b.name);
    });

    return rows;
  }, [products, productSearch, productCategoryFilter, productStoreFilter, productSort]);

  const refreshProductCatalog = useCallback(async () => {
    if (!token) return;
    const data = await apiRequest(`/api/products?limit=${PRODUCT_CATALOG_LIMIT}`, token);
    setProducts(data ?? []);
  }, [token]);

  const loadAll = useCallback(async () => {
    if (!token) return;

    setLoadingData(true);
    setActionError("");
    try {
      const [grocery, pantry, history, analytics] = await Promise.all([
        apiRequest("/api/grocery-items", token),
        apiRequest("/api/pantry", token),
        apiRequest("/api/purchase-history", token),
        apiRequest("/api/analytics/monthly-summary", token),
      ]);

      setGroceryItems(grocery ?? []);
      setPantryItems(pantry ?? []);
      setPurchaseHistory(history ?? []);
      if (session?.user?.id) {
        writeCachedHistory(session.user.id, history ?? []);
      }
      setSummary(analytics ?? null);
      setUsingCachedHistory(false);

      // Load catalog independently so product API issues do not block core app data.
      try {
        const catalog = await apiRequest(`/api/products?limit=${PRODUCT_CATALOG_LIMIT}`, token);
        setProducts(catalog ?? []);
      } catch {
        setProducts([]);
      }
    } catch (error) {
      if (session?.user?.id) {
        const cachedHistory = readCachedHistory(session.user.id);
        if (cachedHistory.length > 0) {
          setPurchaseHistory(cachedHistory);
          setUsingCachedHistory(true);
        } else {
          setUsingCachedHistory(false);
        }
      } else {
        setUsingCachedHistory(false);
      }
      setActionError(
        error instanceof Error
          ? `${error.message} Showing your last saved purchase history.`
          : "Failed to load data. Showing your last saved purchase history.",
      );
    } finally {
      setLoadingData(false);
    }
  }, [token, session]);

  useEffect(() => {
    if (!token) return;
    loadAll();
  }, [token, loadAll]);

  useEffect(() => {
    if (!token || products.length > 0) return;
    refreshProductCatalog().catch((error) => {
      setActionError(error instanceof Error ? error.message : "Could not load products.");
    });
  }, [token, products.length, refreshProductCatalog]);

  useEffect(() => {
    if (!nameQuery) {
      setDetailHints([]);
    }
  }, [nameQuery]);

  useEffect(() => {
    if (!pantryMatchForNewItem) {
      setAllowPantryDuplicateAdd(false);
    }
  }, [pantryMatchForNewItem]);

  useEffect(() => {
    if (!expandedHistoryId) return;
    const exists = filteredHistory.some((record) => record.id === expandedHistoryId);
    if (!exists) setExpandedHistoryId(null);
  }, [filteredHistory, expandedHistoryId]);

  useEffect(() => {
    setShoppingChecked((current) => {
      const next: Record<string, boolean> = {};
      groceryItems.forEach((item) => {
        if (current[item.id]) next[item.id] = true;
      });
      return next;
    });
  }, [groceryItems]);

  useEffect(() => {
    if (session || location.pathname !== "/") return;
    setHeroDropIndex(0);
    const intervalId = window.setInterval(() => {
      setHeroDropIndex((current) => (current + 1) % heroDropItems.length);
    }, 2200);
    return () => window.clearInterval(intervalId);
  }, [session, location.pathname]);

  async function handleAuthSubmit(
    emailVal: string,
    passwordVal: string,
    isSignUp: boolean,
    usernameVal?: string,
  ) {
    setAuthLoading(true);
    setAuthError("");
    setActionInfo("");

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: emailVal,
          password: passwordVal,
          options: {
            data: {
              username: usernameVal?.trim() || null,
              full_name: usernameVal?.trim() || null,
            },
          },
        });
        if (error) throw error;

        // Supabase can return a user without identities for existing emails.
        const identityCount = data?.user?.identities?.length ?? 0;
        if (data?.user && identityCount === 0) {
          setAuthError("This email is already registered. Please log in instead.");
          toast.error("This email is already registered.");
          return;
        }

        setAuthError("");
        setIsLogin(true);
        setPassword("");
        setUsername("");
        setConfirmPassword("");
        setAcceptTerms(false);
        setActionInfo("Registration successful. Check your email and verify your account, then log in.");
        toast.success("Registration successful. Check your email to confirm your account.");
        setAuthModalOpen(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: emailVal, password: passwordVal });
        if (error) throw error;

        toast.success("Login successful. Welcome back.");
        setAuthModalOpen(false);
        navigate("/");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed.";
      let displayMessage = message;

      if (message.toLowerCase().includes("email not confirmed")) {
        displayMessage = "Email not confirmed. Please click the confirmation link in your inbox.";
      } else if (message.toLowerCase().includes("invalid login")) {
        displayMessage = "Invalid email or password. Please try again.";
      }

      setAuthError(displayMessage);
      toast.error(displayMessage);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLandingAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const isSignUp = !isLogin;

    if (isSignUp) {
      const trimmedName = username.trim();
      if (trimmedName.length < 3) {
        setAuthError("Please enter a username with at least 3 characters.");
        return;
      }
      if (!/^[a-zA-Z0-9_.-]+$/.test(trimmedName)) {
        setAuthError("Username can contain only letters, numbers, underscore, dot, and hyphen.");
        return;
      }
      if (password.length < 8) {
        setAuthError("Password must be at least 8 characters.");
        return;
      }
      if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        setAuthError("Password must include at least one letter and one number.");
        return;
      }
      if (password !== confirmPassword) {
        setAuthError("Passwords do not match.");
        return;
      }
      if (!acceptTerms) {
        setAuthError("Please accept the terms to continue.");
        return;
      }
    }

    await handleAuthSubmit(email, password, isSignUp, username);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setGroceryItems([]);
    setPantryItems([]);
    setPurchaseHistory([]);
    setSummary(null);
    setUsingCachedHistory(false);
    setAuthModalOpen(false);
    navigate("/");
  }

  function applyHistoryHint(item: GroceryItem) {
    setNewItemCategory(toCategory(item.category));
    if (Number(newItemPrice || 0) <= 0 && Number(item.price ?? 0) > 0) {
      setNewItemPrice(String(Number(item.price)));
    }
    setActionInfo(`Filled details from your past purchase: ${item.name}`);
  }

  function applyProductHint(product: ProductItem) {
    setNewItemCategory(toCategory(product.category));
    if (Number(product.price ?? 0) > 0) {
      setNewItemPrice(String(Number(product.price)));
    }
    setNewItemName(product.name);
    setActionInfo(`Filled details from catalog: ${product.name} (${product.store})`);
  }

  async function fetchDetailHints() {
    const query = newItemName.trim();
    if (!query) {
      setActionError("Enter product name first to get detail suggestions.");
      return;
    }

    setActionError("");
    setDetailHintsLoading(true);
    try {
      const result = await apiRequest(`/api/products?search=${encodeURIComponent(query)}&limit=8`, token);
      setDetailHints(result ?? []);
      if ((result ?? []).length === 0) {
        setActionInfo("No exact catalog match found. You can still use auto category suggestion.");
      } else {
        setActionInfo("Product matches loaded. Use a suggestion to auto-fill details.");
      }
      return result ?? [];
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not fetch detail suggestions.");
      return [];
    } finally {
      setDetailHintsLoading(false);
    }
  }

  async function smartFillDetails() {
    const query = newItemName.trim();
    if (!query) {
      setActionError("Enter product name first, then click Smart Fill.");
      return;
    }

    setActionError("");
    const historyMatch = historyHints[0];
    if (historyMatch) {
      applyHistoryHint(historyMatch);
      return;
    }

    const catalogMatch = catalogHints[0] ?? detailHints[0];
    if (catalogMatch) {
      applyProductHint(catalogMatch);
      return;
    }

    const remoteHints = await fetchDetailHints();
    const remoteMatch = remoteHints[0];
    if (remoteMatch) {
      applyProductHint(remoteMatch);
      return;
    }

    const guessedCategory = guessCategoryFromName(query);
    setNewItemCategory(guessedCategory);
    setActionInfo(`Auto category applied: ${guessedCategory}. Add price if known, then save.`);
  }

  async function addGroceryItem(event: FormEvent) {
    event.preventDefault();
    setActionError("");
    setActionInfo("");

    const name = newItemName.trim();
    if (!name) {
      setActionError("Please enter an item name");
      return;
    }

    const duplicatePantry = pantryItems.find(
      (item) => item.item_name.toLowerCase() === name.toLowerCase() && toAmount(item.quantity) > 0,
    );

    if (duplicatePantry) {
      if (allowPantryDuplicateAdd) {
        setAllowPantryDuplicateAdd(false);
      } else {
      toast.warning(
        `"${name}" already exists in pantry with quantity ${duplicatePantry.quantity}`,
      );
      setActionError(
        `Duplicate prevention: "${name}" already exists in pantry with quantity ${duplicatePantry.quantity}.`,
      );
      return;
      }
    }

    try {
      await apiRequest("/api/grocery-items", token, {
        method: "POST",
        body: JSON.stringify({
          name,
          category: newItemCategory,
          quantity: Number(newItemQty || 1),
          price: Number(newItemPrice || 0),
        }),
      });

      toast.success(`✓ Added ${name} to grocery list`);
      setNewItemName("");
      setNewItemCategory("Other");
      setNewItemQty("1");
      setNewItemPrice("0");
      setAllowPantryDuplicateAdd(false);
      await loadAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not add grocery item.";
      toast.error(message);
      setActionError(message);
    }
  }

  function startEditGrocery(item: GroceryItem) {
    setEditItemId(item.id);
    setEditItemName(item.name);
    setEditItemCategory((item.category as Category) || "Other");
    setEditItemQty(String(item.quantity));
    setEditItemPrice(String(item.price));
  }

  async function saveEditGrocery(id: string) {
    try {
      await apiRequest(`/api/grocery-items/${id}`, token, {
        method: "PATCH",
        body: JSON.stringify({
          name: editItemName,
          category: editItemCategory,
          quantity: Number(editItemQty || 1),
          price: Number(editItemPrice || 0),
        }),
      });
      setEditItemId("");
      toast.success("✓ Grocery item updated");
      await loadAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update grocery item.";
      toast.error(message);
      setActionError(message);
    }
  }

  async function deleteGrocery(id: string) {
    try {
      await apiRequest(`/api/grocery-items/${id}`, token, { method: "DELETE" });
      toast.success("✓ Item removed from grocery list");
      await loadAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not delete grocery item.";
      toast.error(message);
      setActionError(message);
    }
  }

  async function addPantryItem(event: FormEvent) {
    event.preventDefault();
    setActionError("");
    setActionInfo("");
    const itemName = pantryName.trim();
    if (!itemName) {
      setActionError("Please enter a pantry item name");
      return;
    }

    try {
      const response = await apiRequest("/api/pantry", token, {
        method: "POST",
        body: JSON.stringify({
          item_name: itemName,
          quantity: Number(pantryQty || 1),
          expiry_date: pantryExpiry || null,
        }),
      });

      if (response?.merged_duplicate) {
        toast.info(`✓ Merged ${itemName} with existing pantry item`);
      } else {
        toast.success(`✓ Added ${itemName} to pantry`);
      }
      
      setPantryName("");
      setPantryQty("1");
      setPantryExpiry("");
      await loadAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not add pantry item.";
      toast.error(message);
      setActionError(message);
    }
  }

  function startEditPantry(item: PantryItem) {
    setEditPantryId(item.id);
    setEditPantryName(item.item_name);
    setEditPantryQty(String(item.quantity));
    setEditPantryExpiry(item.expiry_date ?? "");
  }

  async function saveEditPantry(id: string) {
    try {
      await apiRequest(`/api/pantry/${id}`, token, {
        method: "PATCH",
        body: JSON.stringify({
          item_name: editPantryName,
          quantity: Number(editPantryQty || 0),
          expiry_date: editPantryExpiry || null,
        }),
      });
      setEditPantryId("");
      toast.success("✓ Pantry item updated");
      await loadAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update pantry item.";
      toast.error(message);
      setActionError(message);
    }
  }

  async function deletePantry(id: string) {
    try {
      await apiRequest(`/api/pantry/${id}`, token, { method: "DELETE" });
      toast.success("✓ Item removed from pantry");
      await loadAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not delete pantry item.";
      toast.error(message);
      setActionError(message);
    }
  }

  async function finalizePurchase() {
    try {
      const totalAmount = totalCost;
      await apiRequest("/api/grocery-items/finalize", token, {
        method: "POST",
        body: JSON.stringify({ clear_list: true }),
      });
      setConfirmFinalize(false);
      toast.success(`✓ Purchase finalized! Total: ${formatInr(totalAmount)}`);
      await loadAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not finalize purchase.";
      toast.error(message);
      setActionError(message);
    }
  }

  function handleFinalizeClick() {
    if (groceryItems.length === 0) {
      setActionError("Add items to your grocery list before finalizing.");
      return;
    }
    setConfirmFinalize(true);
  }

  function requestBudgetUpdate() {
    const parsed = Number(budgetInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setActionError("Enter a valid budget amount greater than 0.");
      return;
    }
    setConfirmBudgetUpdate(true);
  }

  function confirmBudgetUpdateAction() {
    const parsed = Number(budgetInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setActionError("Enter a valid budget amount greater than 0.");
      setConfirmBudgetUpdate(false);
      return;
    }
    setBudgetLimit(parsed);
    setConfirmBudgetUpdate(false);
    setActionInfo(`Budget updated to ${formatInr(parsed)}.`);
    toast.success(`Budget updated: ${formatInr(parsed)}`);
  }

  async function searchProducts(term: string) {
    const normalizedTerm = term.trim();
    setProductSearch(normalizedTerm);
    setActionError("");

    try {
      if (normalizedTerm.length > 0) {
        const data = await apiRequest(
          `/api/products?search=${encodeURIComponent(normalizedTerm)}&limit=${PRODUCT_CATALOG_LIMIT}`,
          token,
        );
        setProducts(Array.isArray(data) ? data : []);
        return;
      }

      if (products.length === 0 || productCategoryFilter !== "all" || productStoreFilter !== "all") {
        await refreshProductCatalog();
      }
    } catch (error) {
      // Fallback: keep local filtering usable by trying a full-catalog refresh.
      try {
        await refreshProductCatalog();
      } catch {
        setActionError(error instanceof Error ? error.message : "Could not search products.");
      }
    }
  }

  async function clearProductFilters() {
    setProductSearch("");
    setProductCategoryFilter("all");
    setProductStoreFilter("all");
    setProductSort("name");
    try {
      await refreshProductCatalog();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not reset product filters.");
    }
  }

  function exportPdf() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Grocery List", 14, 20);

    let y = 32;
    groceryItems.forEach((item, idx) => {
      const line = `${idx + 1}. ${item.name} | Qty: ${item.quantity} | Cost: ${formatInr(
        Number(item.quantity) * Number(item.price),
      )}`;
      doc.setFontSize(11);
      doc.text(line, 14, y);
      y += 8;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    y += 4;
    doc.setFontSize(12);
    doc.text(`Total: ${formatInr(totalCost)}`, 14, y);
    doc.save("grocery-list.pdf");
  }

  function redirectToStore() {
    const fallbackName = groceryItems[0]?.name ?? "";
    const itemName = fallbackName;
    if (!itemName) {
      setActionError("Add at least one grocery item for store search.");
      return;
    }
    window.open(buildStoreSearchUrl(selectedStore, itemName), "_blank", "noopener,noreferrer");
  }

  function lookupSingleItemPrice() {
    const name = newItemName.trim();
    if (!name) {
      setActionError("Enter item name first, then click 'Check price online'.");
      return;
    }
    window.open(buildStoreSearchUrl(selectedStore, name), "_blank", "noopener,noreferrer");
  }

  function toggleShoppingItem(id: string) {
    setShoppingChecked((current) => ({ ...current, [id]: !current[id] }));
  }

  async function copyCurrentList() {
    const text = groceryItems
      .map((item, index) => `${index + 1}. ${item.name} - Qty ${item.quantity}`)
      .join("\n");

    if (!text) {
      setActionError("Your current list is empty.");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Current list copied.");
    } catch {
      setActionError("Could not copy list to clipboard.");
    }
  }

  function getCurrentListShareText() {
    const lines = groceryItems.map(
      (item, index) =>
        `${index + 1}. ${item.name} - Qty ${item.quantity} - ${formatInr(
          Number(item.price) * Number(item.quantity),
        )}`,
    );
    const total = `Total: ${formatInr(totalCost)}`;
    return ["My Current Grocery List", ...lines, total].join("\n");
  }

  async function shareCurrentList() {
    const text = getCurrentListShareText();
    if (groceryItems.length === 0) {
      setActionError("Your current list is empty.");
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Current Grocery List",
          text,
        });
        return;
      } catch {
        // user canceled or share failed, fallback to copy
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Share not available here. Copied list to clipboard.");
    } catch {
      setActionError("Could not share or copy the list.");
    }
  }

  async function addMissingIngredients(recipeName: string, ingredients: string[]) {
    if (!token) return;
    const normalizedCurrent = new Set(groceryItems.map((item) => item.name.trim().toLowerCase()));
    const missing = ingredients.filter((item) => !normalizedCurrent.has(item.toLowerCase()));

    if (missing.length === 0) {
      toast.info("All ingredients are already in your grocery list.");
      return;
    }

    try {
      await Promise.all(
        missing.map((name) =>
          apiRequest("/api/grocery-items", token, {
            method: "POST",
            body: JSON.stringify({
              name,
              category: guessCategoryFromName(name),
              quantity: 1,
              price: 0,
            }),
          }),
        ),
      );
      toast.success(`Added ${missing.length} missing ingredient(s) from ${recipeName}.`);
      await loadAll();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not add missing ingredients to grocery list.";
      setActionError(message);
      toast.error(message);
    }
  }

  function updateMealPlan(day: string, recipeName: string) {
    setPlannedMeals((current) => ({ ...current, [day]: recipeName }));
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Loading your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="floating-orb absolute -top-20 left-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />
        <div className="floating-orb absolute bottom-8 right-10 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <Navigation
        displayName={sessionDisplayName}
        isLoggedIn={!!session}
        onLogout={handleLogout}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSubmit={handleAuthSubmit}
        isLoading={authLoading}
        error={authError}
      />

      <ProtectedRoute
        isLoggedIn={!!session}
        isOpen={protectedRouteModalOpen}
        onAction={() => {
          setProtectedRouteModalOpen(false);
          navigate("/auth?mode=login");
        }}
        onCancel={() => {
          setProtectedRouteModalOpen(false);
          navigate("/");
        }}
      />

      <ConfirmationDialog
        isOpen={confirmFinalize}
        title="Finalize Purchase"
        description="Are you sure you want to save this purchase to history? This will clear your current grocery list."
        actionLabel="Save Purchase"
        isDestructive={false}
        onConfirm={finalizePurchase}
        onCancel={() => setConfirmFinalize(false)}
      />

      <ConfirmationDialog
        isOpen={confirmBudgetUpdate}
        title="Confirm Budget Update"
        description={`Set your grocery budget to ${formatInr(Number(budgetInput || 0))}?`}
        actionLabel="Confirm Budget"
        isDestructive={false}
        onConfirm={confirmBudgetUpdateAction}
        onCancel={() => setConfirmBudgetUpdate(false)}
      />

      {!session ? (
        location.pathname === "/features" ? (
          <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-sky-100 via-cyan-50 to-blue-100 px-4 pt-24">
            <div className="absolute -top-20 -left-20 h-48 w-48 rounded-full bg-white/50 blur-3xl floating-orb" />
            <div className="absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-white/50 blur-3xl floating-orb animation-delay-2000" />
            <div className="w-full max-w-2xl space-y-8">
              <div className="text-center space-y-3">
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-sky-700 to-blue-600 text-transparent bg-clip-text">
                  App Features
                </h1>
                <p className="text-lg text-muted-foreground">
                  Explore the core capabilities of Grocery Manager.
                </p>
              </div>
              <ul className="glass-panel space-y-4 p-6 text-sm text-muted-foreground">
                <li>- Track grocery items with price and quantity</li>
                <li>- Maintain pantry inventory with expiry alerts</li>
                <li>- Analyze monthly spending trends</li>
                <li>- Export grocery list as PDF and finalize purchases</li>
                <li>- Responsive design and protected routes</li>
              </ul>
              <div className="flex justify-center gap-3 pt-6">
                <Button variant="outline" onClick={() => navigate("/")}>Back to Home</Button>
                <Button onClick={() => navigate("/auth")}>Go to Login / Signup</Button>
              </div>
            </div>
          </main>
        ) : location.pathname === "/auth" ? (
          <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-sky-200 via-cyan-100 to-blue-200 px-4 pt-24">
            <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-white/50 blur-3xl floating-orb" />
            <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-white/50 blur-3xl floating-orb animation-delay-2000" />

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="glass-panel w-full max-w-md p-8 relative"
            >
              <div className="flex justify-center mb-4">
                <ShoppingCart className="h-12 w-12 text-primary" />
              </div>
              <h1 className="text-3xl font-extrabold text-center mb-2 bg-gradient-to-r from-sky-700 to-blue-600 text-transparent bg-clip-text">
                Smart Grocery Manager
              </h1>
              <p className="text-sm text-muted-foreground text-center mb-5">
                Sign in to manage your personal grocery data and budget trends.
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                After registration, check your email and confirm your account before login.
              </p>

              <form className="space-y-3" onSubmit={handleLandingAuthSubmit}>
                {!isLogin ? (
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                  />
                ) : null}
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="mt-1 text-xs text-primary hover:underline"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <span className="inline-flex items-center gap-1">
                      <EyeOff className="h-3.5 w-3.5" /> Hide password
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" /> Show password
                    </span>
                  )}
                </button>
                {!isLogin ? (
                  <>
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="mt-1 text-xs text-primary hover:underline"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? (
                        <span className="inline-flex items-center gap-1">
                          <EyeOff className="h-3.5 w-3.5" /> Hide confirm password
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" /> Show confirm password
                        </span>
                      )}
                    </button>
                    <label className="flex items-start gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(event) => setAcceptTerms(event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-border"
                      />
                      <span>I agree to the terms and privacy policy.</span>
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Use at least 8 characters, including a letter and a number.
                    </p>
                  </>
                ) : null}
                <Button
                  className="w-full bg-gradient-to-r from-sky-600 to-cyan-500 text-white transition-transform hover:scale-[1.02]"
                  disabled={authLoading}
                >
                  {authLoading ? "Please wait..." : isLogin ? "Login" : "Register"}
                </Button>
              </form>

              {authError ? <p className="text-sm text-destructive mt-3">{authError}</p> : null}
              {actionInfo ? <p className="text-sm text-primary mt-2">{actionInfo}</p> : null}

              <div className="flex justify-between mt-4 text-xs">
                <button
                  className="text-primary hover:underline"
                  onClick={() => {
                    setIsLogin((prev) => !prev);
                    setAuthError("");
                    setActionInfo("");
                    setConfirmPassword("");
                    setAcceptTerms(false);
                  }}
                  type="button"
                >
                  {isLogin ? "Create account" : "Already have an account? Login"}
                </button>
                <button
                  className="text-primary hover:underline"
                  onClick={() => navigate("/")}
                  type="button"
                >
                  Back to Home
                </button>
              </div>
            </motion.div>
          </main>
        ) : (
          <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-sky-200 via-cyan-100 to-blue-200 px-4 pt-24">
            <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-white/50 blur-3xl floating-orb" />
            <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-white/50 blur-3xl floating-orb animation-delay-2000" />

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="glass-panel w-full max-w-6xl p-8 md:p-12"
            >
              <div className="grid items-center gap-10 lg:grid-cols-2">
                <div>
                  <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Grocery List Manager</p>
                  <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-sky-700 to-blue-600 text-transparent bg-clip-text">
                    Smart Grocery Manager
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm md:text-base text-muted-foreground">
                    Plan faster, track pantry health, compare products, and monitor monthly spending from one simple workspace.
                  </p>
                  <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                    <p>- Build grocery lists with smart suggestions</p>
                    <p>- Finalize purchases and keep detailed history</p>
                    <p>- Get pantry expiry and low-stock alerts</p>
                  </div>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Button onClick={() => navigate("/auth")} className="brand-gradient-btn rounded-full px-6">
                      Login / Signup
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/features")} className="rounded-full px-6">
                      View Features
                    </Button>
                  </div>
                </div>

                <div className="bag-stage">
                  <div className="bag-handle" />
                  <div className="bag-body" />
                  <div className="bag-glow" />
                  <img
                    key={heroDropIndex}
                    src={heroCurrentItem.icon}
                    alt={`${heroCurrentItem.name} item`}
                    className="bag-item-img bag-item-active"
                  />
                  <div className="bag-status">
                    <p className="bag-status-add">+ {heroCurrentItem.name}</p>
                    <p className="bag-status-total">Total {formatInr(heroRunningTotal)}</p>
                  </div>
                </div>
              </div>
            </motion.section>
          </main>
        )
      ) : (
        <main className="mx-auto max-w-7xl space-y-4 px-4 py-6 pt-24">
        <section className="glass-panel shimmer-border hover-lift p-4">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="metric-chip">
              List total: <strong>{formatInr(totalCost)}</strong>
            </span>
            <span className="metric-chip">
              Items: <strong>{groceryItems.length}</strong>
            </span>
            <span className="metric-chip">
              Low stock: <strong>{lowStock.length}</strong>
            </span>
            <span className="metric-chip">
              This month: <strong>{formatInr(summary?.current_month_total ?? 0)}</strong>
            </span>
          </div>
        </section>

        <section className="glass-panel hover-lift p-3">
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => (
              <NavLink
                key={tab}
                to={tabRouteMap[tab]}
                onClick={() => {
                  if (!session && (tab === "pantry" || tab === "history" || tab === "budget")) {
                    setProtectedRouteModalOpen(true);
                  }
                }}
                className={({ isActive }) =>
                  [
                    "tab-pill",
                    isActive
                      ? "tab-pill-active"
                      : "tab-pill-idle",
                  ].join(" ")
                }
              >
                {tabLabels[tab]}
              </NavLink>
            ))}
            <Button variant="outline" onClick={loadAll} disabled={loadingData} className="ml-auto gap-2 rounded-full border-accent/40 hover:border-accent">
              <RefreshCw className={`h-4 w-4 ${loadingData ? "animate-spin" : ""}`} />
              {loadingData ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </section>

        {actionError ? <p className="text-sm rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">{actionError}</p> : null}
        {actionInfo ? <p className="text-sm rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-primary">{actionInfo}</p> : null}
        {usingCachedHistory ? (
          <p className="text-sm rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-warning">
            <Info className="mr-2 inline h-4 w-4 align-text-bottom" />
            Offline mode: showing cached purchase history (last synced data).
          </p>
        ) : null}

        {location.pathname === "/" && session && (
          <Dashboard
            groceryItems={groceryItems}
            pantryItems={pantryItems}
            summary={summary}
          />
        )}

        <AnimatePresence mode="wait">
          <motion.section
            key={activeTab}
            initial={{ opacity: 0, y: 14, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.995 }}
            transition={{ duration: 0.26, ease: "easeOut" }}
            className="space-y-4"
          >
        {activeTab === "grocery" && (
          <section className="glass-panel shimmer-border space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Grocery Workspace</h2>
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
                {groceryItems.length} items
              </Badge>
            </div>
            <form className="rounded-xl border border-border/70 bg-background/50 p-4 grid gap-3 md:grid-cols-4" onSubmit={addGroceryItem}>
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground">Item Name</label>
                <Input
                  placeholder="Milk, Tomato, Rice..."
                  value={newItemName}
                  onChange={(event) => setNewItemName(event.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Category</label>
                <select
                  className="w-full border border-input rounded-md px-3 py-2 bg-background"
                  value={newItemCategory}
                  onChange={(event) => setNewItemCategory(event.target.value as Category)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Quantity</label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Example: 2"
                  value={newItemQty}
                  onChange={(event) => setNewItemQty(event.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Price per item (INR)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Example: 45 (optional)"
                  value={newItemPrice}
                  onChange={(event) => setNewItemPrice(event.target.value)}
                />
              </div>
              <Button type="submit" className="md:col-span-4 brand-gradient-btn">
                Add grocery item
              </Button>
              {pantryMatchForNewItem ? (
                <div className="md:col-span-4 rounded-lg border border-warning/40 bg-warning/10 p-3">
                  <p className="text-sm font-medium text-warning">
                    Suggestion: "{pantryMatchForNewItem.item_name}" already exists in pantry (qty{" "}
                    {pantryMatchForNewItem.quantity}).
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    You may not need to buy this again now. Use pantry stock first to avoid extra cost and waste.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setNewItemName("");
                        setAllowPantryDuplicateAdd(false);
                        setActionInfo("Used pantry suggestion. Item removed from add form.");
                      }}
                    >
                      Use Pantry Stock
                    </Button>
                    <Button
                      type="button"
                      variant={allowPantryDuplicateAdd ? "default" : "outline"}
                      onClick={() => setAllowPantryDuplicateAdd((current) => !current)}
                    >
                      {allowPantryDuplicateAdd ? "Add Anyway: Enabled" : "Add Anyway"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </form>

            <div className="rounded-xl border border-border/70 bg-background/40 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Quick store search:</span>
                <select
                  className="border border-input rounded-md px-2 py-2 bg-background"
                  value={selectedStore}
                  onChange={(event) => setSelectedStore(event.target.value as Store)}
                >
                  <option value="BigBasket">BigBasket</option>
                  <option value="JioMart">JioMart</option>
                  <option value="Blinkit">Blinkit</option>
                  <option value="Instamart">Instamart</option>
                </select>
                <Button type="button" variant="outline" onClick={lookupSingleItemPrice}>
                  Check current item price
                </Button>
                <Button type="button" variant="outline" onClick={redirectToStore}>
                  Search first list item
                </Button>
              </div>
            </div>

            <div className="section-card hover-lift space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-semibold">Total Cost: {formatInr(totalCost)}</h2>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={exportPdf} className="gap-2 hover:border-accent/60">
                    <Download className="h-4 w-4" /> Export PDF
                  </Button>
                  <Button 
                    onClick={handleFinalizeClick} 
                    disabled={groceryItems.length === 0}
                    className="gap-2 brand-gradient-btn"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Finalize List
                  </Button>
                </div>
              </div>

              <GroceryTable
                items={groupedGrocery}
                editingId={editItemId}
                editName={editItemName}
                editCategory={editItemCategory}
                editQty={editItemQty}
                editPrice={editItemPrice}
                categories={categories}
                totalCost={totalCost}
                formatInr={formatInr}
                onEdit={startEditGrocery}
                onSave={saveEditGrocery}
                onCancel={() => setEditItemId("")}
                onDelete={deleteGrocery}
                onEditNameChange={setEditItemName}
                onEditCategoryChange={setEditItemCategory}
                onEditQtyChange={setEditItemQty}
                onEditPriceChange={setEditItemPrice}
              />
            </div>
          </section>
        )}

        {activeTab === "current" && (
          <section className="glass-panel shimmer-border space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl font-semibold">Current Shopping List</h2>
                <p className="text-sm text-muted-foreground">
                  View your active grocery list directly without opening purchase history.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={shareCurrentList}
                  className="gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share List
                </Button>
                <Button variant="outline" onClick={copyCurrentList} className="gap-2">
                  <Copy className="h-4 w-4" />
                  Copy List
                </Button>
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
                  {checkedCount}/{groceryItems.length} checked ({currentListCompletion}%)
                </Badge>
              </div>
            </div>

            {groceryItems.length === 0 ? (
              <div className="section-card flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No active items. Add groceries from the Grocery tab.
                </p>
              </div>
            ) : (
              <div className="section-card space-y-2">
                {groceryItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleShoppingItem(item.id)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left ${
                      shoppingChecked[item.id]
                        ? "border-primary/40 bg-primary/10"
                        : "border-border/60 bg-background/40"
                    }`}
                  >
                    <span className="font-medium">
                      {shoppingChecked[item.id] ? "✓ " : ""}
                      {item.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Qty {item.quantity} | {formatInr(Number(item.price) * Number(item.quantity))}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "recipes" && (
          <section className="glass-panel shimmer-border space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">Recipe Suggestions</h2>
                <p className="text-sm text-muted-foreground">
                  Suggestions are based only on ingredients currently in your pantry.
                </p>
              </div>
              <div className="w-full space-y-2 md:max-w-xl">
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Ask Recipe By Name</label>
                    <Input
                      value={recipeQuery}
                      onChange={(event) => setRecipeQuery(event.target.value)}
                      placeholder="Type recipe name: paneer, rajma, dosa..."
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Diet Preference</label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={dietPreference}
                      onChange={(event) => setDietPreference(event.target.value as DietPreference)}
                    >
                      <option value="all">All</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="high-protein">High Protein</option>
                      <option value="low-carb">Low Carb</option>
                      <option value="gluten-free">Gluten Free</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-5">
              <div className="section-card">
                <p className="text-xs text-muted-foreground">Pantry-Ready Recipes</p>
                <p className="text-lg font-semibold">{pantryBasedRecipes.cookNow.length}</p>
              </div>
              <div className="section-card">
                <p className="text-xs text-muted-foreground">Recipes Needing Items</p>
                <p className="text-lg font-semibold">{pantryBasedRecipes.needItems.length}</p>
              </div>
              <div className="section-card">
                <p className="text-xs text-muted-foreground">Pantry Ingredients Tracked</p>
                <p className="text-lg font-semibold">{pantryItems.length}</p>
              </div>
              <div className="section-card">
                <p className="text-xs text-muted-foreground">Recipes in Results</p>
                <p className="text-lg font-semibold">{pantryBasedRecipes.all.length}</p>
              </div>
            </div>

            {pantryBasedRecipes.all.length === 0 ? (
              <div className="section-card">
                <p className="text-sm text-muted-foreground">
                  No recipe found for "{recipeQuery}". Try another name (example: dal, paneer, chicken, dosa).
                </p>
              </div>
            ) : null}

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Cook Now (Pantry Only)</h3>
              {pantryBasedRecipes.cookNow.length === 0 ? (
                <div className="section-card">
                  <p className="text-sm text-muted-foreground">
                    No complete recipe available with current pantry items for this filter.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {pantryBasedRecipes.cookNow.map((recipe) => (
                    <div key={recipe.id} className="section-card space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">{recipe.name}</p>
                        <Badge variant="secondary">Ready</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Nutrition est.: {recipe.calories} kcal | {recipe.protein}g protein
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {recipe.matchedCount}/{recipe.totalCount} pantry ingredients available
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {recipe.diet.map((tag) => (
                          <span key={`${recipe.id}-${tag}`} className="rounded-full bg-secondary px-2 py-1">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Need Ingredients (Suggested to Buy)</h3>
              {pantryBasedRecipes.needItems.length === 0 ? (
                <div className="section-card">
                  <p className="text-sm text-muted-foreground">
                    Great. All filtered recipes can be cooked with pantry items only.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {pantryBasedRecipes.needItems.map((recipe) => (
                    <div key={recipe.id} className="section-card space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">{recipe.name}</p>
                        <Badge variant="secondary">{recipe.matchPercent}% pantry match</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Missing {recipe.missingIngredients.length} ingredient(s)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {recipe.missingIngredients.map((ingredient) => (
                          <span
                            key={`${recipe.id}-${ingredient}`}
                            className="rounded-full border border-border/70 bg-background/50 px-2 py-1 text-xs"
                          >
                            {ingredient}
                          </span>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => addMissingIngredients(recipe.name, recipe.missingIngredients)}
                      >
                        <ChefHat className="h-4 w-4" />
                        Add Missing to Grocery List
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="section-card space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Meal Plan (Weekly)</p>
                <p className="text-xs text-muted-foreground">Saved locally per user.</p>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {Object.keys(plannedMeals).map((day) => (
                  <div key={day}>
                    <label className="mb-1 block text-xs text-muted-foreground">{day}</label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={plannedMeals[day]}
                      onChange={(event) => updateMealPlan(day, event.target.value)}
                    >
                      <option value="">No meal selected</option>
                      {pantryBasedRecipes.cookNow.map((recipe) => (
                        <option key={`${day}-${recipe.id}`} value={recipe.name}>
                          {recipe.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === "pantry" && (
          <section className="glass-panel shimmer-border space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Pantry Control Center</h2>
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
                {pantryItems.length} tracked
              </Badge>
            </div>
            <form className="rounded-xl border border-border/70 bg-background/50 p-4 grid gap-3 md:grid-cols-4" onSubmit={addPantryItem}>
              <Input placeholder="Pantry item name" value={pantryName} onChange={(event) => setPantryName(event.target.value)} className="md:col-span-2" />
              <Input type="number" min="0" step="1" value={pantryQty} onChange={(event) => setPantryQty(event.target.value)} />
              <Input type="date" value={pantryExpiry} onChange={(event) => setPantryExpiry(event.target.value)} />
              <Button type="submit" className="md:col-span-4 brand-gradient-btn">
                <Plus className="mr-2 inline h-4 w-4" />
                Add to Pantry
              </Button>
            </form>

            {(lowStock.length > 0 || expiringSoon.length > 0) && (
              <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 space-y-2">
                <h3 className="text-lg font-semibold text-warning">
                  <TriangleAlert className="mr-2 inline h-5 w-5 align-text-bottom" />
                  Pantry Alerts
                </h3>
                {lowStock.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-warning">Low Stock Items:</p>
                    <ul className="text-sm text-warning space-y-1 mt-1">
                      {lowStock.map((item) => (
                        <li key={item.id}>- {item.item_name} (qty: {item.quantity})</li>
                      ))}
                    </ul>
                  </div>
                )}
                {expiringSoon.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-destructive">Expiring Soon (3 days):</p>
                    <ul className="text-sm text-destructive space-y-1 mt-1">
                      {expiringSoon.map((item) => (
                        <li key={item.id}>- {item.item_name} (expires {item.expiry_date})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <PantryTable
              items={pantryItems}
              editingId={editPantryId}
              editName={editPantryName}
              editQty={editPantryQty}
              editExpiry={editPantryExpiry}
              onEdit={startEditPantry}
              onSave={saveEditPantry}
              onCancel={() => setEditPantryId("")}
              onDelete={deletePantry}
              onEditNameChange={setEditPantryName}
              onEditQtyChange={setEditPantryQty}
              onEditExpiryChange={setEditPantryExpiry}
            />
          </section>
        )}

        {activeTab === "budget" && (
          <section className="glass-panel shimmer-border p-5 space-y-4">
            <h2 className="text-xl font-semibold">Budget & Analytics</h2>
            <div className="section-card space-y-3">
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-full max-w-xs">
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Your Budget Limit (INR)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={budgetInput}
                    onChange={(event) => setBudgetInput(event.target.value)}
                    placeholder="Enter your budget"
                  />
                </div>
                <Button type="button" onClick={requestBudgetUpdate} className="brand-gradient-btn">
                  Update Budget
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Active budget: <strong>{formatInr(budgetLimit)}</strong>
              </p>
            </div>

            <div className="grid gap-2 md:grid-cols-3">
              <div className="section-card">
                <p className="text-xs text-muted-foreground">Current List Total</p>
                <p className="text-lg font-semibold">{formatInr(totalCost)}</p>
              </div>
              <div className="section-card">
                <p className="text-xs text-muted-foreground">Budget Remaining</p>
                <p className={`text-lg font-semibold ${isOverBudget ? "text-destructive" : "text-success"}`}>
                  {isOverBudget ? `-${formatInr(Math.abs(budgetRemaining))}` : formatInr(budgetRemaining)}
                </p>
              </div>
              <div className="section-card">
                <p className="text-xs text-muted-foreground">Current Month Spend</p>
                <p className="text-lg font-semibold">{formatInr(currentMonthSpend)}</p>
              </div>
              <div className="section-card">
                <p className="text-xs text-muted-foreground">Projected Month Spend</p>
                <p className="text-lg font-semibold">{formatInr(projectedMonthSpend)}</p>
              </div>
              <div className="section-card">
                <p className="text-xs text-muted-foreground">Monthly Change</p>
                <p className="text-lg font-semibold">
                  {summary?.trend === "down" ? "-" : "+"}
                  {formatInr(Math.abs(summary?.change_amount ?? 0))}
                </p>
              </div>
            </div>

            {isOverBudget ? (
              <div className="section-card space-y-3 border border-destructive/30 bg-destructive/10">
                <p className="text-sm font-semibold text-destructive">
                  Projected monthly spend is over budget by {formatInr(Math.abs(budgetRemaining))}. Remove less useful items or increase your budget.
                </p>
                {budgetRemovalSuggestions.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Suggested removals to meet budget:
                    </p>
                    {budgetRemovalSuggestions.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 bg-background/60 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty {item.quantity} | {formatInr(Number(item.price) * Number(item.quantity))}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteGrocery(item.id)}
                        >
                          Remove Item
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Tip: you can also update budget and confirm if you still want all items.
                </p>
              </div>
            ) : (
              <div className="section-card border border-success/30 bg-success/10">
                <p className="text-sm font-medium text-success">
                  You are within monthly budget. Remaining: {formatInr(budgetRemaining)}.
                </p>
              </div>
            )}

            <div className="section-card">
              <p className="mb-2 text-sm font-medium">Previous vs Current Month</p>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatInr(Number(value))} />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted-foreground">
                {summary?.trend === "down"
                  ? `Good trend: spending dropped by ${formatInr(Math.abs(summary?.change_amount ?? 0))} versus last month.`
                  : `Alert: spending increased by ${formatInr(Math.abs(summary?.change_amount ?? 0))} versus last month.`}
              </p>
            </div>
          </section>
        )}

        {activeTab === "history" && (
          <section className="glass-panel shimmer-border p-5 space-y-4">
            <h2 className="text-xl font-semibold">Purchase History</h2>
            {purchaseHistory.length === 0 ? <p>No purchase history yet.</p> : null}
            {purchaseHistory.length > 0 ? (
              <>
                <div className="section-card grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="xl:col-span-2">
                    <label className="mb-1 block text-xs text-muted-foreground">Search history</label>
                    <Input
                      placeholder="Search by date, amount, product name, category, quantity..."
                      value={historyQuery}
                      onChange={(event) => setHistoryQuery(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Date</label>
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="date"
                        value={historyDateFilter}
                        onChange={(event) => setHistoryDateFilter(event.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Min amount (INR)</label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={historyMinAmount}
                      onChange={(event) => setHistoryMinAmount(event.target.value)}
                      placeholder="e.g. 500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Sort</label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={historySort}
                      onChange={(event) =>
                        setHistorySort(event.target.value as "newest" | "oldest" | "highest" | "lowest")
                      }
                    >
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="highest">Highest amount</option>
                      <option value="lowest">Lowest amount</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setHistoryQuery("");
                        setHistoryDateFilter("");
                        setHistoryMinAmount("");
                        setHistorySort("newest");
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-3">
                  <div className="section-card">
                    <p className="text-xs text-muted-foreground">Matched Purchases</p>
                    <p className="text-lg font-semibold">{filteredHistory.length}</p>
                  </div>
                  <div className="section-card">
                    <p className="text-xs text-muted-foreground">Average (Filtered)</p>
                    <p className="text-lg font-semibold">{formatInr(filteredHistoryAverage)}</p>
                  </div>
                  <div className="section-card">
                    <p className="text-xs text-muted-foreground">Top Record Amount</p>
                    <p className="text-lg font-semibold">
                      {formatInr(Number(filteredHistory[0]?.total_amount ?? 0))}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="section-card">
                    <p className="mb-2 text-sm font-medium">Spending by Month (Last 6 Months)</p>
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyHistoryChartData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => formatInr(Number(value))} />
                          <Bar dataKey="amount" radius={[6, 6, 0, 0]} fill="hsl(var(--accent))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This chart helps identify high-spend months quickly.
                    </p>
                  </div>

                  <div className="section-card">
                    <p className="mb-2 text-sm font-medium">Recent Purchase Trend (Last 10 Purchases)</p>
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={recentPurchaseTrendData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                          <XAxis dataKey="purchase" />
                          <YAxis />
                          <Tooltip
                            formatter={(value: number) => formatInr(Number(value))}
                            labelFormatter={(label, payload) => {
                              const point = payload?.[0]?.payload as { date?: string } | undefined;
                              return point?.date ? `${label} (${point.date})` : String(label);
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="amount"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2.5}
                            dot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      A rising line means your checkout totals are increasing recently.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Records</p>
                  {filteredHistory.length === 0 ? (
                    <div className="section-card">
                      <p className="text-sm text-muted-foreground">
                        No history records match the current filters.
                      </p>
                    </div>
                  ) : null}
                  {filteredHistory.slice(0, 60).map((record) => {
                    const isOpen = expandedHistoryId === record.id;
                    const items = Array.isArray(record.items_snapshot) ? record.items_snapshot : [];
                    return (
                      <div key={record.id} className="section-card">
                        <button
                          type="button"
                          onClick={() => setExpandedHistoryId((current) => (current === record.id ? null : record.id))}
                          className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
                        >
                          <div>
                            <p className="font-semibold">{formatInr(Number(record.total_amount))}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(record.purchase_date).toLocaleDateString()} | {items.length} items
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            {isOpen ? "Hide items" : "View items"}
                            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </span>
                        </button>

                        {isOpen ? (
                          <div className="mt-3 space-y-3 border-t border-border/60 pt-3">
                            {items.length > 0 ? (
                              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {items.map((item, index) => (
                                  <div
                                    key={`${record.id}-${item.name}-${index}`}
                                    className="rounded-lg border border-border/70 bg-background/50 px-3 py-2 text-xs"
                                  >
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-muted-foreground">
                                      {toCategory(item.category)} | Qty: {Number(item.quantity ?? 0)} |{" "}
                                      {formatInr(Number(item.price ?? 0))}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                Item details not available for this purchase.
                              </p>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
          </section>
        )}

        
          </motion.section>
        </AnimatePresence>
        </main>
      )}
    </div>
  );
}








