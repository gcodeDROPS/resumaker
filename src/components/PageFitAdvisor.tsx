import React from "react";
import { PageFitResult } from "../utils/pageAdvisor";
import { CheckCircle2, AlertTriangle, Zap, SlidersHorizontal, Sparkles } from "lucide-react";

interface PageFitAdvisorProps {
  fitResult: PageFitResult;
  onAutoFit: () => void;
}

export const PageFitAdvisor: React.FC<PageFitAdvisorProps> = ({
  fitResult,
  onAutoFit,
}) => {
  const { fillPercentage, status, statusText, suggestions } = fitResult;

  const isOverflow = status === "overflow";
  const isPerfect = status === "perfect";

  return (
    <div className="no-print bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 text-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {isPerfect ? (
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          ) : isOverflow ? (
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
          )}

          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>One-Page Status:</span>
              <span
                className={
                  isPerfect
                    ? "text-emerald-600 font-bold"
                    : isOverflow
                    ? "text-rose-600 font-bold"
                    : "text-amber-600 font-bold"
                }
              >
                {statusText}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Page Height Fill: {fillPercentage}% of 1 Page
            </div>
          </div>
        </div>

        <button
          onClick={onAutoFit}
          className="px-3 py-1.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-indigo-600" />
          <span>Auto-Fit 1-Page</span>
        </button>
      </div>

      {/* Progress Fill Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
        <div
          className={`h-full transition-all duration-300 ${
            fillPercentage > 102
              ? "bg-rose-500"
              : fillPercentage < 72
              ? "bg-amber-400"
              : "bg-gradient-to-r from-indigo-500 to-emerald-500"
          }`}
          style={{ width: `${Math.min(fillPercentage, 100)}%` }}
        />
      </div>

      {/* Actionable Suggestions */}
      {suggestions.length > 0 && (
        <div className="pt-2 border-t border-slate-100 space-y-1">
          {suggestions.map((sug, idx) => (
            <div key={idx} className="text-[11px] text-slate-600 flex items-start gap-1.5">
              <span className="text-indigo-600 font-bold">•</span>
              <span>{sug}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
