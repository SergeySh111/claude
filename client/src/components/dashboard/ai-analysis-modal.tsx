import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Bot, Copy, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AIAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: string;
  isLoading: boolean;
}

export function AIAnalysisModal({ open, onOpenChange, analysis, isLoading }: AIAnalysisModalProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!analysis || isLoading) {
      setDisplayedText("");
      setIsTyping(false);
      return;
    }

    // Typing effect
    setIsTyping(true);
    setDisplayedText("");
    
    let currentIndex = 0;
    const typingSpeed = 10; // milliseconds per character (faster for better UX)

    const interval = setInterval(() => {
      if (currentIndex < analysis.length) {
        setDisplayedText(analysis.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, typingSpeed);

    return () => clearInterval(interval);
  }, [analysis, isLoading]);

  const handleCopy = () => {
    navigator.clipboard.writeText(analysis);
    toast.success("Analysis copied to clipboard!");
  };

  const handleSkipTyping = () => {
    setDisplayedText(analysis);
    setIsTyping(false);
  };

  // Parse and render structured analysis with colored badges
  const renderStructuredAnalysis = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactElement[] = [];
    let currentSection: 'scale' | 'stop' | 'anomaly' | null = null;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Detect section headers
      if (trimmedLine.includes('🟢') || trimmedLine.toLowerCase().includes('scale') || trimmedLine.toLowerCase().includes('best performer')) {
        currentSection = 'scale';
        elements.push(
          <div key={index} className="flex items-center gap-2 mb-3 mt-4">
            <div className="flex items-center gap-2 bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full">
              <TrendingUp size={16} />
              <span className="font-bold text-sm">SCALE (Best Performers)</span>
            </div>
          </div>
        );
      } else if (trimmedLine.includes('🔴') || trimmedLine.toLowerCase().includes('stop') || trimmedLine.toLowerCase().includes('bleeding')) {
        currentSection = 'stop';
        elements.push(
          <div key={index} className="flex items-center gap-2 mb-3 mt-4">
            <div className="flex items-center gap-2 bg-rose-100 text-rose-800 px-3 py-1.5 rounded-full">
              <TrendingDown size={16} />
              <span className="font-bold text-sm">STOP/FIX (Bleeding Budget)</span>
            </div>
          </div>
        );
      } else if (trimmedLine.includes('⚠️') || trimmedLine.toLowerCase().includes('anomal')) {
        currentSection = 'anomaly';
        elements.push(
          <div key={index} className="flex items-center gap-2 mb-3 mt-4">
            <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full">
              <AlertTriangle size={16} />
              <span className="font-bold text-sm">ANOMALIES (Needs Attention)</span>
            </div>
          </div>
        );
      } else if (trimmedLine.startsWith('*') || trimmedLine.startsWith('-')) {
        // Bullet points - style based on current section
        const bulletContent = trimmedLine.replace(/^[*-]\s*/, '');
        const sectionColors = {
          scale: 'border-l-4 border-emerald-500 bg-emerald-50',
          stop: 'border-l-4 border-rose-500 bg-rose-50',
          anomaly: 'border-l-4 border-amber-500 bg-amber-50',
        };
        const colorClass = currentSection ? sectionColors[currentSection] : 'border-l-4 border-slate-300 bg-slate-50';
        
        elements.push(
          <div key={index} className={`${colorClass} pl-4 pr-3 py-2 mb-2 rounded-r text-sm`}>
            <p className="text-slate-800 leading-relaxed">{bulletContent}</p>
          </div>
        );
      } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        // Bold headers (skip if already handled as section header)
        if (!trimmedLine.includes('🟢') && !trimmedLine.includes('🔴') && !trimmedLine.includes('⚠️')) {
          const headerText = trimmedLine.replace(/\*\*/g, '');
          elements.push(
            <h4 key={index} className="font-bold text-slate-900 mt-3 mb-1 text-sm">
              {headerText}
            </h4>
          );
        }
      } else if (trimmedLine.length > 0) {
        // Regular text
        elements.push(
          <p key={index} className="text-slate-700 text-sm leading-relaxed mb-2">
            {trimmedLine}
          </p>
        );
      }
    });

    return elements;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">AI Campaign Audit</DialogTitle>
              <DialogDescription>
                Strict data-driven analysis powered by GPT-4o Mini
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 animate-ping opacity-20"></div>
              </div>
              <p className="text-slate-700 font-semibold text-lg">Analyzing campaigns...</p>
              <p className="text-sm text-slate-500">Calculating benchmarks and detecting anomalies</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                <div className="space-y-2">
                  {renderStructuredAnalysis(displayedText)}
                  {isTyping && (
                    <span className="inline-block w-2 h-4 bg-blue-600 ml-1 animate-pulse"></span>
                  )}
                </div>
              </div>

              {isTyping && (
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkipTyping}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    Skip animation →
                  </Button>
                </div>
              )}

              {!isTyping && displayedText && (
                <div className="flex justify-between items-center pt-2">
                  <p className="text-xs text-slate-500">
                    💡 Tip: All numbers are verified against your actual data
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="gap-2"
                  >
                    <Copy size={14} />
                    Copy Analysis
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
