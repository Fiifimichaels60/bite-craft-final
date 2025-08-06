import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary";
}

export const NotificationBadge = ({ count, className, variant = "destructive" }: NotificationBadgeProps) => {
  if (count === 0) return null;

  return (
    <Badge 
      variant={variant}
      className={cn(
        "absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </Badge>
  );
};