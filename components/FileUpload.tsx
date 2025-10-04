
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { ZipIcon } from './icons/ZipIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface FileUploadProps {
    onFileSelect: (file: File | null) => void;
    disabled: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
    const [fileName, setFileName] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const handleFileChange = (files: FileList | null) => {
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type === "application/zip" || file.type === "application/x-zip-compressed") {
                setFileName(file.name);
                onFileSelect(file);
            } else {
                alert("Please upload a valid .zip file.");
                onFileSelect(null);
                setFileName(null);
            }
        }
    };

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(true);
    }, [disabled]);
    
    const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (!disabled) {
            handleFileChange(e.dataTransfer.files);
        }
    }, [disabled]);

    const handleClearFile = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        e.preventDefault();
        setFileName(null);
        onFileSelect(null);
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    return (
        <label
            htmlFor="file-upload"
            className={`relative block w-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-300 ${isDragging ? 'border-cyan-400 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept=".zip,application/zip,application/x-zip-compressed"
                onChange={(e) => handleFileChange(e.target.files)}
                disabled={disabled}
            />
            {fileName ? (
                <div className="flex items-center justify-center flex-col">
                    <ZipIcon className="w-12 h-12 text-cyan-400 mb-2" />
                    <p className="font-semibold text-white">{fileName}</p>
                    <p className="text-sm text-gray-400">File selected</p>
                    <button onClick={handleClearFile} className="mt-4 text-sm text-red-400 hover:text-red-300 flex items-center gap-1">
                        <XCircleIcon className="w-4 h-4" />
                        Remove file
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center">
                    <UploadIcon className="w-12 h-12 text-gray-500 mb-2" />
                    <span className="font-semibold text-cyan-400">Click to upload</span>
                    <span className="text-gray-400"> or drag and drop</span>
                    <p className="text-xs text-gray-500 mt-2">ZIP file only</p>
                </div>
            )}
        </label>
    );
};
