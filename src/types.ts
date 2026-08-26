export interface ContactInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  website?: string;
  github?: string;
}

export interface ExperienceItem {
  id: string;
  jobTitle: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  rawNotes?: string;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  degree: string;
  school: string;
  location?: string;
  graduationYear: string;
  gpaOrHonors?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  role?: string;
  link?: string;
  bullets: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export interface ResumeData {
  contact: ContactInfo;
  summary: string;
  experiences: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  projects?: ProjectItem[];
  certifications?: CertificationItem[];
}

export type TemplateId = "modern" | "executive" | "minimal" | "tech" | "twocolumn";

export type FontChoice = "inter" | "jakarta" | "outfit" | "merriweather" | "playfair" | "mono";

export type DensityOption = "compact" | "normal" | "spacious";

export interface StylingConfig {
  template: TemplateId;
  font: FontChoice;
  primaryColor: string; // Hex or theme color for headings & accents
  fontSize: DensityOption;
  lineHeight: DensityOption;
  marginSize: DensityOption;
  showProjects: boolean;
  showCertifications: boolean;
  showSummary: boolean;
  autoFillPage?: boolean; // When true, distributes vertical space to fill exactly 1 page
}
