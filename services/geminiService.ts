
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { ExtractedFile, AnalysisResult } from '../types';

// This allows other files to use the Chat type from the SDK
export type { Chat };

// This is a placeholder for the actual API key which should be in environment variables.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const masterAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        overallSummary: {
            type: Type.STRING,
            description: "A high-level, 2-3 sentence summary of the overall code quality, structure, and potential based on the requested analysis types."
        },
        codeStructureReview: {
            type: Type.STRING,
            description: "A detailed analysis of the project's structure, architecture, and modularity. Comment on separation of concerns and maintainability."
        },
        errorDetection: {
            type: Type.ARRAY,
            description: "A list of identified bugs, logical errors, or potential runtime issues.",
            items: {
                type: Type.OBJECT,
                properties: {
                    file: { type: Type.STRING, description: "The full path of the file with the error." },
                    line: { type: Type.INTEGER, description: "The approximate line number of the error." },
                    description: { type: Type.STRING, description: "A clear description of the error and its potential impact." },
                    severity: { type: Type.STRING, description: "Severity of the error: Critical, High, Medium, or Low." }
                },
                 required: ["file", "description", "severity"]
            }
        },
        performanceSuggestions: {
            type: Type.ARRAY,
            description: "A list of suggestions to improve performance.",
            items: {
                type: Type.OBJECT,
                properties: {
                    file: { type: Type.STRING, description: "The file where the suggestion applies." },
                    suggestion: { type: Type.STRING, description: "The specific optimization suggestion." },
                    rationale: { type: Type.STRING, description: "Why this change would improve performance." }
                },
                required: ["file", "suggestion", "rationale"]
            }
        },
        bestPractices: {
            type: Type.ARRAY,
            description: "Recommendations for adhering to modern development best practices.",
            items: {
                type: Type.OBJECT,
                properties: {
                    area: { type: Type.STRING, description: "The area of best practice (e.g., 'Security', 'Readability', 'Accessibility')." },
                    recommendation: { type: Type.STRING, description: "The specific recommendation." }
                },
                 required: ["area", "recommendation"]
            }
        }
    },
    // overallSummary is always required, others are dynamic
    required: ["overallSummary"]
};

const fixedCodeSchema = {
    type: Type.OBJECT,
    properties: {
        files: {
            type: Type.ARRAY,
            description: "An array of files containing the complete, corrected code. Only include files that were modified.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "The full path of the file." },
                    content: { type: Type.STRING, description: "The complete and corrected content of the file." }
                },
                required: ["name", "content"]
            }
        }
    },
    required: ["files"]
};

/**
 * Normalizes code content for a more robust comparison, ignoring differences
 * in whitespace, line endings, and empty lines.
 * @param content The raw code string.
 * @returns A normalized string.
 */
const normalizeContent = (content: string): string => {
    if (!content) return '';
    return content
        .replace(/\r\n/g, '\n') // Normalize line endings to LF
        .split('\n')
        .map(line => line.trim()) // Trim leading/trailing whitespace from each line
        .filter(line => line.length > 0) // Remove empty lines
        .join('\n');
};

const formatFilesForPrompt = (files: ExtractedFile[]): string => {
    return files.map(file => 
        `
/* FILE: ${file.name} */
\`\`\`
${file.content}
\`\`\`
`
    ).join('\n---\n');
};

export const startChat = (files: ExtractedFile[], issueDescription: string): Chat => {
    const formattedCode = formatFilesForPrompt(files);
    const issueContext = issueDescription.trim()
        ? `The user's primary problem is: "${issueDescription.trim()}". Keep this in mind during the conversation.`
        : '';

    const initialSystemPrompt = `You are an expert software development assistant. The user has provided you with their project code. ${issueContext} Your task is to answer their questions about this code, help diagnose issues, and suggest improvements. You have already performed an initial analysis. Now, engage in a conversation to provide further assistance.

Here is the project code for context:
${formattedCode}
    `;

    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: [
            { role: 'user', parts: [{ text: initialSystemPrompt }] },
            { role: 'model', parts: [{ text: "Understood. I have received the project files and am ready to assist you with your questions about the code." }] }
        ]
    });
    return chat;
};


