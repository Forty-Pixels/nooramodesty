"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { uniqueMessages, validateEmail, validateFiles, validateRequiredText } from "@/utils/formValidation";

interface SuggestionFile {
    file: File;
    previewUrl: string;
}

type SuggestionType = "general" | "design";

const MAX_SUGGESTION_FILES = 5;
const MAX_SUGGESTION_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_SUGGESTION_FILE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export default function SuggestionsPage() {
    const [suggestionType, setSuggestionType] = useState<SuggestionType>("general");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [suggestionFiles, setSuggestionFiles] = useState<SuggestionFile[]>([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragActive, setIsDragActive] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragActive(true);
        } else if (e.type === "dragleave") {
            setIsDragActive(false);
        }
    };

    const processFiles = (uploadedFiles: FileList) => {
        const incomingFiles = Array.from(uploadedFiles);
        const validationErrors = validateFiles([...suggestionFiles.map((item) => item.file), ...incomingFiles], {
            allowedTypes: ALLOWED_SUGGESTION_FILE_TYPES,
            maxSizeBytes: MAX_SUGGESTION_FILE_SIZE,
            maxFiles: MAX_SUGGESTION_FILES,
            label: "Upload",
        });

        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }

        const newFiles = incomingFiles.map((file) => ({
            file,
            previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
        }));
        setErrors([]);
        setSuggestionFiles((prev) => [...prev, ...newFiles]);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFiles(e.dataTransfer.files);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFiles(e.target.files);
        }
    };

    const removeFile = (index: number) => {
        setSuggestionFiles((prev) => {
            const copy = [...prev];
            if (copy[index].previewUrl) {
                URL.revokeObjectURL(copy[index].previewUrl);
            }
            copy.splice(index, 1);
            return copy;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = uniqueMessages([
            ...validateRequiredText(name, "Full name", { minLength: 2, maxLength: 80 }),
            ...validateEmail(email),
            ...validateRequiredText(title, suggestionType === "design" ? "Concept title" : "Feedback subject", { minLength: 3, maxLength: 120 }),
            ...validateRequiredText(description, suggestionType === "design" ? "Inspiration and details" : "Suggestion", { minLength: 10, maxLength: 1000 }),
            ...(suggestionType === "design" ? validateFiles(suggestionFiles.map((item) => item.file), {
                allowedTypes: ALLOWED_SUGGESTION_FILE_TYPES,
                maxSizeBytes: MAX_SUGGESTION_FILE_SIZE,
                maxFiles: MAX_SUGGESTION_FILES,
                label: "Upload",
            }) : []),
        ]);

        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }

        setErrors([]);
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setIsSubmitted(true);
        }, 2000);
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
                <div className="max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                        <Check size={40} className="text-white" />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-3xl font-bold uppercase tracking-[0.2em] text-black">
                            Suggestion Sent
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold leading-relaxed">
                            {suggestionType === "design"
                                ? "Thank you for sharing your creative concepts! Our design team will review your suggestions and sketches for our upcoming collection."
                                : "Thank you for your feedback! We truly appreciate your ideas and will use them to improve the Noora Modesty experience."}
                        </p>
                    </div>
                    <div className="pt-8">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-3 bg-black text-white px-12 py-4 text-[10px] tracking-[0.4em] font-bold uppercase hover:bg-zinc-800 transition-all active:scale-95"
                        >
                            Return to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#f6f5f3] pt-24 md:pt-32 pb-20 px-4 md:px-6">
            <div className="max-w-2xl mx-auto bg-white p-6 md:p-16 shadow-sm">
                <div className="mb-12 text-center md:text-left">
                    <h1 className="text-2xl md:text-4xl font-bold uppercase tracking-[0.15em] md:tracking-[0.25em] text-black mb-4 leading-tight">
                        Suggestions & <br className="md:hidden" /> Feedback
                    </h1>
                    <p className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">
                        Please select a suggestion type to share your ideas with us
                    </p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-8 md:space-y-10">
                    {/* Suggestion Type Toggle */}
                    <div className="space-y-4">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Suggestion Type</label>
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            {(["general", "design"] as const).map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => {
                                        setSuggestionType(type);
                                        // Reset files and title/description when switching
                                        setTitle("");
                                        setDescription("");
                                        suggestionFiles.forEach((item) => {
                                            if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
                                        });
                                        setSuggestionFiles([]);
                                        setErrors([]);
                                    }}
                                    className={`py-3.5 md:py-4 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] border transition-all ${
                                        suggestionType === type 
                                            ? "bg-black text-white border-black" 
                                            : "bg-white text-gray-600 border-black/10 hover:border-black/30"
                                    }`}
                                >
                                    {type === "general" ? "General / Normal" : "Design Specific"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        {/* Name */}
                        <div className="space-y-2">
                            <label id="label-name" className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Full Name</label>
                            <input 
                                required
                                id="input-name"
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-transparent border-b border-black/20 focus:border-black outline-none py-2 text-sm transition-colors text-black placeholder:text-gray-400"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label id="label-email" className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Email Address</label>
                            <input 
                                required
                                id="input-email"
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-transparent border-b border-black/20 focus:border-black outline-none py-2 text-sm transition-colors text-black placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <label id="label-title" className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
                            {suggestionType === "design" ? "Concept / Style Title" : "Feedback Subject"}
                        </label>
                        <input 
                            required
                            id="input-title"
                            type="text" 
                            placeholder={
                                suggestionType === "design" 
                                    ? "e.g. Linen Abaya with Flared Cuffs" 
                                    : "e.g. Website Checkout Feedback, Gift wrap options..."
                            }
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-transparent border-b border-black/20 focus:border-black outline-none py-2 text-sm transition-colors text-black placeholder:text-gray-400"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label id="label-description" className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
                            {suggestionType === "design" ? "Inspiration & Details" : "Your Suggestions"}
                        </label>
                        <textarea 
                            required
                            id="input-description"
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-transparent border border-black/10 focus:border-black outline-none p-4 text-sm transition-colors resize-none text-black placeholder:text-gray-400"
                            placeholder={
                                suggestionType === "design"
                                    ? "Tell us about the design details, sleeve cuts, fabrics, colors, or general styling details..."
                                    : "Describe your ideas, suggestions or feedback for us in detail..."
                            }
                        />
                    </div>

                    {/* Drag and Drop File Upload - Only show if Design Specific */}
                    {suggestionType === "design" && (
                        <div className="space-y-4">
                            <label id="label-upload" className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Sketches & Reference Images (Optional)</label>
                            
                            <div 
                                onDragEnter={handleDrag}
                                onDragOver={handleDrag}
                                onDragLeave={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`w-full py-10 px-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 ${
                                    isDragActive 
                                        ? "border-black bg-black/5" 
                                        : "border-black/20 hover:border-black/40 hover:bg-[#f6f5f3]/50"
                                }`}
                            >
                                <input 
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*,application/pdf"
                                    onChange={handleFileInput}
                                    className="hidden"
                                />
                                
                                <div className="w-12 h-12 rounded-full bg-[#f6f5f3] flex items-center justify-center text-black/60 shadow-inner">
                                    <Upload size={20} />
                                </div>
                                
                                <div className="space-y-1">
                                    <p className="text-xs font-bold uppercase tracking-widest text-black">Drag & Drop Files Here</p>
                                    <p className="text-[9px] uppercase tracking-wider text-gray-400">or click to browse from device (JPEG, PNG, PDF)</p>
                                </div>
                            </div>

                            {/* Selected Files List */}
                            {suggestionFiles.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
                                    {suggestionFiles.map((sFile, index) => (
                                        <div key={index} className="relative border border-black/10 p-2 rounded flex flex-col items-center justify-center bg-gray-50 group">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeFile(index);
                                                }}
                                                className="absolute top-1 right-1 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                                            >
                                                <X size={12} />
                                            </button>
                                            
                                            {sFile.previewUrl ? (
                                                <div className="relative h-24 w-full overflow-hidden rounded">
                                                    <Image src={sFile.previewUrl} alt={sFile.file.name} fill unoptimized className="object-cover" sizes="160px" />
                                                </div>
                                            ) : (
                                                <div className="w-full h-24 bg-zinc-200 text-zinc-600 rounded flex flex-col items-center justify-center p-2 text-center">
                                                    <span className="text-[8px] font-bold uppercase tracking-wider truncate max-w-full">PDF File</span>
                                                </div>
                                            )}
                                            <span className="text-[8px] text-gray-500 font-medium truncate max-w-full mt-2 uppercase tracking-wide">
                                                {sFile.file.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}


                    {errors.length > 0 && (
                        <div className="border border-[#B21E1E]/20 bg-[#B21E1E]/5 px-4 py-3 text-sm font-bold text-[#B21E1E]" aria-live="polite">
                            {errors.length === 1 ? (
                                <p>{errors[0]}</p>
                            ) : (
                                <ul className="list-disc space-y-1 pl-5">
                                    {errors.map((error) => (
                                        <li key={error}>{error}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                    {/* Submit Button */}
                    <div className="pt-6">
                        <button
                            disabled={isProcessing}
                            id="btn-submit"
                            className={`w-full bg-black text-white py-5 md:py-6 text-[10px] tracking-[0.3em] md:tracking-[0.5em] font-bold uppercase transition-all flex items-center justify-center gap-4 ${
                                isProcessing ? "opacity-70 cursor-not-allowed" : "hover:bg-zinc-800 active:scale-[0.98]"
                            }`}
                        >
                            {isProcessing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Submit Suggestions
                                    <ArrowRight size={14} />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
