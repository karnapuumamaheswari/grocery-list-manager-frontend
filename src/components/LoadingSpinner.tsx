import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn(
        sizeClasses[size],
        "animate-spin rounded-full border-4 border-primary/20 border-t-primary"
      )} />
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export function LoadingOverlay({ isLoading, message = "Loading..." }: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div className="rounded-lg bg-card border border-border p-8 shadow-lg space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-center text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
