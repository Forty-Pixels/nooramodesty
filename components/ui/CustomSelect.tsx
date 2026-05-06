"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";

interface Option {
    name: string;
    code: string;
}

interface CustomSelectProps {
    options: Option[];
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    label?: string;
    className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
    options,
    placeholder,
    value,
    onChange,
    label,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(opt => opt.code === value);

    const filteredOptions = options.filter(opt =>
        opt.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-white border ${isOpen ? "border-black/20" : "border-black/5"} px-5 py-4 flex items-center justify-between cursor-pointer transition-all duration-300 hover:border-black/20`}
            >
                <div className="flex flex-col gap-0.5">
                    {label && selectedOption && (
                        <span className="text-[8px] uppercase tracking-widest text-gray-400 font-bold leading-none">
                            {label}
                        </span>
                    )}
                    <span className={`text-xs font-medium ${!selectedOption ? "text-gray-300" : "text-black"}`}>
                        {selectedOption ? selectedOption.name : placeholder}
                    </span>
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
            </div>

            {isOpen && (
                <div className="absolute z-50 top-full left-0 w-full mt-1 bg-white border border-black/10 shadow-2xl shadow-black/5 animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden">
                    <div className="p-3 border-b border-black/5 flex items-center gap-2 bg-[#fcfcfc]">
                        <Search size={12} className="text-gray-400" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search..."
                            className="w-full bg-transparent text-[11px] font-medium focus:outline-none placeholder:text-gray-300 text-black"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="p-1 hover:bg-black/5 rounded-full transition-colors">
                                <X size={10} className="text-gray-400" />
                            </button>
                        )}
                    </div>
                    <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.code}
                                    onClick={() => {
                                        onChange(option.code);
                                        setIsOpen(false);
                                        setSearchQuery("");
                                    }}
                                    className={`px-5 py-3.5 text-[11px] font-medium uppercase tracking-wider cursor-pointer transition-colors flex items-center justify-between group
                                        ${value === option.code ? "bg-black text-white" : "text-gray-600 hover:bg-[#f6f5f3] hover:text-black"}
                                    `}
                                >
                                    <span>{option.name}</span>
                                    {value === option.code && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                            ))
                        ) : (
                            <div className="px-5 py-8 text-[10px] text-gray-400 uppercase tracking-widest text-center italic">
                                No matches found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
