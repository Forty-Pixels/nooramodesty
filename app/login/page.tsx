"use client";

import React, { useState } from "react";
import { ArrowRight, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [showPassword, setShowPassword] = useState(false);

    const toggleMode = () => {
        setMode(mode === "login" ? "register" : "login");
    };

    return (
        <div className="min-h-screen bg-[#f6f5f3] flex flex-col items-center justify-center px-6 py-20">
            <div className="w-full max-w-[400px] space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {/* Header */}
                <div className="text-center space-y-3">
                    <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-[0.3em] text-black">
                        {mode === "login" ? "Login" : "Join Us"}
                    </h1>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
                        {mode === "login" 
                            ? "Enter your details to access your account" 
                            : "Create an account for a faster checkout experience"}
                    </p>
                </div>

                {/* Form */}
                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                    {mode === "register" && (
                        <div className="space-y-1.5">
                            <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-gray-400 pl-1">
                                Full Name
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-black transition-colors">
                                    <User size={16} strokeWidth={1.5} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Jane Doe"
                                    className="w-full bg-white border border-black/5 px-12 py-4 text-xs font-medium text-black focus:outline-none focus:border-black/20 transition-all placeholder:text-gray-400"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-gray-400 pl-1">
                            Email Address
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-black transition-colors">
                                <Mail size={16} strokeWidth={1.5} />
                            </div>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                className="w-full bg-white border border-black/5 px-12 py-4 text-xs font-medium text-black focus:outline-none focus:border-black/20 transition-all placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center pr-1">
                            <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-gray-400 pl-1">
                                Password
                            </label>
                            {mode === "login" && (
                                <Link href="#" className="text-[9px] uppercase tracking-[0.1em] font-bold text-[#8B8378] hover:opacity-70">
                                    Forgot?
                                </Link>
                            )}
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-black transition-colors">
                                <Lock size={16} strokeWidth={1.5} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="w-full bg-white border border-black/5 px-12 py-4 text-xs font-medium text-black tracking-widest focus:outline-none focus:border-black/20 transition-all placeholder:text-gray-400"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-black transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                            </button>
                        </div>
                    </div>

                    <button className="group w-full bg-black text-white py-5 text-[10px] font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all active:scale-[0.98]">
                        {mode === "login" ? "Sign In" : "Create Account"}
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                {/* Footer Toggle */}
                <div className="pt-6 text-center border-t border-black/5">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-gray-400 font-medium">
                        {mode === "login" ? "Don't have an account?" : "Already have an account?"}
                        <button 
                            onClick={toggleMode}
                            className="ml-2 text-black font-bold hover:underline underline-offset-4"
                        >
                            {mode === "login" ? "JOIN NOW" : "LOGIN"}
                        </button>
                    </p>
                </div>

                {/* Social Sign In */}
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="h-[1px] grow bg-black/5"></div>
                        <span className="text-[8px] uppercase tracking-[0.3em] text-gray-300 font-bold">Or continue with</span>
                        <div className="h-[1px] grow bg-black/5"></div>
                    </div>
                    <div className="w-full">
                        <button className="w-full flex items-center justify-center gap-3 py-4 px-6 border border-black/5 bg-white hover:bg-gray-50 transition-colors group">
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                                <path fill="none" d="M1 1 23 23" />
                            </svg>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-black">Sign in with Google</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
