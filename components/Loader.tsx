
import React from 'react';

export const Loader: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg text-gray-300">AI is analyzing your code...</p>
        </div>
    );
};
