import { LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface NavigationProps {
  displayName?: string;
  isLoggedIn: boolean;
  onLogout: () => void;
}

export function Navigation({ displayName, isLoggedIn, onLogout }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const safeName = displayName?.trim() || "User";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-card/80 shadow-sm backdrop-blur-2xl">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="soft-glow flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent/90 ring-1 ring-white/20 shadow-lg">
              <span className="text-sm font-bold text-primary-foreground">GL</span>
            </div>
            <div className="hidden flex-col sm:flex">
              <h1 className="text-lg font-bold tracking-tight text-foreground">Grocery Manager</h1>
              <p className="text-xs text-muted-foreground">Smart list, pantry, and budget tracking</p>
            </div>
          </div>

          <div className="hidden md:block text-sm text-muted-foreground">
            {isLoggedIn ? "Use the workspace tabs below" : "Welcome"}
          </div>

          <div className="flex items-center space-x-2">
            {isLoggedIn ? (
              <div className="hidden items-center space-x-3 border-r border-border/30 pr-3 sm:flex">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">Hi, {safeName}</p>
                </div>
              </div>
            ) : null}

            {isLoggedIn ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="hidden gap-2 rounded-full hover:bg-destructive/10 hover:text-destructive sm:flex"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/auth?mode=login")}
                  className="hidden rounded-full sm:flex hover:text-accent"
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/auth?mode=signup")}
                  className="hidden rounded-full sm:flex brand-gradient-btn"
                >
                  Sign Up
                </Button>
              </>
            )}

            <button
              className="rounded-xl p-2 transition-colors hover:bg-secondary/40 md:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <div className="mt-4 space-y-2 border-t border-border/30 pt-4 md:hidden">
            {isLoggedIn ? (
              <>
                <p className="rounded-xl bg-background/40 px-4 py-2.5 text-sm text-muted-foreground">
                  Use the tabs in the page to navigate Dashboard, Grocery, Pantry, Budget, History, and Products.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigate("/auth?mode=login");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-center"
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    navigate("/auth?mode=signup");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </nav>
  );
}
