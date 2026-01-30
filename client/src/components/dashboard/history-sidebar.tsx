import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, FileText, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface HistorySidebarProps {
  onSelectReport: (reportId: number) => void;
  selectedReportId: number | null;
}

export function HistorySidebar({ onSelectReport, selectedReportId }: HistorySidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const utils = trpc.useUtils();

  const { data: reports, isLoading } = trpc.reports.list.useQuery();

  const deleteMutation = trpc.reports.delete.useMutation({
    onSuccess: () => {
      utils.reports.list.invalidate();
      toast.success("Report deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete report: ${error.message}`);
    },
  });

  const handleDelete = (e: React.MouseEvent, reportId: number) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this report?")) {
      deleteMutation.mutate({ id: reportId });
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-white border-r border-slate-200 flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="mb-4"
        >
          <ChevronRight size={20} />
        </Button>
        <div className="flex-1 flex items-center">
          <FileText size={20} className="text-slate-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Saved Reports</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(true)}
        >
          <ChevronLeft size={20} />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin text-slate-400" size={24} />
          </div>
        ) : reports && reports.length > 0 ? (
          <div className="p-2 space-y-2">
            {reports.map((report) => (
              <div
                key={report.id}
                onClick={() => onSelectReport(report.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all group ${
                  selectedReportId === report.id
                    ? "bg-blue-50 border-blue-200"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">
                      {report.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {format(new Date(report.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                    {report.dateRange && (
                      <p className="text-xs text-slate-400 mt-1">
                        Period: {report.dateRange}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    onClick={(e) => handleDelete(e, report.id)}
                  >
                    <Trash2 size={14} className="text-rose-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <FileText size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm text-slate-500">
              No saved reports yet. Upload your first campaign data to get started.
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
