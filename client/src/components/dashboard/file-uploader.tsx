import { cn } from "@/lib/utils";
import { UploadCloud } from "lucide-react";
import { useCallback, useState } from "react";

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
}

export function FileUploader({ onFileUpload }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  }, [onFileUpload]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  }, [onFileUpload]);

  return (
    <div 
      className={cn(
        "relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl transition-all cursor-pointer group bg-white",
        isDragging ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-upload')?.click()}
    >
      <input 
        id="file-upload" 
        type="file" 
        accept=".csv" 
        className="hidden" 
        onChange={handleFileChange}
      />
      
      <div className="p-4 rounded-full bg-blue-50 text-blue-600 mb-4 group-hover:scale-110 transition-transform duration-200">
        <UploadCloud className="w-8 h-8" />
      </div>
      
      <h3 className="text-lg font-semibold text-slate-900 mb-2">Upload Campaign Data</h3>
      <p className="text-slate-500 text-center max-w-xs text-sm">
        Drag and drop your CSV file here, or click to browse.
      </p>
      <p className="text-xs text-slate-400 mt-4 font-mono bg-slate-100 px-2 py-1 rounded">
        Supported format: .csv
      </p>
    </div>
  );
}
