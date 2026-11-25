import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-slate-100 text-slate-800",
        pending:
          "border border-amber-200 bg-amber-50 text-amber-700",
        approved:
          "border border-blue-200 bg-blue-50 text-blue-700",
        progress:
          "border border-purple-200 bg-purple-50 text-purple-700",
        completed:
          "border border-emerald-200 bg-emerald-50 text-emerald-700",
        rejected:
          "border border-rose-200 bg-rose-50 text-rose-700",
        emergency:
          "border border-red-300 bg-red-50 text-red-700 font-bold animate-pulse",
        brand:
          "border-transparent bg-brand-navy text-white",
        orange:
          "border-transparent bg-brand-orange text-white",
        outline:
          "border border-slate-200 bg-transparent text-slate-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
