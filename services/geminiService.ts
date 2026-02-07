import { GoogleGenAI, Type } from "@google/genai";
import { StudentInfo, PlagiarismResult } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

// Retry helper for 429/503 errors
const runWithRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const status = error.status || error.response?.status;
    const isQuotaError = status === 429 || error.message?.includes('429') || error.message?.includes('quota');
    const isServerOverload = status === 503;

    if (retries > 0 && (isQuotaError || isServerOverload)) {
      console.warn(`API Limit hit (${status}). Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return runWithRetry(fn, retries - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
};

// Estimate word count based on section type and total requested pages
// Standard: 1 page ~ 250 words (double spaced)
const getTargetWordCount = (sectionTitle: string, totalPagesStr?: string): number => {
    if (!totalPagesStr) return 800; // Default substantial length
    
    const totalPages = parseInt(totalPagesStr, 10);
    if (isNaN(totalPages) || totalPages < 1) return 800;

    const totalWords = totalPages * 250;
    
    // Weighted distribution for standard chapters
    const lowerTitle = sectionTitle.toLowerCase();
    
    if (lowerTitle.includes('introduction')) return Math.max(800, totalWords * 0.10);
    if (lowerTitle.includes('literature review')) return Math.max(1000, totalWords * 0.20);
    if (lowerTitle.includes('methodology')) return Math.max(800, totalWords * 0.15);
    if (lowerTitle.includes('data analysis')) return Math.max(1000, totalWords * 0.25);
    if (lowerTitle.includes('discussion')) return Math.max(800, totalWords * 0.20);
    if (lowerTitle.includes('conclusion')) return Math.max(500, totalWords * 0.10);
    
    // Front matter / End matter
    if (lowerTitle.includes('abstract')) return 300; // Fixed constraint usually
    if (lowerTitle.includes('declaration')) return 150;
    if (lowerTitle.includes('acknowledgements')) return 200;
    
    return 500;
};

export const generateSectionContent = async (
  sectionTitle: string,
  promptContext: string,
  studentInfo: StudentInfo
): Promise<string> => {
  
  const targetWordCount = getTargetWordCount(sectionTitle, studentInfo.targetPages);

  const systemInstruction = `You are an expert academic research assistant writing a Ph.D. or Master's level thesis. 
  Follow these rules rigorously:
  1. Tone: Formal, academic, objective, and third-person.
  2. Formatting: Use plain text with clear headings. Do NOT use Markdown formatting like bold (**text**) or italics (*text*) excessively. Use CAPITALIZED headings for major sections if needed.
  3. Content: Be specific to the topic provided. Invent realistic data, case studies, or statistics if necessary to fill the structure, but ensure they are plausible.
  4. Length: The user has requested a thesis of approximately ${studentInfo.targetPages || 'standard'} pages. For this section, generate approximately ${Math.round(targetWordCount)} words. Expand on points, provide detailed explanations, and avoid brevity.
  5. Citation Style: APA 7th Edition. You MUST include frequent in-text citations (paragraph references) for claims, especially in the Literature Review and Introduction. Invent realistic citations (e.g., (Smith, 2023)) if exact sources are not provided.
  
  Topic: ${studentInfo.topic}
  Degree: ${studentInfo.degree}
  `;

  const userPrompt = `
    Please write the content for **${sectionTitle}**.
    
    Specific Instructions: ${promptContext}
    
    Target Length: Approximately ${Math.round(targetWordCount)} words.
    
    Context about the thesis:
    Topic: ${studentInfo.topic}
    Student: ${studentInfo.studentName || 'N/A'}
    Supervisor: ${studentInfo.supervisor}
    Group Members: ${studentInfo.groupMembers || 'N/A'}
    
    ${studentInfo.referenceFile ? "NOTE: A reference document/example paper is attached. Use its style and context as inspiration where relevant, but do not copy it directly." : ""}
    
    Ensure the content is detailed, structured logically with subheadings, and flows well. 
    CRITICAL: Include in-text citations (e.g., (Smith, 2023)) throughout the paragraphs.
  `;

  const parts: any[] = [{ text: userPrompt }];

  if (studentInfo.referenceFile) {
    // extract base64 data
    try {
      const base64Data = studentInfo.referenceFile.split(',')[1];
      if (base64Data) {
          parts.push({
              inlineData: {
                  mimeType: "application/pdf",
                  data: base64Data
              }
          });
      }
    } catch (e) {
      console.warn("Error parsing reference file base64", e);
    }
  }

  try {
    const ai = getAiClient();
    // Using gemini-3-flash-preview instead of pro to avoid hitting quota limits (429)
    const response = await runWithRetry(async () => {
      return await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: { parts },
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });
    });

    return response.text || "Failed to generate content.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.status === 429 || error.message?.includes('429')) {
        return "Error: API Quota Exceeded. Please try again in a few moments or verify your billing/quota status.";
    }
    return "Error generating content. Please check that your API key is correctly configured.";
  }
};

export const generateInterviewQuestions = async (
  studentInfo: StudentInfo,
  fullThesisContext: string
): Promise<string> => {
  
  // Truncate context to stay within safe limits for text-only model if needed
  const safeContext = fullThesisContext.substring(0, 50000); 

  const prompt = `
    Based on the following thesis content regarding the topic "${studentInfo.topic}", generate 15 challenging Viva Voce (Defense) questions and their comprehensive answers.
    
    Questions should cover:
    1. Problem Statement & Significance
    2. Methodology justification
    3. Results interpretation
    4. Limitations & Future Scope
    5. Theoretical concepts
    
    The output should be formatted as a JSON array of objects with 'question' and 'answer' properties.
    
    Thesis Context Snippet:
    ${safeContext}
  `;

  try {
    const ai = getAiClient();
    const response = await runWithRetry(async () => {
      return await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
    });

    return response.text || "[]";
  } catch (error) {
    console.error("Gemini Q&A Error:", error);
    return "[]";
  }
};

export const checkPlagiarism = async (text: string): Promise<PlagiarismResult> => {
    const prompt = `
      Act as an academic plagiarism and originality detector. Analyze the following text.
      Identify specific sentences or phrases that sound generic, repetitive, clichéd, or likely AI-generated.

      Provide a JSON output with:
      - score: A number between 0 and 100 (100 = Highly Original, 0 = Generic/AI/Plagiarized).
      - feedback: An array of strings with general actionable advice.
      - issues: An array of objects (max 10), each containing:
         - "quote": The exact text segment (approx 5-15 words) from the input that is problematic.
         - "comment": Brief explanation of the issue.
         - "type": One of "cliche", "repetition", "ai-pattern".
      
      Text to Analyze:
      ${text.substring(0, 30000)}
    `;

    try {
        const ai = getAiClient();
        const response = await runWithRetry(async () => {
            return await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            score: { type: Type.NUMBER, description: "Originality score from 0 to 100" },
                            feedback: { 
                                type: Type.ARRAY, 
                                items: { type: Type.STRING },
                                description: "List of actionable improvements" 
                            },
                            issues: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        quote: { type: Type.STRING },
                                        comment: { type: Type.STRING },
                                        type: { 
                                            type: Type.STRING, 
                                            enum: ["cliche", "repetition", "ai-pattern"] 
                                        }
                                    }
                                }
                            }
                        },
                        required: ["score", "feedback", "issues"]
                    }
                }
            });
        });

        const result = JSON.parse(response.text || '{}');
        return {
            score: result.score || 0,
            feedback: result.feedback || ["Could not analyze text."],
            issues: result.issues || []
        };
    } catch (error) {
        console.error("Plagiarism Check Error:", error);
        return { score: 0, feedback: ["Error checking plagiarism. Please try again."], issues: [] };
    }
};