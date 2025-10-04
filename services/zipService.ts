import { ExtractedFile } from '../types';

// JSZip is loaded from a CDN and available globally.
declare const JSZip: any;

const isTextFile = (filename: string): boolean => {
    const textExtensions = [
        '.txt', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.md', '.xml', '.yaml', '.yml', 
        '.py', '.java', '.c', '.cpp', '.h', '.cs', '.go', '.rs', '.php', '.rb', '.sh'
    ];
    return textExtensions.some(ext => filename.toLowerCase().endsWith(ext));
};

export const extractFilesFromZip = async (zipFile: File): Promise<ExtractedFile[]> => {
    if (typeof JSZip === 'undefined') {
        throw new Error('JSZip library is not loaded. Please check your internet connection.');
    }

    const zip = await JSZip.loadAsync(zipFile);
    const extractedFiles: ExtractedFile[] = [];
    const filePromises: Promise<void>[] = [];

    zip.forEach((relativePath: string, file: any) => {
        if (!file.dir && isTextFile(relativePath)) {
            const promise = file.async('string').then((content: string) => {
                extractedFiles.push({
                    name: relativePath,
                    content: content,
                });
            }).catch((err: Error) => {
                console.warn(`Could not read file ${relativePath}: ${err.message}`);
            });
            filePromises.push(promise);
        }
    });

    await Promise.all(filePromises);
    return extractedFiles;
};

export const createZipFromFiles = async (files: ExtractedFile[], zipName: string): Promise<void> => {
    if (typeof JSZip === 'undefined') {
        throw new Error('JSZip library is not loaded. Please check your internet connection.');
    }

    const zip = new JSZip();

    // If no files were changed, create a JSON summary instead of an empty archive.
    if (files.length === 0) {
        const summary = {
            status: "Completed",
            message: "AI analysis run successfully. No code modifications were required as the existing code aligns with the suggestions.",
            timestamp: new Date().toISOString(),
        };
        zip.file('summary.json', JSON.stringify(summary, null, 2));
        // Adjust zip name for clarity
        zipName = zipName.replace('fixed-', 'summary-').replace('.zip', '') + '.zip';
    } else {
        files.forEach(file => {
            zip.file(file.name, file.content);
        });
    }

    const link = document.createElement('a');

    try {
        const blob = await zip.generateAsync({ type: 'blob' });
        link.href = URL.createObjectURL(blob);
        link.download = zipName;
        document.body.appendChild(link);
        link.click();
    } catch (err) {
        console.error("Failed to create or download zip file:", err);
        throw new Error("Could not generate the zip file for download.");
    } finally {
        // This block executes regardless of whether an error occurred in the try block.
        // It's the safest place to perform cleanup to prevent memory leaks.
        if (link.parentElement) {
            document.body.removeChild(link);
        }
        if (link.href && link.href.startsWith('blob:')) {
            URL.revokeObjectURL(link.href);
        }
    }
};
