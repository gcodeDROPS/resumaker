import React, { useState, useEffect, useRef } from "react";
import { ResumeData, StylingConfig } from "./types";
import { SAMPLE_SOFTWARE_ENGINEER, BLANK_RESUME } from "./data/sampleResumes";
import { ResumePreview } from "./components/ResumePreview";
import { EditorPanel } from "./components/EditorPanel";
import { Toolbar } from "./components/Toolbar";
import { PageFitAdvisor } from "./components/PageFitAdvisor";
import { exportResumeToPDF, printResume } from "./utils/pdfExport";
import { evaluateOnePageFit, autoFitConfig } from "./utils/pageAdvisor";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileCheck,
  AlertCircle,
} from "lucide-react";

const STORAGE_KEY_STYLING = "onepage_resume_ai_styling_v1";

const DEFAULT_STYLING: StylingConfig = {
  template: "modern",
  font: "jakarta",
  primaryColor: "#0f172a",
  fontSize: "normal",
  lineHeight: "normal",
  marginSize: "normal",
  showProjects: false,
  showCertifications: true,
  showSummary: true,
  autoFillPage: false,
};

export default function App() {
  const previewContainerRef = useRef<HTMLElement>(null);

  // Resume starts as a clean blank slate on every visit / page refresh
  const [resume, setResume] = useState<ResumeData>(() => BLANK_RESUME);

  // Styling config state
  const [styling, setStyling] = useState<StylingConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STYLING);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load saved styling", e);
    }
    return DEFAULT_STYLING;
  });

  const [previewScale, setPreviewScale] = useState<number>(0.85);
  const [renderedHeightPx, setRenderedHeightPx] = useState<number>(1056);
  const [pageContainerHeightPx, setPageContainerHeightPx] = useState<number>(1056);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [activeViewMode, setActiveViewMode] = useState<"split" | "editor" | "preview">("split");

  // Clean slate on every visit / refresh
  useEffect(() => {
    try {
      localStorage.removeItem("onepage_resume_ai_data_v1");
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STYLING, JSON.stringify(styling));
    } catch (e) {
      console.error(e);
    }
  }, [styling]);

  // Dynamic Fit to Container Width
  const handleFitToScreen = () => {
    if (!previewContainerRef.current) {
      if (window.innerWidth < 1024) setPreviewScale(0.6);
      else if (window.innerWidth < 1440) setPreviewScale(0.78);
      else setPreviewScale(0.9);
      return;
    }
    const containerWidth = previewContainerRef.current.clientWidth;
    // 8.5in at 96 DPI = 816px. Give generous horizontal margin (64px)
    const availableWidth = Math.max(320, containerWidth - 64);
    const idealScale = Math.min(1.0, Math.max(0.45, availableWidth / 816));
    setPreviewScale(Math.round(idealScale * 100) / 100);
  };

  // Adjust default zoom on window resize
  useEffect(() => {
    const handleResize = () => {
      handleFitToScreen();
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Compute 1-Page Fit metrics
  const fitResult = evaluateOnePageFit(
    resume,
    styling,
    renderedHeightPx,
    pageContainerHeightPx
  );

  // Auto-fit handler
  const handleAutoFit = () => {
    const optimized = autoFitConfig(styling, fitResult.fillPercentage);
    setStyling(optimized);
  };

  // PDF Export
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const fileName = `${(resume.contact.fullName || "Resume").replace(/\s+/g, "_")}_OnePage_Resume.pdf`;
      await exportResumeToPDF("resume-print-target", fileName);
    } catch (err) {
      console.error("PDF Export error:", err);
      // Fallback to native print
      printResume();
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Native Print
  const handlePrint = () => {
    printResume();
  };

  // Export JSON
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify({ resume, styling }, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(resume.contact.fullName || "Resume").replace(/\s+/g, "_")}_Data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleImportJSON = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.resume) setResume(parsed.resume);
          if (parsed.styling) setStyling(parsed.styling);
        } catch (err) {
          alert("Invalid resume JSON file");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] font-sans select-none text-slate-900 overflow-hidden">
      {/* Top Header & Toolbar */}
      <div className="no-print">
        <Toolbar
          styling={styling}
          onStylingChange={setStyling}
          onAutoFit={handleAutoFit}
          onExportPDF={handleExportPDF}
          onPrint={handlePrint}
          onLoadSample={setResume}
          onExportJSON={handleExportJSON}
          onImportJSON={handleImportJSON}
          pageFillPercentage={fitResult.fillPercentage}
          isExportingPDF={isExportingPDF}
        />
      </div>

      {/* Main Split Interface */}
      <main className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Side: Interactive AI Editor */}
        <aside
          className={`no-print w-full lg:w-[420px] xl:w-[460px] shrink-0 h-full overflow-hidden flex flex-col select-text bg-white border-r border-slate-200 ${
            activeViewMode === "preview" ? "hidden lg:flex" : "flex"
          }`}
        >
          <EditorPanel
            resume={resume}
            onChange={setResume}
          />
        </aside>

        {/* Right Side: Realistic Live 1-Page Canvas & Preview */}
        <section
          ref={previewContainerRef}
          className={`flex-1 bg-slate-200/90 h-full overflow-y-auto overflow-x-auto flex flex-col items-center relative p-4 sm:p-6 lg:p-8 ${
            activeViewMode === "editor" ? "hidden lg:flex" : "flex"
          }`}
          style={{
            backgroundImage: "radial-gradient(rgba(148,163,184,0.35) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        >
          {/* Floating Zoom & View Controls */}
          <div className="no-print sticky top-0 z-20 mb-4 bg-white/95 backdrop-blur-md border border-slate-200 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-sm text-slate-700">
            <button
              onClick={() => setPreviewScale((s) => Math.max(0.45, Math.round((s - 0.05) * 100) / 100))}
              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <span className="text-[11px] font-mono font-bold text-slate-800 min-w-[2.75rem] text-center">
              {Math.round(previewScale * 100)}%
            </span>

            <button
              onClick={() => setPreviewScale((s) => Math.min(1.2, Math.round((s + 0.05) * 100) / 100))}
              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <div className="h-3.5 w-px bg-slate-200 mx-0.5" />

            {/* Fit to Screen */}
            <button
              onClick={handleFitToScreen}
              className="px-2 py-0.5 rounded text-[10.5px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1 transition-colors cursor-pointer"
              title="Fit resume width to view"
            >
              <Maximize2 className="w-3 h-3 text-slate-500" />
              <span>Fit</span>
            </button>

            {/* 100% Zoom */}
            <button
              onClick={() => setPreviewScale(1.0)}
              className="px-1.5 py-0.5 rounded text-[10.5px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer hidden sm:inline"
              title="Actual Size"
            >
              100%
            </button>

            {/* Mobile View Toggle */}
            <div className="flex lg:hidden items-center gap-1 bg-slate-100 p-0.5 rounded-lg ml-1">
              <button
                onClick={() => setActiveViewMode("editor")}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                  activeViewMode === "editor" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                }`}
              >
                Edit
              </button>
              <button
                onClick={() => setActiveViewMode("preview")}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                  activeViewMode === "preview" ? "bg-indigo-600 text-white" : "text-slate-600"
                }`}
              >
                View
              </button>
            </div>

            {/* US Letter badge */}
            <div className="hidden md:flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
              <FileCheck className="w-3 h-3 text-slate-400" />
              <span>8.5 × 11"</span>
            </div>
          </div>

          {/* Sized Outer Container for Scaled Page */}
          <div
            className="transition-all duration-100 relative shadow-xl rounded-sm bg-white shrink-0 mb-8"
            style={{
              width: `${8.5 * previewScale}in`,
              height: `${11 * previewScale}in`,
            }}
          >
            {/* The Actual Rendered Resume Page with top-left transform origin */}
            <div
              style={{
                width: "8.5in",
                height: "11in",
                transform: `scale(${previewScale})`,
                transformOrigin: "top left",
              }}
            >
              <ResumePreview
                resume={resume}
                styling={styling}
                scale={previewScale}
                onUpdateHeight={(rendered, pageHeight) => {
                  setRenderedHeightPx(rendered);
                  setPageContainerHeightPx(pageHeight);
                }}
              />
            </div>

            {/* Visual Page Overflow Warning Border */}
            {fitResult.status === "overflow" && (
              <div
                className="no-print absolute inset-x-0 bottom-0 pointer-events-none border-b-4 border-rose-500 flex justify-center"
              >
                <div className="bg-rose-600 text-white text-[11px] font-bold px-3 py-1 rounded-t shadow-lg flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Content overflows 1 page — click Auto-Fit in toolbar</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Page Advisor Card */}
          <div className="no-print w-full max-w-lg mb-8">
            <PageFitAdvisor fitResult={fitResult} onAutoFit={handleAutoFit} />
          </div>
        </section>
      </main>
    </div>
  );
}
