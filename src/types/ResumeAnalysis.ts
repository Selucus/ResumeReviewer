export interface ResumeAnalysis {
  formatting: string[];
  clarity: string[];
  grammar: string[];
  jobFit: {
    score: number;
    missingKeywords: string[];
  } | null;
  suggestions: string[];
} 