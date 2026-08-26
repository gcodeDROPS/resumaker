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
  const rawFillPercentage = containerHeightPx > 0 
    ? Math.round((renderedHeightPx / containerHeightPx) * 100)
    : 85;

  // When autoFillPage is enabled, if it's within 1 page (<=102%), it fills 100% of the canvas
  const fillPercentage = styling.autoFillPage !== false && rawFillPercentage <= 102
    ? 100
    : rawFillPercentage;

  let totalBulletCount = 0;
  resume.experiences.forEach((exp) => {
    totalBulletCount += (exp.bullets || []).length;
  });

  const suggestions: string[] = [];

  let status: "perfect" | "underfilled" | "overflow" = "perfect";
  let statusText = "Fits strictly on 1 Page";

  if (rawFillPercentage > 102) {
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
      suggestions.push(`You have ${totalBulletCount} bullets across jobs. Trimming 1-2 bullets or using ⚡ Auto-Fit will ensure crisp 1-page fit.`);
    }
  } else if (rawFillPercentage < 75 && styling.autoFillPage === false) {
    status = "underfilled";
    statusText = "Short resume — space available";
    suggestions.push("Click 'Auto-Fit 1-Page' to automatically expand spacing, fonts, and fill up the entire page.");
    if (resume.summary.length < 50) {
      suggestions.push("Add a 2-3 sentence AI Professional Summary to highlight your strengths.");
    }
  } else {
    status = "perfect";
    statusText = styling.autoFillPage !== false
      ? "Auto-Fitted to 1 Full Page (100%)"
      : "Optimal 1-Page Proportions (90-100%)";
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
  if (currentFillPercent > 100) {
    // Needs tightening to prevent 2nd page overflow
    return {
      ...current,
      fontSize: "compact",
      lineHeight: "compact",
      marginSize: "compact",
      autoFillPage: false,
    };
  } else {
    // Underfilled or short resume — expand and distribute evenly to fill the entire 1-page
    return {
      ...current,
      fontSize: "spacious",
      lineHeight: "spacious",
      marginSize: "spacious",
      autoFillPage: true,
    };
  }
}
