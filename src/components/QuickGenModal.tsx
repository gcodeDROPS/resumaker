import React, { useState } from "react";
import { ResumeData } from "../types";
import { Sparkles, Zap, X, RefreshCw, CheckCircle2, FileText } from "lucide-react";

interface QuickGenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: ResumeData) => void;
}

export const QuickGenModal: React.FC<QuickGenModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const [rawNotes, setRawNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!rawNotes.trim()) {
      setError("Please paste or type some rough notes about your background.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/quick-generate-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawNotes,
        }),
      });

      const data = await res.json();
      if (data.contact && data.experiences) {
        onApply({
          contact: data.contact,
          summary: data.summary || "",
          experiences: data.experiences.map((e: any, idx: number) => ({
            id: `exp-${Date.now()}-${idx}`,
            jobTitle: e.jobTitle || "Role",
            company: e.company || "Company",
            location: e.location || "",
            startDate: e.startDate || "2021",
            endDate: e.endDate || "Present",
            isCurrent: e.endDate === "Present" || !e.endDate,
            rawNotes: "",
            bullets: e.bullets || [],
          })),
          education: (data.education || []).map((edu: any, idx: number) => ({
            id: `edu-${Date.now()}-${idx}`,
            degree: edu.degree || "Degree",
            school: edu.school || "University",
            location: edu.location || "",
            graduationYear: edu.graduationYear || "2020",
            gpaOrHonors: edu.honors || "",
          })),
          skills: data.skills || [],
          projects: [],
          certifications: [],
        });
        onClose();
      } else {
        setError(data.error || "Failed to generate complete resume structure.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to contact AI service.");
    } finally {
      setLoading(false);
    }
  };

  const sampleBio = `Jordan Lee
Target: Senior Operations Manager
jordan.lee@example.com | 555-0123 | Chicago, IL
Currently Operations Lead at SwiftLogistics (2022-Present): Managed warehouse team of 40 people, automated packing workflows, cut fulfillment errors by 45%, saved $200k on vendor freight contracts.
Previously Operations Specialist at MetroDelivery (2019-2022): Handled route dispatching for 120 drivers, introduced GPS route optimization which reduced fuel costs by 18%.
Education: B.S. in Supply Chain Management from University of Illinois (2019).
Skills: Warehouse Operations, Supply Chain Logistics, Lean Six Sigma, SQL, Tableau, Inventory Forecasting.`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-slate-900">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>1-Click Bio to One-Page Resume</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-mono font-semibold">Gemini AI</span>
              </h2>
              <p className="text-xs text-slate-500">
                Paste rough notes, bullet points, or a quick summary → AI builds the whole 1-page layout.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Paste Rough Notes, Brain-dump, or Bio
              </label>
              <button
                type="button"
                onClick={() => setRawNotes(sampleBio)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                Insert Sample Notes
              </button>
            </div>

            <textarea
              rows={8}
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="Paste raw bullet points, LinkedIn text, or a paragraph describing your jobs, accomplishments, education, and skills..."
              className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white font-mono leading-relaxed transition-all"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-[11.5px] text-indigo-900 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              The AI automatically generates impactful X-Y-Z bullet points, extracts relevant skills, crafts a concise summary, and guarantees single-page density!
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Full 1-Page Resume...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Generate One-Page Resume</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
