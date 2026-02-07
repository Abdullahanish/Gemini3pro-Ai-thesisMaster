import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak, ImageRun, TableOfContents } from "docx";
import saveAs from "file-saver";
import { StudentInfo, ThesisSection, QAPair } from "../types";

// Helper to convert base64 data to ArrayBuffer
const base64ToArrayBuffer = (base64: string) => {
  const binaryString = window.atob(base64.split(',')[1]);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const generateThesisDoc = async (
  info: StudentInfo,
  sections: ThesisSection[],
  logoBase64: string | null
) => {
  const docSections = [];

  // --- Title Page ---
  const titlePageChildren: any[] = [];

  // Logo
  if (logoBase64) {
    try {
      const imageBuffer = base64ToArrayBuffer(logoBase64);
      // Determine image type from base64 header
      let imgType: "png" | "jpg" | "gif" | "bmp" = "png";
      if (logoBase64.includes("image/jpeg") || logoBase64.includes("image/jpg")) {
        imgType = "jpg";
      } else if (logoBase64.includes("image/gif")) {
        imgType = "gif";
      } else if (logoBase64.includes("image/bmp")) {
        imgType = "bmp";
      }

      titlePageChildren.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: imageBuffer,
              transformation: { width: 100, height: 100 },
              type: imgType,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );
    } catch (e) {
      console.warn("Could not add image to doc", e);
    }
  }

  // Title
  titlePageChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: info.topic.toUpperCase(),
          bold: true,
          size: 32, // 16pt
          font: "Times New Roman",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
    })
  );

  // Submission Text
  titlePageChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "A Thesis Submitted to",
          size: 24,
          font: "Times New Roman",
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
     new Paragraph({
      children: [
        new TextRun({
          text: info.university,
          bold: true,
          size: 28,
          font: "Times New Roman",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  titlePageChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "In partial fulfillment of the requirements for the degree of",
          size: 24,
          font: "Times New Roman",
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: info.degree,
          bold: true,
          size: 24,
          font: "Times New Roman",
        }),
      ],
      alignment: AlignmentType.CENTER,
    })
  );

  if (info.ects) {
    titlePageChildren.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: `(${info.ects})`,
                    size: 24,
                    font: "Times New Roman",
                }),
            ],
            alignment: AlignmentType.CENTER,
        })
    );
  }
  
  // Spacing after degree/ects
  titlePageChildren.push(
      new Paragraph({
          text: "",
          spacing: { after: 800 }
      })
  );

  // Author Info
  titlePageChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Submitted By:",
          bold: true,
          size: 24,
          font: "Times New Roman",
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: info.studentName,
          size: 24,
          font: "Times New Roman",
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Roll No: ${info.rollNumber}`,
          size: 24,
          font: "Times New Roman",
        }),
      ],
      alignment: AlignmentType.CENTER,
    })
  );

  if (info.groupMembers) {
      titlePageChildren.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: `Group Members: ${info.groupMembers}`,
                    size: 24,
                    font: "Times New Roman",
                }),
            ],
            alignment: AlignmentType.CENTER,
        })
      );
  }

  titlePageChildren.push(
      new Paragraph({
          text: "",
          spacing: { after: 400 }
      })
  );

   // Supervisor Info
   titlePageChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Supervised By:",
          bold: true,
          size: 24,
          font: "Times New Roman",
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: info.supervisor,
          size: 24,
          font: "Times New Roman",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
    })
  );

   // Year
   titlePageChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: info.submissionYear || new Date().getFullYear().toString(),
          size: 24,
          font: "Times New Roman",
        }),
        new PageBreak()
      ],
      alignment: AlignmentType.CENTER
    })
  );

  docSections.push({
    children: titlePageChildren,
  });

  // --- Main Content Section (TOC + Chapters) ---
  const contentChildren: any[] = [];

  // Table of Contents
  contentChildren.push(
      new Paragraph({
          children: [
              new TextRun({
                text: "TABLE OF CONTENTS",
                bold: true,
                size: 28, // 14pt
                font: "Times New Roman"
              })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
      }),
      new TableOfContents("Summary", {
          hyperlink: true,
          headingStyleRange: "1-3",
      }),
      new Paragraph({ children: [new PageBreak()] })
  );

  // List of Tables (Placeholder)
  contentChildren.push(
      new Paragraph({
          text: "LIST OF TABLES",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ 
          text: "[List of Tables placeholder - Update field in Word to generate]",
          spacing: { after: 400 },
          style: "Normal"
      }),
      new Paragraph({ children: [new PageBreak()] })
  );

  // List of Figures (Placeholder)
  contentChildren.push(
      new Paragraph({
          text: "LIST OF FIGURES",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ 
          text: "[List of Figures placeholder - Update field in Word to generate]",
          spacing: { after: 400 },
          style: "Normal" 
      }),
      new Paragraph({ children: [new PageBreak()] })
  );

  sections.forEach((section, index) => {
    // Parse formatting: "Chapter 1: Introduction" -> Split to "CHAPTER 1" and "INTRODUCTION"
    const isChapter = section.title.match(/^(Chapter \d+): (.+)$/i);

    if (isChapter) {
        contentChildren.push(
            new Paragraph({
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text: isChapter[1].toUpperCase(), // CHAPTER X
                        bold: true,
                        size: 28,
                        font: "Times New Roman"
                    }),
                    new TextRun({
                        text: "\n",
                        break: 1
                    }),
                    new TextRun({
                        text: isChapter[2].toUpperCase(), // TITLE
                        bold: true,
                        size: 28,
                        font: "Times New Roman"
                    })
                ],
                spacing: { before: 400, after: 400 },
            })
        );
    } else {
        // Regular Section Title (Abstract, References, etc.)
        contentChildren.push(
            new Paragraph({
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text: section.title.toUpperCase(),
                        bold: true,
                        size: 28,
                        font: "Times New Roman"
                    })
                ],
                spacing: { before: 400, after: 400 },
            })
        );
    }

    // Content Split by paragraphs
    const paragraphs = section.content.split('\n').filter(p => p.trim() !== '');
    
    paragraphs.forEach(p => {
        // Subheaders detection (simple heuristic)
        // If line is short, doesn't end in dot, maybe bold it (Heading 2)
        const isSubHeader = (p.length < 80 && !p.endsWith('.') && (p.endsWith(':') || /^\d+\.\d+/.test(p) || /^[A-Z][A-Z\s]+$/.test(p)));

        if (isSubHeader) {
             contentChildren.push(
                new Paragraph({
                    heading: HeadingLevel.HEADING_2, // Use Heading 2 for subheaders to show in TOC hierarchy
                    children: [
                        new TextRun({
                            text: p,
                            bold: true,
                            font: "Times New Roman",
                            size: 24,
                        })
                    ],
                    spacing: { before: 240, after: 120 }
                })
            );
        } else {
            contentChildren.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: p,
                            font: "Times New Roman",
                            size: 24, // 12pt
                        })
                    ],
                    spacing: { line: 480 }, // Double spacing (240 * 2)
                    alignment: AlignmentType.JUSTIFIED
                })
            );
        }
    });

    // Add page break only if it's not the last section
    if (index < sections.length - 1) {
        contentChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }
  });

  docSections.push({
    children: contentChildren,
  });

  const doc = new Document({
    sections: docSections,
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${info.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_thesis.docx`);
};

export const generateQADoc = async (qaList: QAPair[], topic: string) => {
    const children: Paragraph[] = [];

    children.push(
        new Paragraph({
            text: `Viva Voce Questions & Answers: ${topic}`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        })
    );

    qaList.forEach((qa, index) => {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `Q${index + 1}: ${qa.question}`,
                        bold: true,
                        size: 24,
                        font: "Times New Roman"
                    })
                ],
                spacing: { before: 240, after: 120 }
            })
        );
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: qa.answer,
                        size: 24,
                        font: "Times New Roman"
                    })
                ],
                spacing: { line: 480 }, // Double spacing
                alignment: AlignmentType.JUSTIFIED
            })
        );
    });

    const doc = new Document({
        sections: [{ children }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Viva_Questions_${topic.substring(0,20)}.docx`);
};