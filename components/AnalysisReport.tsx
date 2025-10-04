
import React from 'react';
import { AnalysisResult, DetectedError, PerformanceSuggestion, BestPractice } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { BugIcon } from './icons/BugIcon';
import { BoltIcon } from './icons/BoltIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';

const severityColorMap = {
    'Critical': 'bg-red-800 border-red-600',
    'High': 'bg-orange-800 border-orange-600',
    'Medium': 'bg-yellow-800 border-yellow-600',
    'Low': 'bg-blue-800 border-blue-600',
};

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-gray-800/50 rounded-lg p-6 mb-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-cyan-400 flex items-center gap-3 mb-4">
            {icon}
            {title}
        </h3>
        <div className="space-y-4 text-gray-300">{children}</div>
    </div>
);


export const AnalysisReport: React.FC<{ report: AnalysisResult }> = ({ report }) => {
    return (
        <div className="animate-fade-in">
            <Section title="Overall Summary" icon={<ClipboardIcon className="w-6 h-6" />}>
                <p className="text-lg">{report.overallSummary}</p>
            </Section>

            <Section title="Code Structure Review" icon={<BookOpenIcon className="w-6 h-6" />}>
                <p>{report.codeStructureReview}</p>
            </Section>

            <Section title="Error Detection" icon={<BugIcon className="w-6 h-6" />}>
                {report.errorDetection.length > 0 ? (
                    report.errorDetection.map((error, index) => (
                        <div key={index} className={`p-4 rounded-md border ${severityColorMap[error.severity] || 'bg-gray-700 border-gray-600'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-mono text-sm text-cyan-300">{error.file}{error.line ? `:${error.line}` : ''}</p>
                                    <p className="font-semibold mt-1">{error.description}</p>
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${severityColorMap[error.severity]}`}>{error.severity}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-400">No significant errors were detected.</p>
                )}
            </Section>

            <Section title="Performance Suggestions" icon={<BoltIcon className="w-6 h-6" />}>
                {report.performanceSuggestions.length > 0 ? (
                    report.performanceSuggestions.map((suggestion, index) => (
                        <div key={index} className="p-4 rounded-md bg-gray-700/50 border border-gray-600">
                            <p className="font-mono text-sm text-cyan-300">{suggestion.file}</p>
                            <p className="font-semibold mt-1">{suggestion.suggestion}</p>
                            <p className="text-sm text-gray-400 mt-1">{suggestion.rationale}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-400">No specific performance suggestions found.</p>
                )}
            </Section>

            <Section title="Best Practices" icon={<CheckCircleIcon className="w-6 h-6" />}>
                {report.bestPractices.length > 0 ? (
                    report.bestPractices.map((practice, index) => (
                        <div key={index} className="p-4 rounded-md bg-gray-700/50 border border-gray-600">
                             <p className="font-bold text-cyan-300">{practice.area}</p>
                             <p className="mt-1">{practice.recommendation}</p>
                        </div>
                    ))
                ) : (
                     <p className="text-gray-400">Code aligns well with common best practices.</p>
                )}
            </Section>
        </div>
    );
};
