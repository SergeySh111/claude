import { Calculator, Info } from "lucide-react";

export function MethodologySection() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 mt-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
          <Info size={20} />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Methodology & Calculations</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* PI Score Calculation */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Calculator size={16} className="text-emerald-500" />
            Performance Index (PI) Score
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            The PI Score (0-100) is a composite metric calculated using Weighted Min-Max Normalization. 
            It evaluates each campaign relative to the best and worst performers in the dataset.
          </p>
          
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm font-mono text-slate-600 space-y-2">
            <div className="font-semibold text-slate-900 mb-2">Formula:</div>
            <div className="pl-3 border-l-2 border-emerald-400 space-y-1">
              <div>Score = </div>
              <div className="pl-4">(Norm_Profit × 0.30) +</div>
              <div className="pl-4">(Norm_ROAS × 0.30) +</div>
              <div className="pl-4">(Norm_Installs × 0.30) +</div>
              <div className="pl-4">(Norm_Cards × 0.05) +</div>
              <div className="pl-4">(Norm_Subs × 0.05)</div>
            </div>
            <div className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-200 italic">
              *Norm_X = (Value - Min) / (Max - Min)
            </div>
          </div>
        </div>

        {/* Revenue Calculation */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Calculator size={16} className="text-blue-500" />
            Revenue Calculation Model
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Revenue is derived from the transactional volume driven by each campaign, applying specific commission rates for different transaction types.
          </p>
          
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm font-mono text-slate-600 space-y-2">
            <div className="font-semibold text-slate-900 mb-2">Logic:</div>
            <div className="pl-3 border-l-2 border-blue-400 space-y-3">
              <div>
                <span className="font-semibold text-slate-700 block mb-1">P2P Revenue</span>
                Total P2P Transactions × 0.007 (0.7%)
              </div>
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Payments Revenue</span>
                Total Payments Processed × 0.006 (0.6%)
              </div>
            </div>
            <div className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-200 italic">
              *Note: Campaigns with 0 cost are excluded from analysis.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
