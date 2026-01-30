import { cn } from "@/lib/utils";

interface FilterTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = ["All", "P2P", "Payments", "PaymePlus", "Reach", "Other"];

export function FilterTabs({ activeTab, onTabChange }: FilterTabsProps) {
  return (
    <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200 w-fit">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={cn(
            "px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
            activeTab === tab
              ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
