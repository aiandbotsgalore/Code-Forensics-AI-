
import React from 'react';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';

export const Header: React.FC = () => {
    return (
        <header className="text-center">
            <div className="flex justify-center items-center gap-4">
                <BrainCircuitIcon className="w-12 h-12 text-cyan-400"/>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
                    Code Forensics AI
                </h1>
            </div>
            <p className="mt-3 text-lg text-gray-400 max-w-2xl mx-auto">
                Upload your project, and our AI will perform a deep analysis to find bugs, suggest optimizations, and improve code quality.
            </p>
        </header>
    );
};
