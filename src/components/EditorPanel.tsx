import React, { useState } from "react";
import { ResumeData, ExperienceItem, EducationItem, ProjectItem, CertificationItem } from "../types";
import {
  Sparkles,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  FileText,
  RefreshCw,
  Zap,
  TrendingUp,
  Scissors,
  CheckCircle2,
  FolderGit2,
  Award,
  HelpCircle,
} from "lucide-react";

interface EditorPanelProps {
  resume: ResumeData;
  onChange: (updated: ResumeData) => void;
  onOpenQuickGen: () => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  resume,
  onChange,
  onOpenQuickGen,
}) => {
  const [activeTab, setActiveTab] = useState<"contact" | "summary" | "experience" | "skills" | "education" | "extras">("experience");
  const [generatingBulletsFor, setGeneratingBulletsFor] = useState<string | null>(null);
  const [polishingBulletKey, setPolishingBulletKey] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [suggestingSkills, setSuggestingSkills] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [expandedJobs, setExpandedJobs] = useState<Record<string, boolean>>({
    [resume.experiences[0]?.id || "default"]: true,
  });

  // Contact field handler
  const handleContactChange = (field: keyof ResumeData["contact"], val: string) => {
    onChange({
      ...resume,
      contact: {
        ...resume.contact,
        [field]: val,
      },
    });
  };

  // Toggle job card expand
  const toggleJobExpand = (id: string) => {
    setExpandedJobs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Generate bullet points with Gemini AI from 1-2 sentence description
  const handleGenerateBullets = async (expId: string) => {
    const exp = resume.experiences.find((e) => e.id === expId);
    if (!exp) return;

    setGeneratingBulletsFor(expId);
    try {
      const res = await fetch("/api/generate-bullets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: exp.jobTitle,
          company: exp.company,
          description: exp.rawNotes || (exp.jobTitle ? `${exp.jobTitle} at ${exp.company || "company"}` : ""),
          targetRole: resume.contact.jobTitle,
          count: 3,
        }),
      });

      const data = await res.json();
      const newBullets = (data.bullets && data.bullets.length > 0) ? data.bullets : data.fallbackBullets;
      if (newBullets && newBullets.length > 0) {
        const updatedExperiences = resume.experiences.map((e) => {
          if (e.id === expId) {
            return {
              ...e,
              bullets: newBullets,
            };
          }
          return e;
        });
        onChange({ ...resume, experiences: updatedExperiences });
      }
    } catch (err) {
      console.error("Failed to generate bullets:", err);
    } finally {
      setGeneratingBulletsFor(null);
    }
  };

  // Polish individual bullet point
  const handlePolishBullet = async (
    expId: string,
    bulletIdx: number,
    action: "quantify" | "shorten" | "strengthen"
  ) => {
    const key = `${expId}-${bulletIdx}-${action}`;
    const exp = resume.experiences.find((e) => e.id === expId);
    if (!exp || !exp.bullets[bulletIdx]) return;

    setPolishingBulletKey(key);
    try {
      const res = await fetch("/api/polish-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bullet: exp.bullets[bulletIdx],
          action,
          jobTitle: exp.jobTitle,
        }),
      });
      const data = await res.json();
      if (data.polishedBullet) {
        const updatedExperiences = resume.experiences.map((e) => {
          if (e.id === expId) {
            const nextBullets = [...e.bullets];
            nextBullets[bulletIdx] = data.polishedBullet;
            return { ...e, bullets: nextBullets };
          }
          return e;
        });
        onChange({ ...resume, experiences: updatedExperiences });
      }
    } catch (err) {
      console.error("Failed to polish bullet:", err);
    } finally {
      setPolishingBulletKey(null);
    }
  };

  // Add new job
  const handleAddJob = () => {
    const newId = `exp-${Date.now()}`;
    const newJob: ExperienceItem = {
      id: newId,
      jobTitle: "",
      company: "",
      location: "",
      startDate: "2023",
      endDate: "Present",
      isCurrent: true,
      rawNotes: "",
      bullets: [
        "Delivered core product enhancements leading to positive user adoption.",
      ],
    };
    onChange({
      ...resume,
      experiences: [newJob, ...resume.experiences],
    });
    setExpandedJobs((prev) => ({ ...prev, [newId]: true }));
  };

  // Delete job
  const handleDeleteJob = (id: string) => {
    onChange({
      ...resume,
      experiences: resume.experiences.filter((e) => e.id !== id),
    });
  };

  // Update specific job field
  const handleUpdateJob = (id: string, updates: Partial<ExperienceItem>) => {
    onChange({
      ...resume,
      experiences: resume.experiences.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    });
  };

  // Update bullet text
  const handleBulletChange = (expId: string, idx: number, text: string) => {
    const updated = resume.experiences.map((exp) => {
      if (exp.id === expId) {
        const newBullets = [...exp.bullets];
        newBullets[idx] = text;
        return { ...exp, bullets: newBullets };
      }
      return exp;
    });
    onChange({ ...resume, experiences: updated });
  };

  // Add bullet
  const handleAddBullet = (expId: string) => {
    const updated = resume.experiences.map((exp) => {
      if (exp.id === expId) {
        return {
          ...exp,
          bullets: [...exp.bullets, "Spearheaded key initiatives to optimize workflows and increase productivity."],
        };
      }
      return exp;
    });
    onChange({ ...resume, experiences: updated });
  };

  // Delete bullet
  const handleDeleteBullet = (expId: string, idx: number) => {
    const updated = resume.experiences.map((exp) => {
      if (exp.id === expId) {
        return {
          ...exp,
          bullets: exp.bullets.filter((_, i) => i !== idx),
        };
      }
      return exp;
    });
    onChange({ ...resume, experiences: updated });
  };

  // AI Summary Generator
  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    try {
      const res = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: resume.contact.fullName,
          targetRole: resume.contact.jobTitle,
          experiences: resume.experiences.map((e) => ({
            title: e.jobTitle,
            company: e.company,
            bullets: e.bullets,
          })),
          skills: resume.skills,
        }),
      });
      const data = await res.json();
      if (data.summary) {
        onChange({ ...resume, summary: data.summary });
      }
    } catch (err) {
      console.error("Failed to generate summary:", err);
    } finally {
      setGeneratingSummary(false);
    }
  };

  // AI Skills Suggester
  const handleSuggestSkills = async () => {
    setSuggestingSkills(true);
    try {
      const res = await fetch("/api/suggest-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: resume.contact.jobTitle,
          experiences: resume.experiences.map((e) => ({
            title: e.jobTitle,
            notes: e.rawNotes,
            bullets: e.bullets,
          })),
        }),
      });
      const data = await res.json();
      const combined = [
        ...(data.technicalSkills || []),
        ...(data.toolsAndPlatforms || []),
        ...(data.coreCompetencies || []),
      ];
      if (combined.length > 0) {
        // Merge without duplicates
        const set = new Set([...resume.skills, ...combined]);
        onChange({ ...resume, skills: Array.from(set).slice(0, 14) });
      }
    } catch (err) {
      console.error("Failed to suggest skills:", err);
    } finally {
      setSuggestingSkills(false);
    }
  };

  // Add individual skill tag
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillInput.trim()) return;
    if (!resume.skills.includes(newSkillInput.trim())) {
      onChange({ ...resume, skills: [...resume.skills, newSkillInput.trim()] });
    }
    setNewSkillInput("");
  };

  // Remove skill tag
  const handleRemoveSkill = (skillToRemove: string) => {
    onChange({ ...resume, skills: resume.skills.filter((s) => s !== skillToRemove) });
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 text-slate-800">
      {/* Top Banner / AI Quick Start */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-800">Resume Editor</span>
        </div>

        <button
          onClick={onOpenQuickGen}
          className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>Quick Bio Generate</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50/50 px-2 pt-1.5 gap-1 overflow-x-auto text-xs shrink-0">
        <button
          onClick={() => setActiveTab("experience")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "experience"
              ? "border-indigo-600 text-indigo-700 bg-white shadow-xs"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Experience</span>
        </button>

        <button
          onClick={() => setActiveTab("contact")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "contact"
              ? "border-indigo-600 text-indigo-700 bg-white shadow-xs"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Contact</span>
        </button>

        <button
          onClick={() => setActiveTab("summary")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "summary"
              ? "border-indigo-600 text-indigo-700 bg-white shadow-xs"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Summary</span>
        </button>

        <button
          onClick={() => setActiveTab("skills")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "skills"
              ? "border-indigo-600 text-indigo-700 bg-white shadow-xs"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Skills</span>
        </button>

        <button
          onClick={() => setActiveTab("education")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "education"
              ? "border-indigo-600 text-indigo-700 bg-white shadow-xs"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Education</span>
        </button>

        <button
          onClick={() => setActiveTab("extras")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "extras"
              ? "border-indigo-600 text-indigo-700 bg-white shadow-xs"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Extras</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: WORK EXPERIENCE (Core AI Powerhouse) */}
        {activeTab === "experience" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Job History & AI Bullets</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Type 1-2 quick sentences describing what you did → AI turns them into executive bullet points.
                </p>
              </div>

              <button
                onClick={handleAddJob}
                className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Position</span>
              </button>
            </div>

            {resume.experiences.map((exp, expIdx) => {
              const isExpanded = expandedJobs[exp.id] ?? true;
              const isGenerating = generatingBulletsFor === exp.id;

              return (
                <div
                  key={exp.id}
                  className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden shadow-xs transition-all"
                >
                  {/* Job Header Card */}
                  <div
                    onClick={() => toggleJobExpand(exp.id)}
                    className="p-3 bg-white flex justify-between items-center cursor-pointer hover:bg-slate-50 select-none border-b border-slate-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold font-mono">
                        {expIdx + 1}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {exp.jobTitle || "Untitled Role"}{" "}
                          <span className="text-slate-500 font-normal">
                            {exp.company ? `@ ${exp.company}` : ""}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {exp.startDate || "Start"} – {exp.isCurrent ? "Present" : exp.endDate || "End"}
                          {exp.location ? ` • ${exp.location}` : ""}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteJob(exp.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete position"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Job Expanded Body */}
                  {isExpanded && (
                    <div className="p-3.5 space-y-3.5 bg-slate-50/60">
                      {/* Inputs Row 1 */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                            Job Title
                          </label>
                          <input
                            type="text"
                            value={exp.jobTitle}
                            onChange={(e) => handleUpdateJob(exp.id, { jobTitle: e.target.value })}
                            placeholder="e.g. Lead Software Engineer"
                            className="w-full px-3 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                            Company Name
                          </label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => handleUpdateJob(exp.id, { company: e.target.value })}
                            placeholder="e.g. Stripe"
                            className="w-full px-3 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          />
                        </div>
                      </div>

                      {/* Inputs Row 2: Location & Dates */}
                      <div className="grid grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                            Location
                          </label>
                          <input
                            type="text"
                            value={exp.location || ""}
                            onChange={(e) => handleUpdateJob(exp.id, { location: e.target.value })}
                            placeholder="e.g. Remote / New York, NY"
                            className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                            Start Date
                          </label>
                          <input
                            type="text"
                            value={exp.startDate}
                            onChange={(e) => handleUpdateJob(exp.id, { startDate: e.target.value })}
                            placeholder="e.g. 2022 or Jan 2022"
                            className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                            End Date
                          </label>
                          <div className="flex gap-1.5 items-center">
                            <input
                              type="text"
                              disabled={exp.isCurrent}
                              value={exp.isCurrent ? "Present" : exp.endDate}
                              onChange={(e) => handleUpdateJob(exp.id, { endDate: e.target.value })}
                              placeholder="e.g. 2024"
                              className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateJob(exp.id, { isCurrent: !exp.isCurrent })}
                              className={`px-2 py-1.5 rounded-md text-[10px] font-semibold border shrink-0 cursor-pointer transition-colors ${
                                exp.isCurrent
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                              }`}
                            >
                              Current
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Brief 1-2 sentence description box */}
                      <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100 space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Quick Job Description / Rough Notes</span>
                          </label>
                          <span className="text-[10px] text-indigo-600 font-semibold">Only 1-2 sentences needed</span>
                        </div>

                        <textarea
                          rows={2}
                          value={exp.rawNotes || ""}
                          onChange={(e) => handleUpdateJob(exp.id, { rawNotes: e.target.value })}
                          placeholder="e.g. Built automated customer support bot with Node and OpenAI. Reduced ticket resolution time by 30% and managed team of 3."
                          className="w-full px-3 py-2 rounded-md bg-white border border-indigo-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all"
                        />

                        <button
                          onClick={() => handleGenerateBullets(exp.id)}
                          disabled={isGenerating}
                          className="w-full py-2 px-3 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                        >
                          {isGenerating ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Gemini AI is crafting high-impact bullets...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>Generate Impactful Bullets with AI</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Rendered Bullets List with inline AI polishers */}
                      <div className="space-y-2.5 pt-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                            Resume Bullet Points ({exp.bullets.length})
                          </span>
                          <button
                            onClick={() => handleAddBullet(exp.id)}
                            className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer font-bold"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add bullet</span>
                          </button>
                        </div>

                        {exp.bullets.map((bullet, bIdx) => (
                          <div
                            key={bIdx}
                            className="p-2.5 rounded-md bg-white border border-slate-200 space-y-2 group hover:border-slate-300 transition-all shadow-xs"
                          >
                            <div className="flex gap-2 items-start">
                              <span className="text-slate-400 text-xs font-mono mt-1.5">•</span>
                              <textarea
                                rows={2}
                                value={bullet}
                                onChange={(e) => handleBulletChange(exp.id, bIdx, e.target.value)}
                                className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none resize-none leading-relaxed"
                              />
                              <button
                                onClick={() => handleDeleteBullet(exp.id, bIdx)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Remove bullet"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Compact AI Polish Buttons */}
                            <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                              <span className="text-[10px] text-slate-400 font-medium">AI Polish:</span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handlePolishBullet(exp.id, bIdx, "quantify")}
                                  disabled={polishingBulletKey === `${exp.id}-${bIdx}-quantify`}
                                  className="px-2 py-0.5 rounded hover:bg-emerald-50 text-[10px] text-slate-600 hover:text-emerald-700 font-medium flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
                                  title="Add realistic metrics and percentage impact"
                                >
                                  {polishingBulletKey === `${exp.id}-${bIdx}-quantify` ? (
                                    <RefreshCw className="w-2.5 h-2.5 animate-spin text-emerald-600" />
                                  ) : (
                                    <TrendingUp className="w-2.5 h-2.5 text-emerald-600" />
                                  )}
                                  <span>+ Metric</span>
                                </button>

                                <button
                                  onClick={() => handlePolishBullet(exp.id, bIdx, "shorten")}
                                  disabled={polishingBulletKey === `${exp.id}-${bIdx}-shorten`}
                                  className="px-2 py-0.5 rounded hover:bg-amber-50 text-[10px] text-slate-600 hover:text-amber-700 font-medium flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
                                  title="Make bullet more concise to fit 1 line"
                                >
                                  {polishingBulletKey === `${exp.id}-${bIdx}-shorten` ? (
                                    <RefreshCw className="w-2.5 h-2.5 animate-spin text-amber-600" />
                                  ) : (
                                    <Scissors className="w-2.5 h-2.5 text-amber-600" />
                                  )}
                                  <span>✂ Trim</span>
                                </button>

                                <button
                                  onClick={() => handlePolishBullet(exp.id, bIdx, "strengthen")}
                                  disabled={polishingBulletKey === `${exp.id}-${bIdx}-strengthen`}
                                  className="px-2 py-0.5 rounded hover:bg-indigo-50 text-[10px] text-slate-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
                                  title="Upgrade to strong action verbs"
                                >
                                  {polishingBulletKey === `${exp.id}-${bIdx}-strengthen` ? (
                                    <RefreshCw className="w-2.5 h-2.5 animate-spin text-indigo-600" />
                                  ) : (
                                    <Zap className="w-2.5 h-2.5 text-indigo-600" />
                                  )}
                                  <span>🚀 Power</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: CONTACT & HEADER */}
        {activeTab === "contact" && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Contact Information</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                The personal contact details shown at the top of your resume.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={resume.contact.fullName}
                  onChange={(e) => handleContactChange("fullName", e.target.value)}
                  placeholder="e.g. Jordan Mitchell"
                  className="w-full px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white font-medium transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={resume.contact.email}
                    onChange={(e) => handleContactChange("email", e.target.value)}
                    placeholder="jordan@example.com"
                    className="w-full px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={resume.contact.phone}
                    onChange={(e) => handleContactChange("phone", e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="w-full px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Location (City, State / Country)
                </label>
                <input
                  type="text"
                  value={resume.contact.location}
                  onChange={(e) => handleContactChange("location", e.target.value)}
                  placeholder="e.g. Austin, TX (or Remote)"
                  className="w-full px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    LinkedIn
                  </label>
                  <input
                    type="text"
                    value={resume.contact.linkedin || ""}
                    onChange={(e) => handleContactChange("linkedin", e.target.value)}
                    placeholder="linkedin.com/in/username"
                    className="w-full px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    GitHub / Code
                  </label>
                  <input
                    type="text"
                    value={resume.contact.github || ""}
                    onChange={(e) => handleContactChange("github", e.target.value)}
                    placeholder="github.com/username"
                    className="w-full px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Portfolio / Web
                  </label>
                  <input
                    type="text"
                    value={resume.contact.website || ""}
                    onChange={(e) => handleContactChange("website", e.target.value)}
                    placeholder="portfolio.dev"
                    className="w-full px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PROFESSIONAL SUMMARY */}
        {activeTab === "summary" && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Professional Summary</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                A tight, 2-3 sentence overview optimized to fit cleanly on 1 printed page.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700">
                  Summary Text
                </label>
                <button
                  onClick={handleGenerateSummary}
                  disabled={generatingSummary}
                  className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  {generatingSummary ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Writing summary...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>✨ Auto-Generate with AI</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                rows={5}
                value={resume.summary}
                onChange={(e) => onChange({ ...resume, summary: e.target.value })}
                placeholder="Accomplished professional with 5+ years of experience..."
                className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white leading-relaxed transition-all"
              />

              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pro-tip: Keeping summaries between 45–65 words prevents page spillover.</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SKILLS */}
        {activeTab === "skills" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Skills & Competencies</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Extracted and categorized for ATS parsers and hiring managers.
                </p>
              </div>

              <button
                onClick={handleSuggestSkills}
                disabled={suggestingSkills}
                className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                {suggestingSkills ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting skills...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>✨ AI Suggest Skills</span>
                  </>
                )}
              </button>
            </div>

            {/* Add Skill Form */}
            <form onSubmit={handleAddSkill} className="flex gap-2">
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                placeholder="Type a skill (e.g. React, Financial Modeling, SQL) and hit Enter"
                className="flex-1 px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            {/* Current Skills Badges */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Current Skills ({resume.skills.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-xs text-slate-800 border border-slate-200 shadow-xs transition-colors"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: EDUCATION */}
        {activeTab === "education" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Education</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Degrees, universities, and honors.</p>
              </div>

              <button
                onClick={() => {
                  const newEdu: EducationItem = {
                    id: `edu-${Date.now()}`,
                    degree: "B.S. in Field of Study",
                    school: "University Name",
                    location: "City, State",
                    graduationYear: "2022",
                    gpaOrHonors: "",
                  };
                  onChange({ ...resume, education: [...resume.education, newEdu] });
                }}
                className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add School</span>
              </button>
            </div>

            {resume.education.map((edu, idx) => (
              <div
                key={edu.id}
                className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3 shadow-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900">Degree #{idx + 1}</span>
                  <button
                    onClick={() => {
                      onChange({
                        ...resume,
                        education: resume.education.filter((e) => e.id !== edu.id),
                      });
                    }}
                    className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Degree / Major
                    </label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => {
                        const updated = resume.education.map((x) =>
                          x.id === edu.id ? { ...x, degree: e.target.value } : x
                        );
                        onChange({ ...resume, education: updated });
                      }}
                      placeholder="e.g. B.S. in Computer Science"
                      className="w-full px-3 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      School / University
                    </label>
                    <input
                      type="text"
                      value={edu.school}
                      onChange={(e) => {
                        const updated = resume.education.map((x) =>
                          x.id === edu.id ? { ...x, school: e.target.value } : x
                        );
                        onChange({ ...resume, education: updated });
                      }}
                      placeholder="e.g. University of California, Berkeley"
                      className="w-full px-3 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Graduation Year
                    </label>
                    <input
                      type="text"
                      value={edu.graduationYear}
                      onChange={(e) => {
                        const updated = resume.education.map((x) =>
                          x.id === edu.id ? { ...x, graduationYear: e.target.value } : x
                        );
                        onChange({ ...resume, education: updated });
                      }}
                      placeholder="e.g. 2022"
                      className="w-full px-3 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Honors / GPA (Optional)
                    </label>
                    <input
                      type="text"
                      value={edu.gpaOrHonors || ""}
                      onChange={(e) => {
                        const updated = resume.education.map((x) =>
                          x.id === edu.id ? { ...x, gpaOrHonors: e.target.value } : x
                        );
                        onChange({ ...resume, education: updated });
                      }}
                      placeholder="e.g. Magna Cum Laude • 3.9 GPA"
                      className="w-full px-3 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 6: EXTRAS (Certifications & Projects) */}
        {activeTab === "extras" && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-indigo-600" />
                <span>Certifications & Key Projects</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Optional sections to tailor for specific industry requirements.
              </p>
            </div>

            {/* Certifications section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Certifications
                </span>
                <button
                  onClick={() => {
                    const newCert: CertificationItem = {
                      id: `cert-${Date.now()}`,
                      name: "Certification Name",
                      issuer: "Issuing Organization",
                      year: "2024",
                    };
                    onChange({
                      ...resume,
                      certifications: [...(resume.certifications || []), newCert],
                    });
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer font-bold"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Cert</span>
                </button>
              </div>

              {(resume.certifications || []).map((cert) => (
                <div
                  key={cert.id}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-12 gap-2 items-center shadow-xs"
                >
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={cert.name}
                      onChange={(e) => {
                        const updated = (resume.certifications || []).map((c) =>
                          c.id === cert.id ? { ...c, name: e.target.value } : c
                        );
                        onChange({ ...resume, certifications: updated });
                      }}
                      placeholder="e.g. PMP or AWS Architect"
                      className="w-full px-2 py-1 rounded-md bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="col-span-4">
                    <input
                      type="text"
                      value={cert.issuer}
                      onChange={(e) => {
                        const updated = (resume.certifications || []).map((c) =>
                          c.id === cert.id ? { ...c, issuer: e.target.value } : c
                        );
                        onChange({ ...resume, certifications: updated });
                      }}
                      placeholder="Issuer"
                      className="w-full px-2 py-1 rounded-md bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={cert.year}
                      onChange={(e) => {
                        const updated = (resume.certifications || []).map((c) =>
                          c.id === cert.id ? { ...c, year: e.target.value } : c
                        );
                        onChange({ ...resume, certifications: updated });
                      }}
                      placeholder="Year"
                      className="w-full px-2 py-1 rounded-md bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      onClick={() => {
                        onChange({
                          ...resume,
                          certifications: (resume.certifications || []).filter((c) => c.id !== cert.id),
                        });
                      }}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
