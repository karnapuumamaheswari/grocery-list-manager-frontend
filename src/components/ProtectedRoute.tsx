import { ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProtectedRouteProps {
  children: ReactNode;
  isLoggedIn: boolean;
  isOpen: boolean;
  onAction: () => void;
  onCancel: () => void;
}

export function ProtectedRoute({
  children,
  isLoggedIn,
  isOpen,
  onAction,
  onCancel,
}: ProtectedRouteProps) {
  if (!isLoggedIn) {
    return (
      <AlertDialog open={isOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogTitle className="text-xl font-bold">
            🔐 Authentication Required
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Please login first to access this feature.</p>
            <p className="text-xs text-muted-foreground">
              This page is protected and requires authentication. Log in or create an account to continue.
            </p>
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end pt-4">
            <AlertDialogCancel onClick={onCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={onAction}>
              Go to Login
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return <>{children}</>;
}