export const analyzeCode = async (files: ExtractedFile[], issueDescription: string, analysisTypes: string[]): Promise<AnalysisResult> => {
    const formattedCode = formatFilesForPrompt(files);
    
    const issueContext = issueDescription.trim() 
        ? `The user is specifically struggling with the following issue: "${issueDescription.trim()}" Please pay special attention to this problem in your analysis.`
        : 'The user has not provided a specific issue.';

    // Dynamically build the schema based on user selection
    const dynamicSchema: any = {
        type: Type.OBJECT,
        properties: {
            overallSummary: masterAnalysisSchema.properties.overallSummary
        },
        required: ['overallSummary']
    };

    const friendlyTypeNames: string[] = [];

    for (const type of analysisTypes) {
        if ((masterAnalysisSchema.properties as any)[type]) {
            dynamicSchema.properties[type] = (masterAnalysisSchema.properties as any)[type];
            dynamicSchema.required.push(type);
            // Convert camelCase to Title Case for the prompt
            const friendlyName = type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            friendlyTypeNames.push(friendlyName);
        }
    }
    
    const focusInstruction = `Your forensic review must focus exclusively on the following areas: **${friendlyTypeNames.join(', ')}**. Do not analyze any other aspects.`;

    const prompt = `
        Analyze the following project files for a comprehensive forensic review.
        ${focusInstruction}
        ${issueContext}
        - Provide an overall summary based on your focused analysis.
        Your response must be in JSON format conforming to the provided schema.

        Project Code:
        ${formattedCode}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: dynamicSchema,
            },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        return result as AnalysisResult;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to get analysis from the AI. The model may be unable to process the request.");
    }
};

export const generateFixedCode = async (files: ExtractedFile[], report: AnalysisResult): Promise<ExtractedFile[]> => {
    const formattedCode = formatFilesForPrompt(files);
    const reportString = JSON.stringify(report, null, 2);

    const prompt = `
        You are an expert software engineer tasked with fixing a codebase. You will be given the original project files and a forensic analysis report detailing errors, performance issues, and best practice violations. Your task is to rewrite the necessary files to apply all the suggested fixes.

        **Instructions:**
        1. Thoroughly review the analysis report and the provided code.
        2. Apply the fixes from the report directly into the code. This includes correcting bugs, implementing performance suggestions, and adhering to best practices.
        3. Return the **full, complete content** of every file that you modify.
        4. If a file does not require any changes based on the report, do **not** include it in your response.
        5. Your response must be a JSON object conforming to the provided schema, containing an array of the modified file objects.

        **Important:** Ensure your changes are strictly for the better. Do not introduce new bugs, break existing functionality, or make purely cosmetic changes (like re-indenting). Your goal is to improve the code's quality and correctness based *only* on the analysis report.

        **Analysis Report:**
        \`\`\`json
        ${reportString}
        \`\`\`

        **Original Project Code:**
        ${formattedCode}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: fixedCodeSchema,
            },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        const potentialFixes = result.files as ExtractedFile[];
        
        console.info(`[CodeFixer] AI returned ${potentialFixes.length} potentially modified files for validation.`);

        const originalFilesMap = new Map(files.map(f => [f.name, f.content]));
        const changedFiles: ExtractedFile[] = [];
        let skippedCount = 0;

        for (const fixedFile of potentialFixes) {
            const originalContent = originalFilesMap.get(fixedFile.name);

            if (originalContent === undefined) {
                 console.warn(`[CodeFixer] AI generated a new file '${fixedFile.name}' which was not in the original project. Skipping.`);
                 skippedCount++;
                 continue;
            }

            // Rigorous comparison: normalize both versions to ignore cosmetic differences.
            const isSubstantivelyChanged = normalizeContent(originalContent) !== normalizeContent(fixedFile.content);
            
            if (isSubstantivelyChanged) {
                console.info(`[CodeFixer] Substantive changes detected for ${fixedFile.name}. Including in result.`);
                changedFiles.push(fixedFile);
            } else {
                const reason = originalContent === fixedFile.content ? "content is identical" : "only formatting changes were detected";
                console.info(`[CodeFixer] No substantive changes for ${fixedFile.name} (${reason}). Skipping.`);
                skippedCount++;
            }
        }

        console.info(`[CodeFixer] Validation Summary -> Total Processed: ${potentialFixes.length}, Files Changed: ${changedFiles.length}, Files Skipped: ${skippedCount}`);

        return changedFiles;

    } catch (error) {
        console.error("Error calling Gemini API for code fixing:", error);
        throw new Error("Failed to generate fixes from the AI. The model may be unable to process the request.");
    }
};
