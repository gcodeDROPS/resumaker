import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function exportResumeToPDF(elementId: string, fileName: string = "resume.pdf"): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("Resume element not found");
  }

  // Hide any edit markers temporarily if any
  const editButtons = element.querySelectorAll(".resume-edit-marker");
  editButtons.forEach((el) => ((el as HTMLElement).style.display = "none"));

  try {
    const canvas = await html2canvas(element, {
      scale: 2.5, // High resolution for crystal clear print
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
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
    editButtons.forEach((el) => ((el as HTMLElement).style.display = ""));
  }
}

export function printResume(): void {
  window.print();
}
