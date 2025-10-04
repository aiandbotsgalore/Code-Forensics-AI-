
import React from 'react';
import { ExtractedFile } from '../types';
import { createZipFromFiles } from '../services/zipService';
import { SparklesIcon } from './icons/SparklesIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface CodeFixerProps {
    onGenerateFixes: () => Promise<void>;
    isFixing: boolean;
    fixedFiles: ExtractedFile[] | null;
    fixError: string | null;
    originalFileName?: string;
}

export const CodeFixer: React.FC<CodeFixerProps> = ({ onGenerateFixes, isFixing, fixedFiles, fixError, originalFileName }) => {
    
    const handleDownload = () => {
        if (!fixedFiles) return;
        // The zip name is adjusted inside createZipFromFiles if no files were changed.
        const newFileName = originalFileName ? `fixed-${originalFileName}` : 'fixed-project.zip';
        createZipFromFiles(fixedFiles, newFileName);
    };

    return (
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 animate-fade-in">
            <h3 className="text-xl font-semibold text-cyan-400 flex items-center gap-3 mb-4">
                <SparklesIcon className="w-6 h-6" />
                AI Code Fixer
            </h3>
            
            {!fixedFiles && !isFixing && !fixError && (
                <>
                    <p className="text-gray-300 mb-4">
                        Ready to improve your code? Let the AI apply its suggestions and generate a fixed version of your project.
                    </p>
                    <button
                        onClick={onGenerateFixes}
                        className="px-6 py-2 bg-cyan-500 text-white font-bold rounded-lg hover:bg-cyan-600 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 transition-all duration-300 flex items-center gap-2"
                    >
                        <SparklesIcon className="w-5 h-5" />
                        Generate Fixed Codebase
                    </button>
                </>
            )}

            {isFixing && (
                <div className="flex items-center gap-4 text-gray-300">
                    <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                    <p>Applying fixes and generating new codebase...</p>
                </div>
            )}

            {fixError && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{fixError}</span>
                </div>
            )}

            {fixedFiles && (
                <div className="animate-fade-in">
                    {fixedFiles.length > 0 ? (
                         <>
                            <p className="text-green-300 mb-4 font-semibold">
                                Success! {fixedFiles.length} file(s) have been modified. Your archive of updated files is ready.
                            </p>
                            <button
                                onClick={handleDownload}
                                className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-500/50 transition-all duration-300 flex items-center gap-2"
                            >
                                <DownloadIcon className="w-5 h-5" />
                                Download Changed Files (.zip)
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="text-gray-300 mb-4">
                                Analysis complete. The AI found no necessary code changes. You can download a summary report.
                            </p>
                            <button
                                onClick={handleDownload}
                                className="px-6 py-2 bg-cyan-500 text-white font-bold rounded-lg hover:bg-cyan-600 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 transition-all duration-300 flex items-center gap-2"
                            >
                                <DownloadIcon className="w-5 h-5" />
                                Download Summary (.zip)
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
