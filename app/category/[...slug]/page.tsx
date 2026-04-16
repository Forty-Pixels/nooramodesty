import React from "react";

export default async function CategoryPage({
    params,
}: {
    params: Promise<{ slug: string[] }>;
}) {
    const { slug } = await params;
    const categoryName = slug[slug.length - 1].replace(/-/g, " ");

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
            <h1 className="text-3xl md:text-4xl font-light uppercase tracking-widest mb-4">
                {categoryName}
            </h1>
            <p className="text-gray-500 max-w-md uppercase text-xs tracking-[0.2em]">
                Explore our curated collection of {categoryName}. Products arriving soon.
            </p>
        </div>
    );
}
