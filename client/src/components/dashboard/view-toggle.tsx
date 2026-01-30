import { cn } from "@/lib/utils";
import { Coins, Rocket } from "lucide-react";

interface ViewToggleProps {
  view: "financial" | "acquisition";
  onViewChange: (view: "financial" | "acquisition") => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200 w-fit">
      <button
        onClick={() => onViewChange("financial")}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
          view === "financial"
            ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
        )}
      >
        <Coins size={16} />
        Financial Health
      </button>
      <button
        onClick={() => onViewChange("acquisition")}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
          view === "acquisition"
            ? "bg-white text-purple-600 shadow-sm ring-1 ring-slate-200"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
        )}
      >
        <Rocket size={16} />
        User Acquisition
      </button>
    </div>
  );
}
