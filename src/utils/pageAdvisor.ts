import { ResumeData, StylingConfig } from "../types";

export interface PageFitResult {
  fillPercentage: number; // e.g. 92%
  status: "perfect" | "underfilled" | "overflow";
  statusText: string;
  totalBulletCount: number;
  suggestions: string[];
}

export function evaluateOnePageFit(
  resume: ResumeData,
  styling: StylingConfig,
  renderedHeightPx: number,
  containerHeightPx: number
): PageFitResult {
  const fillPercentage = containerHeightPx > 0 
    ? Math.round((renderedHeightPx / containerHeightPx) * 100)
    : 82;

  let totalBulletCount = 0;
  resume.experiences.forEach((exp) => {
    totalBulletCount += (exp.bullets || []).length;
  });

  const suggestions: string[] = [];

  let status: "perfect" | "underfilled" | "overflow" = "perfect";
  let statusText = "Fits strictly on 1 Page";

  if (fillPercentage > 102) {
    status = "overflow";
    statusText = "Exceeds 1 Page";
    if (styling.fontSize !== "compact") {
      suggestions.push("Switch Font Size to 'Compact' to fit on 1 page.");
    }
    if (styling.lineHeight !== "compact") {
      suggestions.push("Set Line Spacing to 'Compact' for higher density.");
    }
    if (styling.marginSize !== "compact") {
      suggestions.push("Reduce Page Margins to 'Compact'.");
    }
    if (totalBulletCount > 9) {
      suggestions.push(`You have ${totalBulletCount} bullets across jobs. Trimming 1-2 bullets or using Auto-Fit will ensure crisp 1-page fit.`);
    }
  } else if (fillPercentage < 68) {
    status = "underfilled";
    statusText = "Short resume — plenty of space";
    suggestions.push("Switch to 'Spacious' formatting or add a 2-3 sentence AI summary to reach 80%+ visual weight.");
    if (resume.summary.length < 30) {
      suggestions.push("Add a 2-3 sentence AI Professional Summary to highlight your strengths.");
    }
  } else {
    status = "perfect";
    statusText = fillPercentage >= 75 
      ? `Balanced 1-Page Layout (${fillPercentage}%)`
      : `Clean 1-Page Layout (${fillPercentage}%)`;
  }

  return {
    fillPercentage,
    status,
    statusText,
    totalBulletCount,
    suggestions,
  };
}

export function autoFitConfig(current: StylingConfig, currentFillPercent: number): StylingConfig {
  if (currentFillPercent > 102) {
    // Tighten to single page
    return {
      ...current,
      fontSize: "compact",
      lineHeight: "compact",
      marginSize: "compact",
    };
  } else if (currentFillPercent < 72) {
    // Expand gently to reach ~80% coverage
    return {
      ...current,
      fontSize: "spacious",
      lineHeight: "spacious",
      marginSize: "spacious",
    };
  } else {
    // Balanced normal
    return {
      ...current,
      fontSize: "normal",
      lineHeight: "normal",
      marginSize: "normal",
    };
  }
}
