import React from "react";

export default function AccountPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
            <h1 className="text-3xl md:text-4xl font-light uppercase tracking-widest mb-4">
                My Account
            </h1>
            <p className="text-gray-500 max-w-md uppercase text-xs tracking-[0.2em]">
                Sign in to manage your orders and profile.
            </p>
        </div>
    );
}
