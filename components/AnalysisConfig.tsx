
import React from 'react';

interface AnalysisConfigProps {
    selectedTypes: string[];
    onChange: (type: string) => void;
    disabled: boolean;
}

const analysisOptions = [
    { id: 'errorDetection', label: 'Error Detection' },
    { id: 'performanceSuggestions', label: 'Performance' },
    { id: 'bestPractices', label: 'Best Practices' },
    { id: 'codeStructureReview', label: 'Code Structure' },
];

export const AnalysisConfig: React.FC<AnalysisConfigProps> = ({ selectedTypes, onChange, disabled }) => {
    return (
        <div className="mt-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
                Select Analysis Focus
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {analysisOptions.map(option => (
                    <div key={option.id}>
                        <input
                            type="checkbox"
                            id={option.id}
                            name={option.id}
                            checked={selectedTypes.includes(option.id)}
                            onChange={() => onChange(option.id)}
                            disabled={disabled}
                            className="sr-only peer"
                        />
                        <label
                            htmlFor={option.id}
                            className={`
                                block w-full text-center px-4 py-3 rounded-lg border
                                transition-all duration-200
                                ${disabled 
                                    ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed' 
                                    : 'cursor-pointer bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-cyan-500 peer-checked:bg-cyan-800/50 peer-checked:border-cyan-500 peer-checked:text-cyan-300 peer-checked:font-semibold'
                                }
                            `}
                        >
                            {option.label}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
};
