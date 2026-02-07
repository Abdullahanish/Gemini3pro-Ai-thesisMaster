export interface StudentInfo {
  topic: string;
  studentName: string;
  rollNumber: string;
  ects: string;
  degree: string;
  department: string;
  university: string;
  supervisor: string;
  submissionYear: string;
  targetPages?: string; // New field for requested page count
  groupMembers?: string;
  abstract?: string;
  referenceFile?: string; // Base64 string of uploaded PDF
}

export interface PlagiarismIssue {
  quote: string;
  comment: string;
  type: 'cliche' | 'repetition' | 'ai-pattern' | 'general';
}

export interface PlagiarismResult {
  score: number;
  feedback: string[];
  issues: PlagiarismIssue[];
}

export interface ThesisSection {
  id: string;
  title: string;
  content: string;
  isGenerated: boolean;
  isLoading: boolean;
  promptContext: string;
  plagiarismResult?: PlagiarismResult;
  isCheckingPlagiarism?: boolean;
}

export interface QAPair {
  question: string;
  answer: string;
}

export type ThesisState = {
  info: StudentInfo;
  sections: ThesisSection[];
  logo: string | null; // Base64 or URL
  qaList: QAPair[];
};

export const INITIAL_SECTIONS: ThesisSection[] = [
  {
    id: 'declaration',
    title: 'Declaration',
    content: '',
    isGenerated: false,
    isLoading: false,
    promptContext: 'Write a formal Declaration statement where the student declares the work is original and has not been submitted elsewhere. Include placeholders for signature and date.'
  },
  {
    id: 'certificate',
    title: 'Certificate of Approval',
    content: '',
    isGenerated: false,
    isLoading: false,
    promptContext: 'Write a Certificate/Approval page text to be signed by the supervisor and department head. Include lines for signatures.'
  },
  {
    id: 'acknowledgements',
    title: 'Acknowledgements',
    content: '',
    isGenerated: false,
    isLoading: false,
    promptContext: 'Write a formal Acknowledgements section thanking the supervisor, university, family, and God (if appropriate for context).'
  },
  {
    id: 'abstract',
    title: 'Abstract',
    content: '',
    isGenerated: false,
    isLoading: false,
    promptContext: 'Write a comprehensive abstract (200-300 words) summarizing the problem, method, sample, tools, key findings, and conclusion.'
  },
  {
    id: 'chapter1',
    title: 'Chapter 1: Introduction',
    content: '',
    isGenerated: false,
    isLoading: false,
    promptContext: 'Write Chapter 1 (Introduction). Include: Background of the study, Statement of the problem, Research objectives, Research questions/hypotheses, Significance of the study, Scope and delimitations, and Operational definitions of key terms.'
  },
  {
    id: 'chapter2',
    title: 'Chapter 2: Literature Review',
    content: '',
    isGenerated: false,
    isLoading: false,
    promptContext: 'Write Chapter 2 (Literature Review). Include: Theoretical framework, Review of relevant national & international studies, Critical analysis of past research, Research gap, and Conceptual framework description. Ensure in-text citations are plentiful.'
  },
  {
    id: 'chapter3',
    title: 'Chapter 3: Research Methodology',
    content: '',
    isGenerated: false,
    isLoading: false,
    promptContext: 'Write Chapter 3 (Research Methodology). Include: Research design (quantitative/qualitative/mixed), Population, Sample size & sampling technique, Research instruments/tools, Validity & reliability, Data collection procedure, Ethical considerations, and Data analysis techniques.'
  },
  {
    id: 'chapter4',
    title: 'Chapter 4: Data Analysis & Results',
    content: '',
    isGenerated: false,
    isLoading: false,
    promptContext: 'Write Chapter 4 (Data Analysis & Results). Include detailed descriptive statistics, Inferential statistics (mention specific tests used), interpretation of results (objective-wise or hypothesis-wise). Note: Invent realistic data/tables description to support the thesis topic.'
  },
  {
    id: 'chapter5',
    title: 'Chapter 5: Discussion',
    content: '',
    isGenerated: false,
    isLoading: false,
    promptContext: 'Write Chapter 5 (Discussion). Discuss findings in depth, comparison with previous studies, and explanation of results in theoretical context.'
  },
  {
    id: 'chapter6',
    title: 'Chapter 6: Conclusion & Recommendations',
    content: '',
    isGenerated: false,
    isLoading: false,
    promptContext: 'Write Chapter 6. Include: Summary of findings, Conclusions, Practical recommendations, Limitations of the study, and Suggestions for future research.'
  },
  {
    id: 'references',
    title: 'References',
    content: '',
    isGenerated: false,
    isLoading: false,
    promptContext: 'Generate a comprehensive list of realistic academic references in APA 7th edition style relevant to the topic. Ensure at least 15-20 citations.'
  },
  {
    id: 'appendices',
    title: 'Appendices',
    content: '',
    isGenerated: false,
    isLoading: false,
    promptContext: 'Create Appendices content including: A draft Questionnaire/Survey form used, Consent form text, and any permission letters templates.'
  }
];