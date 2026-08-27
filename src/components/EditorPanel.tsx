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
  Pencil,
  MoreHorizontal,
  Lightbulb,
} from "lucide-react";

interface EditorPanelProps {
  resume: ResumeData;
  onChange: (updated: ResumeData) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  resume,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState<"contact" | "summary" | "experience" | "skills" | "education" | "extras">("experience");
  const [activeJobId, setActiveJobId] = useState<string | null>(resume.experiences[0]?.id || null);
  const [activeEduId, setActiveEduId] = useState<string | null>(resume.education[0]?.id || null);
  const [openPolishMenuKey, setOpenPolishMenuKey] = useState<string | null>(null);
  const [generatingBulletsFor, setGeneratingBulletsFor] = useState<string | null>(null);
  const [polishingBulletKey, setPolishingBulletKey] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [suggestingSkills, setSuggestingSkills] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState("");

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

  // Toggle job card expand (single accordion focus)
  const toggleJobExpand = (id: string) => {
    setActiveJobId((prev) => (prev === id ? null : id));
  };

  // Toggle education card expand
  const toggleEduExpand = (id: string) => {
    setActiveEduId((prev) => (prev === id ? null : id));
  };

  // Generate bullet points with Gemini AI from 1-2 sentence description
  const handleGenerateBullets = async (expId: string) => {
    const exp = resume.experiences.find((e) => e.id === expId);
    if (!exp) return;

    setGeneratingBulletsFor(expId);
    try {
      const otherExperiences = resume.experiences.filter((e) => e.id !== expId);
      const existingBullets = otherExperiences.flatMap((e) => e.bullets.filter(Boolean));
      const otherJobTitles = otherExperiences.map((e) => `${e.jobTitle || "Role"} at ${e.company || "Company"}`).filter(Boolean);

      const res = await fetch("/api/generate-bullets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: exp.jobTitle,
          company: exp.company,
          description: exp.rawNotes || (exp.jobTitle ? `${exp.jobTitle} at ${exp.company || "company"}` : ""),
          summary: resume.summary,
          targetRole: resume.contact.jobTitle,
          existingBullets,
          otherJobTitles,
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
    setActiveJobId(newId);
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

  // AI Skills Suggester - Deeply aligns skills with summary & work experience
  const handleSuggestSkills = async () => {
    setSuggestingSkills(true);
    try {
      const res = await fetch("/api/suggest-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: resume.contact.jobTitle,
          summary: resume.summary,
          experiences: resume.experiences.map((e) => ({
            title: e.jobTitle,
            company: e.company,
            notes: e.rawNotes,
            bullets: e.bullets,
          })),
          currentSkills: resume.skills,
        }),
      });
      const data = await res.json();
      const combined = [
        ...(data.technicalSkills || []),
        ...(data.toolsAndPlatforms || []),
        ...(data.coreCompetencies || []),
      ];
      if (combined.length > 0) {
        // Aligned skills directly replace / populate skills
        onChange({ ...resume, skills: combined.slice(0, 14) });
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
      {/* Top Banner */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-800">Resume Editor</span>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">1-Page ATS Optimized</span>
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
          <div className="space-y-3">
            {/* Header */}
            <div className="flex justify-between items-center bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Work History & Bullets</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Click any role to edit details or polish executive bullets.
                </p>
              </div>

              <button
                onClick={handleAddJob}
                className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Position</span>
              </button>
            </div>

            {/* Position List */}
            <div className="space-y-2.5">
              {resume.experiences.map((exp, expIdx) => {
                const isActive = activeJobId === exp.id;
                const isGenerating = generatingBulletsFor === exp.id;

                if (!isActive) {
                  // Collapsed, clean summary card
                  return (
                    <div
                      key={exp.id}
                      onClick={() => toggleJobExpand(exp.id)}
                      className="p-3 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xs flex items-center justify-between cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-6 h-6 rounded bg-slate-100 group-hover:bg-indigo-50 text-slate-600 group-hover:text-indigo-700 font-mono text-xs font-bold flex items-center justify-center shrink-0 transition-colors">
                          {expIdx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">
                            {exp.jobTitle || "Untitled Role"}{" "}
                            {exp.company && (
                              <span className="text-slate-500 font-normal">@ {exp.company}</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>
                              {exp.startDate || "Start"} – {exp.isCurrent ? "Present" : exp.endDate || "End"}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-indigo-600 font-medium">
                              {exp.bullets.length} {exp.bullets.length === 1 ? "bullet" : "bullets"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleJobExpand(exp.id);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteJob(exp.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete position"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                }

                // Expanded Active Job Editor (Clean, spacious, unnested)
                return (
                  <div
                    key={exp.id}
                    className="rounded-lg bg-white border-2 border-indigo-500/80 shadow-xs overflow-hidden transition-all"
                  >
                    {/* Active Job Header Bar */}
                    <div
                      onClick={() => toggleJobExpand(exp.id)}
                      className="px-3.5 py-2.5 bg-indigo-50/60 border-b border-indigo-100 flex justify-between items-center cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-indigo-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {expIdx + 1}
                        </div>
                        <span className="text-xs font-bold text-indigo-950">
                          Editing: {exp.jobTitle || "Untitled Position"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteJob(exp.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete position"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronUp className="w-4 h-4 text-indigo-600" />
                      </div>
                    </div>

                    {/* Active Job Body */}
                    <div className="p-4 space-y-4">
                      {/* Row 1: Title & Company */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                            Job Title
                          </label>
                          <input
                            type="text"
                            value={exp.jobTitle}
                            onChange={(e) => handleUpdateJob(exp.id, { jobTitle: e.target.value })}
                            placeholder="e.g. Senior Product Designer"
                            className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
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
                            className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                          />
                        </div>
                      </div>

                      {/* Row 2: Location & Dates */}
                      <div className="grid grid-cols-3 gap-2.5 items-end">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                            Location
                          </label>
                          <input
                            type="text"
                            value={exp.location || ""}
                            onChange={(e) => handleUpdateJob(exp.id, { location: e.target.value })}
                            placeholder="e.g. San Francisco, CA"
                            className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
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
                            placeholder="e.g. 2022"
                            className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                              End Date
                            </label>
                            <button
                              type="button"
                              onClick={() => handleUpdateJob(exp.id, { isCurrent: !exp.isCurrent })}
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                                exp.isCurrent
                                  ? "bg-indigo-100 text-indigo-800 font-bold"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              {exp.isCurrent ? "✓ Present" : "Present?"}
                            </button>
                          </div>
                          <input
                            type="text"
                            disabled={exp.isCurrent}
                            value={exp.isCurrent ? "Present" : exp.endDate}
                            onChange={(e) => handleUpdateJob(exp.id, { endDate: e.target.value })}
                            placeholder="e.g. 2024"
                            className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-100 disabled:text-slate-400 transition-all"
                          />
                        </div>
                      </div>

                      {/* Job Summary & Description (1-2 sentences) -> AI Bullets Generator */}
                      <div className="pt-2 pb-1 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Job Summary & Description</span>
                          </label>
                          <span className="text-[10px] text-slate-400 font-medium">1-2 sentences</span>
                        </div>
                        
                        <p className="text-[11px] text-slate-500 leading-normal">
                          Type a quick sentence or two describing what you did in this role. AI will transform it directly into tailored, metric-driven bullet points.
                        </p>

                        <div className="space-y-2">
                          <textarea
                            rows={3}
                            value={exp.rawNotes || ""}
                            onChange={(e) => handleUpdateJob(exp.id, { rawNotes: e.target.value })}
                            placeholder="e.g. Prepared meals on the high-volume grill during peak rushes, maintained food safety standards, and assisted with inventory restocking..."
                            className="w-full px-3 py-2 rounded-md bg-slate-50/70 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white resize-none transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => handleGenerateBullets(exp.id)}
                            disabled={isGenerating}
                            className="w-full py-2 px-3 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                          >
                            {isGenerating ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Crafting bullets from your description...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>Generate Bullets from Description</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Clean Bullet Points List */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            Bullet Points ({exp.bullets.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddBullet(exp.id)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer font-bold py-0.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add bullet</span>
                          </button>
                        </div>

                        <div className="space-y-2">
                          {exp.bullets.map((bullet, bIdx) => {
                            const bulletKey = `${exp.id}-${bIdx}`;
                            const isPolishOpen = openPolishMenuKey === bulletKey;

                            return (
                              <div
                                key={bIdx}
                                className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-200/90 hover:border-slate-300 focus-within:border-indigo-400 focus-within:bg-white transition-all space-y-2"
                              >
                                <div className="flex gap-2 items-start">
                                  <span className="text-slate-400 text-xs font-mono mt-1 select-none">•</span>
                                  <textarea
                                    rows={2}
                                    value={bullet}
                                    onChange={(e) => handleBulletChange(exp.id, bIdx, e.target.value)}
                                    placeholder="Action verb + core responsibility + measurable result..."
                                    className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none resize-none leading-relaxed"
                                  />
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => setOpenPolishMenuKey(isPolishOpen ? null : bulletKey)}
                                      className={`p-1 rounded text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                                        isPolishOpen
                                          ? "bg-indigo-100 text-indigo-700 font-bold"
                                          : "text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                                      }`}
                                      title="AI Polish Tools"
                                    >
                                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteBullet(exp.id, bIdx)}
                                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                      title="Delete bullet"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* On-demand Polish Tools (Only shown when requested for this bullet) */}
                                {isPolishOpen && (
                                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 bg-white p-1.5 rounded-md text-[10.5px]">
                                    <span className="text-slate-500 font-semibold flex items-center gap-1">
                                      <Sparkles className="w-3 h-3 text-indigo-600" />
                                      <span>1-Click Polish:</span>
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handlePolishBullet(exp.id, bIdx, "quantify")}
                                        disabled={polishingBulletKey === `${bulletKey}-quantify`}
                                        className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium flex items-center gap-1 transition-colors cursor-pointer border border-emerald-200"
                                        title="Add realistic metrics and percentage impact"
                                      >
                                        {polishingBulletKey === `${bulletKey}-quantify` ? (
                                          <RefreshCw className="w-2.5 h-2.5 animate-spin text-emerald-600" />
                                        ) : (
                                          <TrendingUp className="w-2.5 h-2.5 text-emerald-600" />
                                        )}
                                        <span>+ Metrics</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handlePolishBullet(exp.id, bIdx, "shorten")}
                                        disabled={polishingBulletKey === `${bulletKey}-shorten`}
                                        className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium flex items-center gap-1 transition-colors cursor-pointer border border-amber-200"
                                        title="Make bullet concise to fit 1 line"
                                      >
                                        {polishingBulletKey === `${bulletKey}-shorten` ? (
                                          <RefreshCw className="w-2.5 h-2.5 animate-spin text-amber-600" />
                                        ) : (
                                          <Scissors className="w-2.5 h-2.5 text-amber-600" />
                                        )}
                                        <span>✂ 1-Line</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handlePolishBullet(exp.id, bIdx, "strengthen")}
                                        disabled={polishingBulletKey === `${bulletKey}-strengthen`}
                                        className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-medium flex items-center gap-1 transition-colors cursor-pointer border border-indigo-200"
                                        title="Upgrade to executive action verbs"
                                      >
                                        {polishingBulletKey === `${bulletKey}-strengthen` ? (
                                          <RefreshCw className="w-2.5 h-2.5 animate-spin text-indigo-600" />
                                        ) : (
                                          <Zap className="w-2.5 h-2.5 text-indigo-600" />
                                        )}
                                        <span>🚀 Power Verb</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Education</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Degrees, universities, and honors.</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const newId = `edu-${Date.now()}`;
                  const newEdu: EducationItem = {
                    id: newId,
                    degree: "B.S. in Field of Study",
                    school: "University Name",
                    location: "City, State",
                    graduationYear: "2022",
                    gpaOrHonors: "",
                  };
                  onChange({ ...resume, education: [...resume.education, newEdu] });
                  setActiveEduId(newId);
                }}
                className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add School</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {resume.education.map((edu, idx) => {
                const isActive = activeEduId === edu.id;

                if (!isActive) {
                  return (
                    <div
                      key={edu.id}
                      onClick={() => toggleEduExpand(edu.id)}
                      className="p-3 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xs flex items-center justify-between cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-6 h-6 rounded bg-slate-100 group-hover:bg-indigo-50 text-slate-600 group-hover:text-indigo-700 font-mono text-xs font-bold flex items-center justify-center shrink-0 transition-colors">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">
                            {edu.degree || "Degree"} {edu.school && <span className="text-slate-500 font-normal">@ {edu.school}</span>}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {edu.graduationYear || "Graduation Year"} {edu.location ? `• ${edu.location}` : ""}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleEduExpand(edu.id);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onChange({
                              ...resume,
                              education: resume.education.filter((eItem) => eItem.id !== edu.id),
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete education"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={edu.id}
                    className="rounded-lg bg-white border-2 border-indigo-500/80 shadow-xs overflow-hidden transition-all"
                  >
                    <div
                      onClick={() => toggleEduExpand(edu.id)}
                      className="px-3.5 py-2.5 bg-indigo-50/60 border-b border-indigo-100 flex justify-between items-center cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-indigo-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </div>
                        <span className="text-xs font-bold text-indigo-950">
                          Editing: {edu.degree || "Degree"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onChange({
                              ...resume,
                              education: resume.education.filter((eItem) => eItem.id !== edu.id),
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete education"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronUp className="w-4 h-4 text-indigo-600" />
                      </div>
                    </div>

                    <div className="p-4 space-y-3.5">
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
                            className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
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
                            placeholder="e.g. UC Berkeley"
                            className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
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
                            className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
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
                            placeholder="e.g. Magna Cum Laude • 3.8 GPA"
                            className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
