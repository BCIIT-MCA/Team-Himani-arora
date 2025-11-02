import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  text?: string;
  className?: string;
}

const sizeClasses = {
  small: "w-4 h-4",
  medium: "w-6 h-6",
  large: "w-8 h-8",
};

const textSizeClasses = {
  small: "text-sm",
  medium: "text-base",
  large: "text-lg",
};

export function LoadingSpinner({
  size = "medium",
  text,
  className,
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Loader2
        className={cn("animate-spin text-primary", sizeClasses[size])}
        aria-hidden="true"
      />
      {text && (
        <span
          className={cn("text-muted-foreground", textSizeClasses[size])}
          aria-live="polite"
        >
          {text}
        </span>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
}
