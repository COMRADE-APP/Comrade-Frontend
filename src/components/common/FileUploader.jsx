import React, { useRef, useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';

const FileUploader = ({ onFileSelect, accept = '*', maxSize = 10 * 1024 * 1024, multiple = false }) => {
    const inputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [error, setError] = useState(null);

    const handleFiles = (fileList) => {
        setError(null);
        const files = Array.from(fileList);
        const oversized = files.filter(f => f.size > maxSize);
        if (oversized.length > 0) {
            setError(`Some files exceed the ${Math.round(maxSize / 1024 / 1024)}MB limit.`);
            return;
        }
        setSelectedFiles(files);
        if (onFileSelect) onFileSelect(files);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
    };

    const removeFile = (index) => {
        const updated = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(updated);
        if (onFileSelect) onFileSelect(updated);
    };

    return (
        <div>
            <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                    ${dragOver ? 'border-green-500 bg-green-50/10' : 'border-theme hover:border-green-400'}
                `}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
            >
                <Upload className="w-10 h-10 text-secondary mx-auto mb-3" />
                <p className="text-primary font-medium">
                    {dragOver ? 'Drop files here' : 'Click or drag files to upload'}
                </p>
                <p className="text-xs text-secondary mt-1">
                    {accept !== '*' ? `Accepted: ${accept}` : 'All file types'} · Max {Math.round(maxSize / 1024 / 1024)}MB
                </p>
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                />
            </div>

            {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
            )}

            {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                    {selectedFiles.map((file, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-elevated rounded-lg border border-theme">
                            <div className="flex items-center gap-3 min-w-0">
                                <FileText className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-primary truncate">{file.name}</p>
                                    <p className="text-xs text-secondary">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                                className="p-1 hover:bg-red-100/20 rounded text-red-400 hover:text-red-500 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileUploader;
