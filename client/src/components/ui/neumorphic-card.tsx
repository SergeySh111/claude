import { cn } from "@/lib/utils";
import React from "react";

interface NeumorphicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  inset?: boolean;
  hoverEffect?: boolean;
}

export function NeumorphicCard({ 
  children, 
  className, 
  inset = false, 
  hoverEffect = false,
  ...props 
}: NeumorphicCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-[#F0F4F8] transition-all duration-300 ease-out",
        inset 
          ? "shadow-[inset_6px_6px_12px_#D1D9E6,inset_-6px_-6px_12px_#FFFFFF]" 
          : "shadow-[6px_6px_12px_#D1D9E6,-6px_-6px_12px_#FFFFFF]",
        hoverEffect && !inset && "hover:-translate-y-1 hover:shadow-[8px_8px_16px_#D1D9E6,-8px_-8px_16px_#FFFFFF]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
