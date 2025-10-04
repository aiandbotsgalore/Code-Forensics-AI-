
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { AnalysisReport } from './components/AnalysisReport';
import { Loader } from './components/Loader';
import { analyzeCode, startChat, Chat, generateFixedCode } from './services/geminiService';
import { extractFilesFromZip } from './services/zipService';
import { AnalysisResult, ExtractedFile, ChatMessage } from './types';
import { CodeIcon } from './components/icons/CodeIcon';
import { ChatInterface } from './components/ChatInterface';
import { CodeFixer } from './components/CodeFixer';
import { AnalysisConfig } from './components/AnalysisConfig';

const App: React.FC = () => {
    const [zipFile, setZipFile] = useState<File | null>(null);
    const [issueDescription, setIssueDescription] = useState<string>('');
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [extractedFiles, setExtractedFiles] = useState<ExtractedFile[]>([]);
    const [analysisTypes, setAnalysisTypes] = useState<string[]>([
        'errorDetection', 'performanceSuggestions', 'bestPractices', 'codeStructureReview'
    ]);

    // State for code fixing functionality
    const [isFixing, setIsFixing] = useState<boolean>(false);
    const [fixedFiles, setFixedFiles] = useState<ExtractedFile[] | null>(null);
    const [fixError, setFixError] = useState<string | null>(null);

    // State for chat functionality
    const [chat, setChat] = useState<Chat | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isChatting, setIsChatting] = useState<boolean>(false);
    const [chatError, setChatError] = useState<string | null>(null);

    const resetState = useCallback(() => {
        setAnalysisResult(null);
        setError(null);
        setExtractedFiles([]);
        // Reset chat state
        setChat(null);
        setChatHistory([]);
        setChatError(null);
        // Reset fixer state
        setIsFixing(false);
        setFixedFiles(null);
        setFixError(null);
    }, []);

    const handleFileSelect = useCallback((file: File | null) => {
        setZipFile(file);
        resetState();
    }, [resetState]);

    const handleAnalysisTypeChange = (type: string) => {
        setAnalysisTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const handleAnalyzeClick = async () => {
        if (!zipFile) {
            setError('Please select a zip file first.');
            return;
        }
        if (analysisTypes.length === 0) {
            setError('Please select at least one analysis type.');
            return;
        }

        setIsLoading(true);
        resetState();

        try {
            const files: ExtractedFile[] = await extractFilesFromZip(zipFile);
            if (files.length === 0) {
                throw new Error("The zip file is empty or contains no readable text files.");
            }
            setExtractedFiles(files);
            const result: AnalysisResult = await analyzeCode(files, issueDescription, analysisTypes);
            setAnalysisResult(result);
            
            // Initialize chat with file context after successful analysis
            const chatSession = startChat(files, issueDescription);
            setChat(chatSession);
            setChatHistory([{ role: 'model', content: "I have reviewed the code based on your selections. I'm ready to help. What would you like to discuss?" }]);

        } catch (err: any)
        {
            console.error(err);
            setError(err.message || 'An unknown error occurred during analysis.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateFixes = async () => {
        if (!analysisResult || extractedFiles.length === 0) return;

        setIsFixing(true);
        setFixedFiles(null);
        setFixError(null);

        try {
            // generateFixedCode now returns only the files that have been modified.
            const fixedResult = await generateFixedCode(extractedFiles, analysisResult);
            
            // We no longer merge with the original fileset. The zip will contain only the changed files.
            setFixedFiles(fixedResult);
        } catch (err: any) {
            console.error("Code fixing error:", err);
            setFixError(err.message || 'An unknown error occurred while generating fixes.');
        } finally {
            setIsFixing(false);
        }
    };

    const handleSendMessage = async (message: string) => {
        if (!chat || !message.trim()) return;

        setIsChatting(true);
        setChatError(null);
        
        const userMessage: ChatMessage = { role: 'user', content: message };
        setChatHistory(prev => [...prev, userMessage]);

        try {
            const stream = await chat.sendMessageStream({ message });
            
            // Add a placeholder for the model's response before streaming begins
            setChatHistory(prev => [...prev, { role: 'model', content: '' }]);

            for await (const chunk of stream) {
                const chunkText = chunk.text;
                setChatHistory(prev => {
                    const lastIndex = prev.length - 1;
                    // Use .map for a declarative, immutable update of the last message
                    return prev.map((msg, index) =>
                        index === lastIndex
                            ? { ...msg, content: msg.content + chunkText }
                            : msg
                    );
                });
            }
        } catch (err: any) {
            console.error("Chat error:", err);
            const errorMessage = err.message || "An error occurred while chatting.";
            setChatError(errorMessage);
            setChatHistory(prevHistory => [...prevHistory, { role: 'model', content: `Sorry, I ran into an error: ${errorMessage}` }]);
        } finally {
            setIsChatting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
            <Header />
            <main className="w-full max-w-4xl mt-8">
                <div className="bg-gray-800/50 rounded-xl shadow-2xl p-6 border border-gray-700 backdrop-blur-sm">
                    <h2 className="text-xl font-semibold text-cyan-400 mb-4">Upload Project ZIP File</h2>
                    <FileUpload onFileSelect={handleFileSelect} disabled={isLoading} />
                    
                    <div className="mt-6">
                        <label htmlFor="issue-description" className="block text-sm font-medium text-gray-300 mb-2">
                            Describe the issue you're facing (optional)
                        </label>
                        <textarea
                            id="issue-description"
                            name="issue-description"
                            rows={3}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition disabled:opacity-50"
                            placeholder="e.g., 'The login page is not authenticating users correctly.' or 'There's a memory leak when loading large datasets.'"
                            value={issueDescription}
                            onChange={(e) => setIssueDescription(e.target.value)}
                            disabled={isLoading}
                            aria-label="Issue description"
                        />
                    </div>

                    <AnalysisConfig
                        selectedTypes={analysisTypes}
                        onChange={handleAnalysisTypeChange}
                        disabled={isLoading}
                    />
                    
                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={handleAnalyzeClick}
                            disabled={!zipFile || isLoading || analysisTypes.length === 0}
                            className="px-8 py-3 bg-cyan-500 text-white font-bold rounded-lg hover:bg-cyan-600 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading ? 'Analyzing...' : 'Analyze Code'}
                        </button>
                    </div>
                </div>

                <div className="mt-8">
                    {isLoading && <Loader />}
                    {error && (
                        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    
                    {!analysisResult && !isLoading && !error && (
                        <div className="text-center text-gray-500 mt-12 flex flex-col items-center">
                            <CodeIcon className="w-16 h-16 mb-4"/>
                            <h3 className="text-xl font-semibold">Ready to Analyze</h3>
                            <p>Upload your project's zip file to begin the forensic analysis.</p>
                        </div>
                    )}

                    {analysisResult && (
                       <div className="space-y-8">
                            <AnalysisReport report={analysisResult} />
                            
                            <CodeFixer
                                onGenerateFixes={handleGenerateFixes}
                                isFixing={isFixing}
                                fixedFiles={fixedFiles}
                                fixError={fixError}
                                originalFileName={zipFile?.name}
                            />

                            {chat && (
                                <ChatInterface
                                    onSendMessage={handleSendMessage}
                                    history={chatHistory}
                                    isLoading={isChatting}
                                    error={chatError}
                                />
                            )}
                       </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default App;
