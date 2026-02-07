import { jsPDF } from "jspdf";
import { StudentInfo, ThesisSection } from "../types";

export const generateThesisPDF = (
  info: StudentInfo,
  sections: ThesisSection[],
  logoBase64: string | null
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25.4; // 1 inch
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  // Helper to check page break
  const checkPageBreak = (heightNeeded: number) => {
    if (cursorY + heightNeeded > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
        return true;
    }
    return false;
  };

  // Helper to add centered text
  const addCenteredText = (text: string, fontSize: number = 12, isBold: boolean = false, spacingAfter: number = 10) => {
    doc.setFont("times", isBold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    
    const textLines = doc.splitTextToSize(text, contentWidth);
    const lineHeight = fontSize * 0.3527 * 1.5; // conversion pt to mm * line spacing

    textLines.forEach((line: string) => {
        checkPageBreak(lineHeight);
        doc.text(line, pageWidth / 2, cursorY, { align: "center" });
        cursorY += lineHeight;
    });
    cursorY += spacingAfter;
  };

  // --- Title Page ---
  
  // Logo
  if (logoBase64) {
    try {
        const imgProps = doc.getImageProperties(logoBase64);
        const imgWidth = 30;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        doc.addImage(logoBase64, 'PNG', (pageWidth - imgWidth) / 2, cursorY, imgWidth, imgHeight);
        cursorY += imgHeight + 10;
    } catch (e) {
        console.warn("Error adding logo to PDF", e);
        // Fallback or skip
    }
  } else {
      cursorY += 20;
  }

  addCenteredText(info.topic.toUpperCase(), 16, true, 20);

  addCenteredText("A Thesis Submitted to", 12, false, 5);
  addCenteredText(info.university, 14, true, 20);

  addCenteredText("In partial fulfillment of the requirements for the degree of", 12, false, 5);
  addCenteredText(info.degree, 14, true, 5);
  
  if (info.ects) {
      addCenteredText(`(${info.ects})`, 12, false, 20);
  } else {
      cursorY += 15;
  }

  addCenteredText("Submitted By:", 12, true, 5);
  addCenteredText(info.studentName, 12, false, 5);
  addCenteredText(`Roll No: ${info.rollNumber}`, 12, false, 10);
  
  if (info.groupMembers) {
      addCenteredText(`Group Members: ${info.groupMembers}`, 12, false, 10);
  }

  cursorY += 10;

  addCenteredText("Supervised By:", 12, true, 5);
  addCenteredText(info.supervisor, 12, false, 20);

  // Push year to bottom
  const yearY = pageHeight - margin - 10;
  if (cursorY < yearY) cursorY = yearY;
  addCenteredText(info.submissionYear || new Date().getFullYear().toString(), 12, false, 0);

  doc.addPage();
  cursorY = margin;

  // --- Content ---
  
  sections.forEach((section) => {
    // Section Title
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    
    // Check if it's a chapter
    const match = section.title.match(/^(Chapter \d+): (.+)$/i);
    if (match) {
        checkPageBreak(30);
        doc.text(match[1].toUpperCase(), pageWidth / 2, cursorY, { align: "center" });
        cursorY += 10;
        doc.text(match[2].toUpperCase(), pageWidth / 2, cursorY, { align: "center" });
    } else {
        checkPageBreak(15);
        doc.text(section.title.toUpperCase(), pageWidth / 2, cursorY, { align: "center" });
    }
    
    cursorY += 15;

    // Body Content
    doc.setFont("times", "normal");
    doc.setFontSize(12);

    const paragraphs = section.content.split('\n');
    
    paragraphs.forEach(p => {
        if (!p.trim()) return;

        // Simple Subheader detection
        const isSubHeader = (p.length < 80 && !p.endsWith('.') && (p.endsWith(':') || /^\d+\.\d+/.test(p) || /^[A-Z][A-Z\s]+$/.test(p)));
        
        if (isSubHeader) {
            cursorY += 5;
            doc.setFont("times", "bold");
        } else {
            doc.setFont("times", "normal");
        }

        const lines = doc.splitTextToSize(p, contentWidth);
        const lineHeight = 6; // Approx line height for 12pt with spacing
        
        // Check for page break needed
        if (checkPageBreak(lines.length * lineHeight + 5)) {
            // if page break happened, reset font
             if (isSubHeader) doc.setFont("times", "bold");
             else doc.setFont("times", "normal");
        }

        doc.text(lines, margin, cursorY);
        cursorY += (lines.length * lineHeight) + 6; // Line height + paragraph spacing
    });

    doc.addPage();
    cursorY = margin;
  });

  // Page Numbers
  const pageCount = doc.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("times", "normal");
      doc.setFontSize(10);
      doc.text(`${i}`, pageWidth / 2, pageHeight - 10, { align: "center" });
  }

  doc.save(`${info.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_thesis.pdf`);
};