
export interface ExtractedFile {
    name: string;
    content: string;
}

export interface DetectedError {
    file: string;
    line: number;
    description: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
}

export interface PerformanceSuggestion {
    file: string;
    suggestion: string;
    rationale: string;
}

export interface BestPractice {
    area: string;
    recommendation: string;
}

export interface AnalysisResult {
    overallSummary: string;
    codeStructureReview: string;
    errorDetection: DetectedError[];
    performanceSuggestions: PerformanceSuggestion[];
    bestPractices: BestPractice[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
