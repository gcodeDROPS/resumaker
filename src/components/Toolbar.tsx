import React, { useState, useRef, useEffect } from "react";
import { StylingConfig, TemplateId, FontChoice, DensityOption, ResumeData } from "../types";
import {
  Download,
  Printer,
  Sliders,
  ChevronDown,
  Zap,
  Check,
  RotateCcw,
} from "lucide-react";
import {
  SAMPLE_SOFTWARE_ENGINEER,
  SAMPLE_MARKETING_LEAD,
  BLANK_RESUME,
} from "../data/sampleResumes";

interface ToolbarProps {
  styling: StylingConfig;
  onStylingChange: (styling: StylingConfig) => void;
  onAutoFit: () => void;
  onExportPDF: () => void;
  onPrint: () => void;
  onLoadSample: (sample: ResumeData) => void;
  onExportJSON: () => void;
  onImportJSON: () => void;
  pageFillPercentage: number;
  isExportingPDF: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  styling,
  onStylingChange,
  onAutoFit,
  onExportPDF,
  onPrint,
  onLoadSample,
  pageFillPercentage,
  isExportingPDF,
}) => {
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showSampleMenu, setShowSampleMenu] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  const styleMenuRef = useRef<HTMLDivElement>(null);
  const sampleMenuRef = useRef<HTMLDivElement>(null);
  const templateMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (styleMenuRef.current && !styleMenuRef.current.contains(event.target as Node)) {
        setShowStyleMenu(false);
      }
      if (sampleMenuRef.current && !sampleMenuRef.current.contains(event.target as Node)) {
        setShowSampleMenu(false);
      }
      if (templateMenuRef.current && !templateMenuRef.current.contains(event.target as Node)) {
        setShowTemplateMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const templates: { id: TemplateId; label: string; desc: string }[] = [
    { id: "modern", label: "Modern", desc: "Clean universal layout with subtle dividers" },
    { id: "executive", label: "Executive", desc: "Serif typography & centered header" },
    { id: "tech", label: "Tech", desc: "Monospace accents & developer tags" },
    { id: "twocolumn", label: "Sidebar", desc: "Two-column layout for skills & details" },
  ];

  const fonts: { id: FontChoice; label: string }[] = [
    { id: "inter", label: "Inter (Sans)" },
    { id: "jakarta", label: "Plus Jakarta Sans" },
    { id: "outfit", label: "Outfit (Modern)" },
    { id: "merriweather", label: "Merriweather (Serif)" },
    { id: "playfair", label: "Playfair Display" },
    { id: "mono", label: "JetBrains Mono" },
  ];

  const colors = [
    { name: "Slate Navy", value: "#0f172a" },
    { name: "Deep Cobalt", value: "#1e3a8a" },
    { name: "Indigo", value: "#4338ca" },
    { name: "Forest Emerald", value: "#065f46" },
    { name: "Burgundy", value: "#881337" },
    { name: "Charcoal", value: "#18181b" },
    { name: "Teal", value: "#0f766e" },
    { name: "Bronze", value: "#78350f" },
  ];

  const activeTemplateObj = templates.find((t) => t.id === styling.template) || templates[0];

  return (
    <header className="no-print bg-white border-b border-slate-200 text-slate-900 px-4 sm:px-6 h-14 shrink-0 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs select-none">
      {/* Left: Brand & 1-Page Status Badge */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
            R
          </div>
          <div className="font-bold text-sm sm:text-base tracking-tight text-slate-900 flex items-center">
            <span>ResuMaker</span>
            <span className="text-indigo-600 font-extrabold ml-0.5">AI</span>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        {/* 1-Page Status Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              pageFillPercentage > 102
                ? "bg-rose-500 animate-pulse"
                : pageFillPercentage < 85
                ? "bg-amber-500"
                : "bg-emerald-500"
            }`}
          />
          <span className="text-[11px] font-semibold text-slate-600 hidden md:inline">1-Page:</span>
          <span
            className={`text-[11px] font-mono font-bold ${
              pageFillPercentage > 102
                ? "text-rose-600"
                : pageFillPercentage < 85
                ? "text-amber-600"
                : "text-emerald-600"
            }`}
          >
            {pageFillPercentage}%
          </span>

          {pageFillPercentage > 102 ? (
            <button
              onClick={onAutoFit}
              className="ml-1 px-1.5 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
              title="Click to automatically adjust font and spacing to fit exactly 1 page"
            >
              <Zap className="w-2.5 h-2.5" />
              <span>Auto-Fit</span>
            </button>
          ) : pageFillPercentage < 88 ? (
            <button
              onClick={onAutoFit}
              className="ml-1 px-1.5 py-0.5 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
              title="Click to automatically expand fonts, margins and spacing to fill up the full page"
            >
              <Zap className="w-2.5 h-2.5" />
              <span>Fill Page</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Center: Template Switcher & Format Settings */}
      <div className="flex items-center gap-2">
        {/* Template Selector */}
        <div className="hidden md:flex bg-slate-100 border border-slate-200 rounded-md p-0.5">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => onStylingChange({ ...styling, template: t.id })}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                styling.template === t.id
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title={t.desc}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Template Dropdown for smaller screens */}
        <div className="relative md:hidden" ref={templateMenuRef}>
          <button
            onClick={() => setShowTemplateMenu(!showTemplateMenu)}
            className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
          >
            <span>{activeTemplateObj.label}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          {showTemplateMenu && (
            <div className="absolute left-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg p-1 shadow-lg z-50">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onStylingChange({ ...styling, template: t.id });
                    setShowTemplateMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-medium ${
                    styling.template === t.id ? "bg-indigo-50 text-indigo-700 font-bold" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Format Menu Trigger */}
        <div className="relative" ref={styleMenuRef}>
          <button
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            className={`px-2.5 py-1 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showStyleMenu
                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Format</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showStyleMenu && (
            <div className="absolute right-0 sm:left-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl p-4 shadow-xl z-50 space-y-3.5 text-slate-900">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Resume Formatting</span>
                </span>
                <button
                  onClick={() => setShowStyleMenu(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
                >
                  Done
                </button>
              </div>

              {/* Font */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Font Family
                </label>
                <select
                  value={styling.font}
                  onChange={(e) =>
                    onStylingChange({ ...styling, font: e.target.value as FontChoice })
                  }
                  className="w-full px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {fonts.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Accent Color */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Accent Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => onStylingChange({ ...styling, primaryColor: c.value })}
                      className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                        styling.primaryColor === c.value
                          ? "border-indigo-600 scale-110 shadow-xs ring-2 ring-indigo-500/20"
                          : "border-transparent opacity-85 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Density Controls in 3-Columns */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Size
                  </label>
                  <select
                    value={styling.fontSize}
                    onChange={(e) =>
                      onStylingChange({ ...styling, fontSize: e.target.value as DensityOption })
                    }
                    className="w-full px-1.5 py-1 rounded bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  >
                    <option value="compact">Compact</option>
                    <option value="normal">Normal</option>
                    <option value="spacious">Spacious</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Spacing
                  </label>
                  <select
                    value={styling.lineHeight}
                    onChange={(e) =>
                      onStylingChange({ ...styling, lineHeight: e.target.value as DensityOption })
                    }
                    className="w-full px-1.5 py-1 rounded bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  >
                    <option value="compact">Tight</option>
                    <option value="normal">Normal</option>
                    <option value="spacious">Relaxed</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Margins
                  </label>
                  <select
                    value={styling.marginSize}
                    onChange={(e) =>
                      onStylingChange({ ...styling, marginSize: e.target.value as DensityOption })
                    }
                    className="w-full px-1.5 py-1 rounded bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  >
                    <option value="compact">Narrow</option>
                    <option value="normal">Normal</option>
                    <option value="spacious">Wide</option>
                  </select>
                </div>
              </div>

              {/* Auto-Fill Full Page Toggle */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800">Fill Single Page</div>
                  <div className="text-[10px] text-slate-500">Auto-distribute spacing for short resumes</div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onStylingChange({
                      ...styling,
                      autoFillPage: styling.autoFillPage === false ? true : false,
                    })
                  }
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    styling.autoFillPage !== false ? "bg-indigo-600 justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-xs block" />
                </button>
              </div>

              {/* 1-Click Auto Fit */}
              <button
                onClick={() => {
                  onAutoFit();
                  setShowStyleMenu(false);
                }}
                className="w-full py-2 px-3 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Auto-Fit Entire Page Now</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Examples, Print, Export PDF */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Sample Presets */}
        <div className="relative" ref={sampleMenuRef}>
          <button
            onClick={() => setShowSampleMenu(!showSampleMenu)}
            className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
          >
            <span>Examples</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showSampleMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg p-1.5 shadow-xl z-50 space-y-1">
              <button
                onClick={() => {
                  onLoadSample(SAMPLE_SOFTWARE_ENGINEER);
                  setShowSampleMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-50 text-xs text-slate-800 font-semibold cursor-pointer"
              >
                Software Engineer
              </button>
              <button
                onClick={() => {
                  onLoadSample(SAMPLE_MARKETING_LEAD);
                  setShowSampleMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-50 text-xs text-slate-800 font-semibold cursor-pointer"
              >
                Marketing Lead
              </button>
              <button
                onClick={() => {
                  onLoadSample(BLANK_RESUME);
                  setShowSampleMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded hover:bg-rose-50 text-xs text-rose-600 font-semibold cursor-pointer border-t border-slate-100 mt-1 pt-1"
              >
                Clear Resume
              </button>
            </div>
          )}
        </div>

        {/* Print Button */}
        <button
          onClick={onPrint}
          className="p-1.5 sm:px-2.5 sm:py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer shadow-xs"
          title="Print or Save as PDF"
        >
          <Printer className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden sm:inline">Print</span>
        </button>

        {/* PDF Export Button */}
        <button
          onClick={onExportPDF}
          disabled={isExportingPDF}
          className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isExportingPDF ? "Exporting..." : "Download PDF"}</span>
        </button>
      </div>
    </header>
  );
};
