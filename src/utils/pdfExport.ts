import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function exportResumeToPDF(elementId: string, fileName: string = "resume.pdf"): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("Resume element not found");
  }

  // Create an offscreen wrapper to render the unscaled 8.5in x 11in clone at 1:1
  const clone = element.cloneNode(true) as HTMLElement;
  clone.id = "resume-export-clone";
  clone.style.transform = "none";
  clone.style.margin = "0";
  clone.style.position = "fixed";
  clone.style.left = "-9999px";
  clone.style.top = "0";
  clone.style.width = "8.5in";
  clone.style.height = "11in";
  clone.style.minHeight = "11in";
  clone.style.maxHeight = "11in";
  clone.style.boxShadow = "none";
  clone.style.zIndex = "-1000";
  clone.style.backgroundColor = "#ffffff";
  clone.style.visibility = "visible";

  document.body.appendChild(clone);

  try {
    const canvas = await html2canvas(clone, {
      scale: 3, // Ultra-high resolution 300 DPI equivalent
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: clone.offsetWidth,
      height: clone.offsetHeight,
      windowWidth: clone.offsetWidth,
      windowHeight: clone.offsetHeight,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.98);
    // Standard US Letter dimensions in mm: 215.9 x 279.4
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "letter",
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
    pdf.save(fileName);
  } finally {
    if (clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }
  }
}

export function printResume(): void {
  window.print();
}

