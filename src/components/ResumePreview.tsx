import React, { useEffect, useRef } from "react";
import { ResumeData, StylingConfig, FontChoice } from "../types";
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Globe,
  Github,
  Award,
  GraduationCap,
  Briefcase,
  Layers,
  CheckCircle2,
} from "lucide-react";

interface ResumePreviewProps {
  resume: ResumeData;
  styling: StylingConfig;
  onUpdateHeight?: (heightPx: number, targetMaxPx: number) => void;
  scale?: number;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  resume,
  styling,
  onUpdateHeight,
  scale = 1,
}) => {
  const pageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Monitor rendered height vs 1-page standard height (11 inches at 96 DPI = 1056px)
  useEffect(() => {
    if (!contentRef.current || !pageRef.current) return;

    const measureHeight = () => {
      if (contentRef.current && pageRef.current) {
        const rendered = contentRef.current.scrollHeight;
        const pageHeight = pageRef.current.clientHeight;
        onUpdateHeight?.(rendered, pageHeight);
      }
    };

    measureHeight();
    const observer = new ResizeObserver(measureHeight);
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [resume, styling, onUpdateHeight]);

  // Font family mapping
  const getFontFamily = (font: FontChoice) => {
    switch (font) {
      case "merriweather":
        return "'Merriweather', Georgia, serif";
      case "playfair":
        return "'Playfair Display', Georgia, serif";
      case "jakarta":
        return "'Plus Jakarta Sans', sans-serif";
      case "outfit":
        return "'Outfit', sans-serif";
      case "mono":
        return "'JetBrains Mono', monospace";
      case "inter":
      default:
        return "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
    }
  };

  // Density spacing mapping
  const getFontSizeClasses = () => {
    switch (styling.fontSize) {
      case "compact":
        return {
          body: "text-[11.5px] leading-[1.35]",
          name: "text-[20px]",
          title: "text-[12px]",
          heading: "text-[12px] tracking-wide",
          subheading: "text-[11.5px]",
          meta: "text-[10.5px]",
          bullet: "text-[11px] leading-[1.35]",
          badge: "text-[10px] py-0.5 px-1.5",
        };
      case "spacious":
        return {
          body: "text-[13.5px] leading-[1.55]",
          name: "text-[26px]",
          title: "text-[14.5px]",
          heading: "text-[14px] tracking-wide",
          subheading: "text-[13.5px]",
          meta: "text-[12px]",
          bullet: "text-[13px] leading-[1.5]",
          badge: "text-[11.5px] py-1 px-2.5",
        };
      case "normal":
      default:
        return {
          body: "text-[12.5px] leading-[1.42]",
          name: "text-[23px]",
          title: "text-[13px]",
          heading: "text-[13px] tracking-wide",
          subheading: "text-[12.5px]",
          meta: "text-[11px]",
          bullet: "text-[12px] leading-[1.42]",
          badge: "text-[10.5px] py-0.5 px-2",
        };
    }
  };

  const getPaddingClass = () => {
    switch (styling.marginSize) {
      case "compact":
        return "p-6"; // ~0.35 in
      case "spacious":
        return "p-10"; // ~0.65 in
      case "normal":
      default:
        return "p-8"; // ~0.5 in
    }
  };

  const getSpacingClass = () => {
    switch (styling.lineHeight) {
      case "compact":
        return { sectionGap: "space-y-3.5", itemGap: "space-y-2", bulletGap: "space-y-1" };
      case "spacious":
        return { sectionGap: "space-y-5", itemGap: "space-y-3.5", bulletGap: "space-y-1.5" };
      case "normal":
      default:
        return { sectionGap: "space-y-4", itemGap: "space-y-2.5", bulletGap: "space-y-1" };
    }
  };

  const fontClasses = getFontSizeClasses();
  const spacingClasses = getSpacingClass();
  const primaryColor = styling.primaryColor || "#1e293b";

  // Contact list cleaner
  const contactItems = [
    resume.contact.email && {
      icon: Mail,
      text: resume.contact.email,
      href: `mailto:${resume.contact.email}`,
    },
    resume.contact.phone && {
      icon: Phone,
      text: resume.contact.phone,
      href: `tel:${resume.contact.phone}`,
    },
    resume.contact.location && {
      icon: MapPin,
      text: resume.contact.location,
    },
    resume.contact.linkedin && {
      icon: Linkedin,
      text: resume.contact.linkedin.replace(/^https?:\/\/(www\.)?/, ""),
      href: resume.contact.linkedin.startsWith("http")
        ? resume.contact.linkedin
        : `https://${resume.contact.linkedin}`,
    },
    resume.contact.github && {
      icon: Github,
      text: resume.contact.github.replace(/^https?:\/\/(www\.)?/, ""),
      href: resume.contact.github.startsWith("http")
        ? resume.contact.github
        : `https://${resume.contact.github}`,
    },
    resume.contact.website && {
      icon: Globe,
      text: resume.contact.website.replace(/^https?:\/\/(www\.)?/, ""),
      href: resume.contact.website.startsWith("http")
        ? resume.contact.website
        : `https://${resume.contact.website}`,
    },
  ].filter(Boolean) as { icon: any; text: string; href?: string }[];

  // Helper to filter out blank or empty education/cert items
  const validEducation = (resume.education || []).filter(
    (edu) => (edu.degree && edu.degree.trim().length > 0) || (edu.school && edu.school.trim().length > 0)
  );
  const hasEducation = validEducation.length > 0;

  const validCertifications = (resume.certifications || []).filter(
    (cert) => (cert.name && cert.name.trim().length > 0) || (cert.issuer && cert.issuer.trim().length > 0)
  );
  const hasCertifications = Boolean(styling.showCertifications && validCertifications.length > 0);

  // Render Template: TWO-COLUMN SIDEBAR
  if (styling.template === "twocolumn") {
    return (
      <div
        ref={pageRef}
        id="resume-print-target"
        className="bg-white text-slate-900 shadow-2xl relative select-text"
        style={{
          width: "8.5in",
          minHeight: "11in",
          height: "11in",
          maxHeight: "11in",
          fontFamily: getFontFamily(styling.font),
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div ref={contentRef} className="h-full grid grid-cols-12">
          {/* Left Column */}
          <div
            className="col-span-4 bg-slate-50 border-r border-slate-200 p-6 flex flex-col justify-between"
            style={{ backgroundColor: `${primaryColor}0d` }}
          >
            <div className="space-y-4">
              <div>
                <h1
                  className={`${fontClasses.name} font-bold tracking-tight text-slate-900 leading-tight`}
                  style={{ color: primaryColor }}
                >
                  {resume.contact.fullName || "Your Full Name"}
                </h1>
                {resume.contact.jobTitle ? (
                  <p className={`${fontClasses.title} font-medium text-slate-600 mt-1`}>
                    {resume.contact.jobTitle}
                  </p>
                ) : null}
              </div>

              {/* Contact Info */}
              <div className="space-y-2 pt-2 border-t border-slate-200/80">
                {contactItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className={`flex items-center gap-2 ${fontClasses.meta} text-slate-700`}>
                      <Icon className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{item.text}</span>
                    </div>
                  );
                })}
              </div>

              {/* Skills */}
              {resume.skills && resume.skills.length > 0 && (
                <div className="pt-3 border-t border-slate-200/80">
                  <h2
                    className={`${fontClasses.heading} font-bold uppercase tracking-wider mb-2`}
                    style={{ color: primaryColor }}
                  >
                    Skills & Tech
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {resume.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className={`${fontClasses.badge} rounded bg-white border border-slate-200/90 text-slate-800 font-medium`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {hasEducation && (
                <div className="pt-3 border-t border-slate-200/80">
                  <h2
                    className={`${fontClasses.heading} font-bold uppercase tracking-wider mb-2`}
                    style={{ color: primaryColor }}
                  >
                    Education
                  </h2>
                  <div className="space-y-2">
                    {validEducation.map((edu) => (
                      <div key={edu.id}>
                        <div className={`${fontClasses.subheading} font-semibold text-slate-900`}>
                          {edu.degree}
                        </div>
                        <div className={`${fontClasses.meta} text-slate-600`}>{edu.school}</div>
                        <div className={`${fontClasses.meta} text-slate-400 font-mono text-[10px]`}>
                          {edu.graduationYear}
                          {edu.location ? ` • ${edu.location}` : ""}
                        </div>
                        {edu.gpaOrHonors && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5">
                            {edu.gpaOrHonors}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {hasCertifications && (
                <div className="pt-3 border-t border-slate-200/80">
                  <h2
                    className={`${fontClasses.heading} font-bold uppercase tracking-wider mb-2`}
                    style={{ color: primaryColor }}
                  >
                    Certifications
                  </h2>
                  <div className="space-y-1.5">
                    {validCertifications.map((cert) => (
                      <div key={cert.id} className={`${fontClasses.meta} text-slate-700`}>
                        <span className="font-medium text-slate-900">{cert.name}</span>
                        <div className="text-[10px] text-slate-500">
                          {cert.issuer} • {cert.year}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div
            className={`col-span-8 ${getPaddingClass()} flex flex-col ${
              styling.autoFillPage !== false ? "justify-between" : `justify-start ${spacingClasses.sectionGap}`
            }`}
          >
            {/* Summary */}
            {styling.showSummary && resume.summary && (
              <div>
                <h2
                  className={`${fontClasses.heading} font-bold uppercase tracking-wider mb-1.5 pb-1 border-b border-slate-200`}
                  style={{ color: primaryColor }}
                >
                  Professional Summary
                </h2>
                <p className={`${fontClasses.body} text-slate-700 font-normal leading-relaxed`}>
                  {resume.summary}
                </p>
              </div>
            )}

            {/* Work Experience */}
            <div className={styling.autoFillPage !== false ? "my-auto" : ""}>
              <h2
                className={`${fontClasses.heading} font-bold uppercase tracking-wider mb-2.5 pb-1 border-b border-slate-200`}
                style={{ color: primaryColor }}
              >
                Work Experience
              </h2>
              <div className={spacingClasses.itemGap}>
                {resume.experiences.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-baseline">
                      <h3 className={`${fontClasses.subheading} font-bold text-slate-900`}>
                        {exp.jobTitle || "Job Title"}
                      </h3>
                      <span className={`${fontClasses.meta} text-slate-500 font-medium tabular-nums`}>
                        {exp.startDate} – {exp.isCurrent ? "Present" : exp.endDate}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className={`${fontClasses.meta} font-semibold text-slate-700`}>
                        {exp.company}
                        {exp.location ? ` • ${exp.location}` : ""}
                      </span>
                    </div>

                    <ul className={`${spacingClasses.bulletGap} list-disc list-outside pl-4 text-slate-700`}>
                      {exp.bullets.map((b, bIdx) => (
                        <li key={bIdx} className={`${fontClasses.bullet} pl-0.5`}>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Projects */}
            {styling.showProjects && resume.projects && resume.projects.length > 0 && (
              <div>
                <h2
                  className={`${fontClasses.heading} font-bold uppercase tracking-wider mb-2 pb-1 border-b border-slate-200`}
                  style={{ color: primaryColor }}
                >
                  Key Projects
                </h2>
                <div className="space-y-2">
                  {resume.projects.map((proj) => (
                    <div key={proj.id}>
                      <div className="flex justify-between items-baseline">
                        <span className={`${fontClasses.subheading} font-semibold text-slate-900`}>
                          {proj.title}
                        </span>
                        {proj.link && (
                          <span className="text-[10px] text-slate-500 font-mono">{proj.link}</span>
                        )}
                      </div>
                      <ul className="list-disc list-outside pl-4 text-slate-700 mt-1">
                        {proj.bullets.map((b, i) => (
                          <li key={i} className={fontClasses.bullet}>
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render Template: EXECUTIVE CLASSIC (Centered elegant serif header)
  if (styling.template === "executive") {
    return (
      <div
        ref={pageRef}
        id="resume-print-target"
        className={`bg-white text-slate-900 shadow-2xl relative select-text ${getPaddingClass()}`}
        style={{
          width: "8.5in",
          minHeight: "11in",
          height: "11in",
          maxHeight: "11in",
          fontFamily: getFontFamily(styling.font),
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div
          ref={contentRef}
          className={`h-full flex flex-col ${
            styling.autoFillPage !== false ? "justify-between" : `justify-start ${spacingClasses.sectionGap}`
          }`}
        >
          {/* Header */}
          <div className="text-center pb-3 border-b-2 border-slate-800">
            <h1
              className={`${fontClasses.name} font-serif font-bold tracking-tight text-slate-900 uppercase`}
              style={{ color: primaryColor }}
            >
              {resume.contact.fullName || "Your Full Name"}
            </h1>
            {resume.contact.jobTitle ? (
              <p className={`${fontClasses.title} font-serif italic text-slate-700 mt-0.5`}>
                {resume.contact.jobTitle}
              </p>
            ) : null}

            <div className={`flex flex-wrap justify-center items-center gap-x-3 gap-y-1 mt-2 ${fontClasses.meta} text-slate-600`}>
              {contactItems.map((item, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-slate-300">•</span>}
                  <span>{item.text}</span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Professional Summary */}
          {styling.showSummary && resume.summary && (
            <div>
              <h2
                className={`${fontClasses.heading} font-serif font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-1.5`}
                style={{ color: primaryColor }}
              >
                Executive Summary
              </h2>
              <p className={`${fontClasses.body} text-slate-800 text-justify leading-relaxed`}>
                {resume.summary}
              </p>
            </div>
          )}

          {/* Experience */}
          <div>
            <h2
              className={`${fontClasses.heading} font-serif font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2`}
              style={{ color: primaryColor }}
            >
              Professional Experience
            </h2>
            <div className={spacingClasses.itemGap}>
              {resume.experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline">
                    <span className={`${fontClasses.subheading} font-bold text-slate-900`}>
                      {exp.company}
                    </span>
                    <span className={`${fontClasses.meta} text-slate-600 font-serif italic`}>
                      {exp.startDate} – {exp.isCurrent ? "Present" : exp.endDate}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className={`${fontClasses.body} font-medium italic text-slate-700`}>
                      {exp.jobTitle}
                    </span>
                    {exp.location && (
                      <span className={`${fontClasses.meta} text-slate-500`}>{exp.location}</span>
                    )}
                  </div>
                  <ul className={`${spacingClasses.bulletGap} list-disc list-outside pl-4 text-slate-800`}>
                    {exp.bullets.map((bullet, idx) => (
                      <li key={idx} className={fontClasses.bullet}>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          {resume.skills && resume.skills.length > 0 && (
            <div>
              <h2
                className={`${fontClasses.heading} font-serif font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-1.5`}
                style={{ color: primaryColor }}
              >
                Core Competencies & Skills
              </h2>
              <p className={`${fontClasses.body} text-slate-800 leading-normal`}>
                <span className="font-semibold text-slate-900">Key Expertise: </span>
                {resume.skills.join(" • ")}
              </p>
            </div>
          )}

          {/* Education & Certs */}
          {(hasEducation || hasCertifications) && (
            <div className="grid grid-cols-12 gap-4">
              {hasEducation && (
                <div className={hasCertifications ? "col-span-7" : "col-span-12"}>
                  <h2
                    className={`${fontClasses.heading} font-serif font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-1.5`}
                    style={{ color: primaryColor }}
                  >
                    Education
                  </h2>
                  <div className="space-y-1.5">
                    {validEducation.map((edu) => (
                      <div key={edu.id} className="flex justify-between items-baseline">
                        <div>
                          <div className={`${fontClasses.subheading} font-bold text-slate-900`}>
                            {edu.degree}
                          </div>
                          <div className={`${fontClasses.meta} text-slate-700 italic`}>
                            {edu.school} {edu.gpaOrHonors ? `(${edu.gpaOrHonors})` : ""}
                          </div>
                        </div>
                        <span className={`${fontClasses.meta} text-slate-600 font-serif`}>
                          {edu.graduationYear}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasCertifications && (
                <div className={hasEducation ? "col-span-5" : "col-span-12"}>
                  <h2
                    className={`${fontClasses.heading} font-serif font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-1.5`}
                    style={{ color: primaryColor }}
                  >
                    Certifications
                  </h2>
                  <div className="space-y-1">
                    {validCertifications.map((cert) => (
                      <div key={cert.id} className={`${fontClasses.meta} text-slate-800`}>
                        <div className="font-semibold">{cert.name}</div>
                        <div className="text-slate-500 italic text-[10px]">{cert.issuer} • {cert.year}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Template: TECH CONTEMPORARY (Modern badges, clean grid, crisp mono accents)
  if (styling.template === "tech") {
    return (
      <div
        ref={pageRef}
        id="resume-print-target"
        className={`bg-white text-slate-900 shadow-2xl relative select-text ${getPaddingClass()}`}
        style={{
          width: "8.5in",
          minHeight: "11in",
          height: "11in",
          maxHeight: "11in",
          fontFamily: getFontFamily(styling.font),
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div
          ref={contentRef}
          className={`h-full flex flex-col ${
            styling.autoFillPage !== false ? "justify-between" : `justify-start ${spacingClasses.sectionGap}`
          }`}
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 pb-3" style={{ borderColor: primaryColor }}>
            <div>
              <h1 className={`${fontClasses.name} font-black tracking-tight text-slate-900`}>
                {resume.contact.fullName || "Your Full Name"}
              </h1>
              {resume.contact.jobTitle ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`${fontClasses.title} font-mono font-semibold px-2 py-0.5 rounded text-white`}
                    style={{ backgroundColor: primaryColor }}
                  >
                    {resume.contact.jobTitle}
                  </span>
                  {resume.contact.location && (
                    <span className={`${fontClasses.meta} text-slate-500 font-mono`}>
                      // {resume.contact.location}
                    </span>
                  )}
                </div>
              ) : resume.contact.location ? (
                <div className="mt-0.5">
                  <span className={`${fontClasses.meta} text-slate-500 font-mono`}>
                    // {resume.contact.location}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="text-right space-y-1">
              {resume.contact.email && (
                <div className={`${fontClasses.meta} font-mono text-slate-700`}>{resume.contact.email}</div>
              )}
              {resume.contact.phone && (
                <div className={`${fontClasses.meta} font-mono text-slate-600`}>{resume.contact.phone}</div>
              )}
              <div className="flex justify-end gap-2 text-slate-500 font-mono text-[10.5px]">
                {resume.contact.github && <span>{resume.contact.github.replace(/^https?:\/\//, "")}</span>}
                {resume.contact.linkedin && <span>• {resume.contact.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "in/")}</span>}
              </div>
            </div>
          </div>

          {/* Summary */}
          {styling.showSummary && resume.summary && (
            <div>
              <p className={`${fontClasses.body} text-slate-700 font-normal leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200/70`}>
                {resume.summary}
              </p>
            </div>
          )}

          {/* Technical Skills */}
          {resume.skills && resume.skills.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2
                  className={`${fontClasses.heading} font-mono font-bold uppercase tracking-wider text-slate-900`}
                  style={{ color: primaryColor }}
                >
                  &gt; Skills & Stack
                </h2>
                <div className="flex-1 border-t border-dashed border-slate-300" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {resume.skills.map((s, idx) => (
                  <span
                    key={idx}
                    className={`${fontClasses.badge} font-mono bg-slate-100 text-slate-800 rounded border border-slate-300/80 font-medium`}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2
                className={`${fontClasses.heading} font-mono font-bold uppercase tracking-wider text-slate-900`}
                style={{ color: primaryColor }}
              >
                &gt; Experience
              </h2>
              <div className="flex-1 border-t border-dashed border-slate-300" />
            </div>

            <div className={spacingClasses.itemGap}>
              {resume.experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline">
                    <div className="flex items-baseline gap-2">
                      <span className={`${fontClasses.subheading} font-bold text-slate-900`}>
                        {exp.jobTitle}
                      </span>
                      <span className="text-slate-400">@</span>
                      <span className={`${fontClasses.subheading} font-semibold text-slate-700`} style={{ color: primaryColor }}>
                        {exp.company}
                      </span>
                    </div>
                    <span className={`${fontClasses.meta} font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded`}>
                      {exp.startDate} — {exp.isCurrent ? "Present" : exp.endDate}
                    </span>
                  </div>

                  <ul className={`${spacingClasses.bulletGap} list-disc list-outside pl-4 text-slate-700 mt-1`}>
                    {exp.bullets.map((b, idx) => (
                      <li key={idx} className={fontClasses.bullet}>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Education & Credentials */}
          {(hasEducation || hasCertifications) && (
            <div className="grid grid-cols-12 gap-4">
              {hasEducation && (
                <div className={hasCertifications ? "col-span-7" : "col-span-12"}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h2
                      className={`${fontClasses.heading} font-mono font-bold uppercase tracking-wider text-slate-900`}
                      style={{ color: primaryColor }}
                    >
                      &gt; Education
                    </h2>
                    <div className="flex-1 border-t border-dashed border-slate-300" />
                  </div>
                  <div className="space-y-1">
                    {validEducation.map((edu) => (
                      <div key={edu.id} className="flex justify-between items-baseline">
                        <div>
                          <div className={`${fontClasses.subheading} font-semibold text-slate-900`}>
                            {edu.degree}
                          </div>
                          <div className={`${fontClasses.meta} text-slate-600`}>{edu.school}</div>
                        </div>
                        <span className={`${fontClasses.meta} font-mono text-slate-500`}>
                          {edu.graduationYear}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasCertifications && (
                <div className={hasEducation ? "col-span-5" : "col-span-12"}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h2
                      className={`${fontClasses.heading} font-mono font-bold uppercase tracking-wider text-slate-900`}
                      style={{ color: primaryColor }}
                    >
                      &gt; Credentials
                    </h2>
                    <div className="flex-1 border-t border-dashed border-slate-300" />
                  </div>
                  <div className="space-y-1">
                    {validCertifications.map((c) => (
                      <div key={c.id} className={`${fontClasses.meta} text-slate-700`}>
                        <span className="font-semibold text-slate-900">{c.name}</span>
                        <div className="text-[10px] font-mono text-slate-500">{c.issuer} ({c.year})</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Template: MODERN CLEAN (Default universal corporate & tech favorite)
  return (
    <div
      ref={pageRef}
      id="resume-print-target"
      className={`bg-white text-slate-900 shadow-2xl relative select-text ${getPaddingClass()}`}
      style={{
        width: "8.5in",
        minHeight: "11in",
        height: "11in",
        maxHeight: "11in",
        fontFamily: getFontFamily(styling.font),
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div
        ref={contentRef}
        className={`h-full flex flex-col ${
          styling.autoFillPage !== false ? "justify-between" : `justify-start ${spacingClasses.sectionGap}`
        }`}
      >
        {/* Header */}
        <div className="pb-3 border-b-2" style={{ borderColor: primaryColor }}>
          <div className="flex justify-between items-end">
            <div>
              <h1
                className={`${fontClasses.name} font-bold tracking-tight text-slate-900 leading-tight`}
                style={{ color: primaryColor }}
              >
                {resume.contact.fullName || "Your Full Name"}
              </h1>
              {resume.contact.jobTitle ? (
                <p className={`${fontClasses.title} font-medium text-slate-600 mt-0.5`}>
                  {resume.contact.jobTitle}
                </p>
              ) : null}
            </div>
            <div className="text-right">
              {resume.contact.location && (
                <div className={`${fontClasses.meta} font-medium text-slate-500`}>
                  {resume.contact.location}
                </div>
              )}
            </div>
          </div>

          <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 ${fontClasses.meta} text-slate-600`}>
            {contactItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center gap-1.5">
                  <Icon className="w-3 h-3 text-slate-400" />
                  <span>{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        {styling.showSummary && resume.summary && (
          <div>
            <h2
              className={`${fontClasses.heading} font-bold uppercase tracking-wider mb-1.5 flex items-center gap-2`}
              style={{ color: primaryColor }}
            >
              <span>Professional Summary</span>
              <span className="flex-1 h-px bg-slate-200" />
            </h2>
            <p className={`${fontClasses.body} text-slate-700 font-normal leading-relaxed`}>
              {resume.summary}
            </p>
          </div>
        )}

        {/* Experience */}
        <div>
          <h2
            className={`${fontClasses.heading} font-bold uppercase tracking-wider mb-2 flex items-center gap-2`}
            style={{ color: primaryColor }}
          >
            <span>Work Experience</span>
            <span className="flex-1 h-px bg-slate-200" />
          </h2>

          <div className={spacingClasses.itemGap}>
            {resume.experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <h3 className={`${fontClasses.subheading} font-bold text-slate-900`}>
                    {exp.jobTitle || "Job Title"}
                  </h3>
                  <span className={`${fontClasses.meta} font-semibold text-slate-500 tabular-nums`}>
                    {exp.startDate} – {exp.isCurrent ? "Present" : exp.endDate}
                  </span>
                </div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className={`${fontClasses.meta} font-semibold text-slate-700`}>
                    {exp.company}
                    {exp.location ? ` • ${exp.location}` : ""}
                  </span>
                </div>

                <ul className={`${spacingClasses.bulletGap} list-disc list-outside pl-4 text-slate-700`}>
                  {exp.bullets.map((bullet, idx) => (
                    <li key={idx} className={fontClasses.bullet}>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Skills */}
        {resume.skills && resume.skills.length > 0 && (
          <div>
            <h2
              className={`${fontClasses.heading} font-bold uppercase tracking-wider mb-1.5 flex items-center gap-2`}
              style={{ color: primaryColor }}
            >
              <span>Core Skills & Technologies</span>
              <span className="flex-1 h-px bg-slate-200" />
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {resume.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className={`${fontClasses.badge} bg-slate-100 text-slate-800 font-medium rounded border border-slate-200/80`}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Education & Certs */}
        {(hasEducation || hasCertifications) && (
          <div className="grid grid-cols-12 gap-4">
            {hasEducation && (
              <div className={hasCertifications ? "col-span-7" : "col-span-12"}>
                <h2
                  className={`${fontClasses.heading} font-bold uppercase tracking-wider mb-1.5 flex items-center gap-2`}
                  style={{ color: primaryColor }}
                >
                  <span>Education</span>
                  <span className="flex-1 h-px bg-slate-200" />
                </h2>
                <div className="space-y-1">
                  {validEducation.map((edu) => (
                    <div key={edu.id} className="flex justify-between items-baseline">
                      <div>
                        <div className={`${fontClasses.subheading} font-bold text-slate-900`}>
                          {edu.degree}
                        </div>
                        <div className={`${fontClasses.meta} text-slate-600`}>
                          {edu.school}
                          {edu.gpaOrHonors ? ` • ${edu.gpaOrHonors}` : ""}
                        </div>
                      </div>
                      <span className={`${fontClasses.meta} font-medium text-slate-500`}>
                        {edu.graduationYear}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasCertifications && (
              <div className={hasEducation ? "col-span-5" : "col-span-12"}>
                <h2
                  className={`${fontClasses.heading} font-bold uppercase tracking-wider mb-1.5 flex items-center gap-2`}
                  style={{ color: primaryColor }}
                >
                  <span>Certifications</span>
                  <span className="flex-1 h-px bg-slate-200" />
                </h2>
                <div className="space-y-1">
                  {validCertifications.map((cert) => (
                    <div key={cert.id} className={`${fontClasses.meta} text-slate-700`}>
                      <div className="font-semibold text-slate-900">{cert.name}</div>
                      <div className="text-[10.5px] text-slate-500">{cert.issuer} • {cert.year}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Projects (if enabled) */}
        {styling.showProjects && resume.projects && resume.projects.length > 0 && (
          <div>
            <h2
              className={`${fontClasses.heading} font-bold uppercase tracking-wider mb-1.5 flex items-center gap-2`}
              style={{ color: primaryColor }}
            >
              <span>Projects</span>
              <span className="flex-1 h-px bg-slate-200" />
            </h2>
            <div className="space-y-1.5">
              {resume.projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline">
                    <span className={`${fontClasses.subheading} font-bold text-slate-900`}>
                      {proj.title}
                    </span>
                    {proj.link && (
                      <span className="text-[10px] text-slate-500 font-mono">{proj.link}</span>
                    )}
                  </div>
                  <ul className="list-disc list-outside pl-4 text-slate-700">
                    {proj.bullets.map((b, i) => (
                      <li key={i} className={fontClasses.bullet}>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
