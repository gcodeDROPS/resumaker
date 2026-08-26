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
    : 85;

  let totalBulletCount = 0;
  resume.experiences.forEach((exp) => {
    totalBulletCount += (exp.bullets || []).length;
  });

  const suggestions: string[] = [];

  let status: "perfect" | "underfilled" | "overflow" = "perfect";
  let statusText = "Fits strictly on 1 Page";

  if (fillPercentage > 100) {
    status = "overflow";
    statusText = `Exceeds 1 Page (${fillPercentage}%)`;
    if (styling.autoFillPage) {
      suggestions.push("Auto-fill spacer is active. Turn it off or click Auto-Fit to compress content.");
    }
    if (styling.fontSize !== "compact") {
      suggestions.push("Switch Font Size to 'Compact' to bring everything onto a single page.");
    }
    if (styling.lineHeight !== "compact") {
      suggestions.push("Set Line Spacing to 'Tight' for higher content density.");
    }
    if (styling.marginSize !== "compact") {
      suggestions.push("Reduce Page Margins to 'Narrow' to gain vertical space.");
    }
    if (totalBulletCount > 9) {
      suggestions.push(`You have ${totalBulletCount} bullets across jobs. Trimming 1-2 bullets or clicking Auto-Fit ensures a crisp 1-page fit.`);
    }
  } else if (fillPercentage < 72) {
    status = "underfilled";
    statusText = `Underfilled (${fillPercentage}% of 1 Page)`;
    suggestions.push("Enable 'Auto-Fill Page Spacer' to evenly distribute whitespace across the full page.");
    suggestions.push("Switch to 'Spacious' font size and relaxed line spacing to balance visual weight.");
    if (!resume.summary || resume.summary.length < 30) {
      suggestions.push("Add a 2-3 sentence Professional Summary to highlight your strengths.");
    }
  } else {
    status = "perfect";
    statusText = styling.autoFillPage
      ? `Full 1-Page Layout with Auto-Spacer (${fillPercentage}%)`
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
  if (currentFillPercent > 100) {
    // Tighten to single page & disable extra spacer
    if (current.fontSize === "spacious") {
      return {
        ...current,
        fontSize: "normal",
        lineHeight: "normal",
        marginSize: "normal",
        autoFillPage: false,
      };
    }
    return {
      ...current,
      fontSize: "compact",
      lineHeight: "compact",
      marginSize: "compact",
      autoFillPage: false,
    };
  } else if (currentFillPercent < 75) {
    // Underfilled: expand font, margins and enable auto-fill vertical page spacer
    return {
      ...current,
      fontSize: "spacious",
      lineHeight: "spacious",
      marginSize: "spacious",
      autoFillPage: true,
    };
  } else if (currentFillPercent < 88) {
    // Moderately filled: enable auto-fill page spacer with normal font size
    return {
      ...current,
      fontSize: "normal",
      lineHeight: "normal",
      marginSize: "normal",
      autoFillPage: true,
    };
  } else {
    // Already well balanced: maintain clean 1-page layout
    return {
      ...current,
      fontSize: "normal",
      lineHeight: "normal",
      marginSize: "normal",
      autoFillPage: !current.autoFillPage, // Toggle spacer if already balanced
    };
  }
}

