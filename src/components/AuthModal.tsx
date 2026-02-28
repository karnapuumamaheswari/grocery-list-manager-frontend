import { useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string, password: string, isSignUp: boolean) => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export function AuthModal({ isOpen, onClose, onSubmit, isLoading, error }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await onSubmit(email, password, isSignUp);
      setEmail("");
      setPassword("");
    } catch {
      // parent handles errors
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-panel sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{isSignUp ? "Create Account" : "Welcome Back"}</DialogTitle>
          <DialogDescription>
            {isSignUp
              ? "Create your account to manage lists, pantry, and spending trends."
              : "Sign in to continue managing your grocery workflow."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={isLoading}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={isLoading}
                className="rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {isSignUp ? (
            <div className="rounded-xl border border-info/40 bg-info/10 p-3">
              <p className="text-xs text-info-foreground">
                After signup, check your inbox and confirm your account before logging in.
              </p>
            </div>
          ) : null}

          {error ? (
            <div className="flex gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : null}

          <Button type="submit" disabled={isLoading} className="h-11 w-full rounded-xl">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isSignUp ? "Creating account..." : "Signing in..."}
              </>
            ) : isSignUp ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="border-t border-border/60 pt-4">
          <button
            type="button"
            onClick={() => setIsSignUp((prev) => !prev)}
            className="w-full py-2 text-sm text-primary transition-colors hover:text-primary/80"
          >
            {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
