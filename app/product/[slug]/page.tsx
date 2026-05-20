import { products } from "@/data/products";
import { ProductGallery } from "@/components/ProductDetails/ProductGallery";
import { ProductInfo } from "@/components/ProductDetails/ProductInfo";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: PageProps) {
    const { slug } = await params;
    const allProducts = products;
    const product = allProducts.find((p) => p.slug === slug);

    if (!product) {
        notFound();
    }

    const relatedProducts = allProducts
        .filter((p) => p.category === product.category && p._id !== product._id)
        .slice(0, 4);

    return (
        <div className="bg-white min-h-screen font-sans">
            <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-6 md:py-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-10 items-start">
                    {/* Left: Gallery (6 columns) */}
                    <div className="lg:col-span-6 max-w-[760px]">
                        <ProductGallery images={product.images || [product.mainImage]} />
                    </div>

                    {/* Right: Info (6 columns) */}
                    <div className="lg:col-span-6 lg:pl-8">
                        <ProductInfo product={product} />
                    </div>
                </div>

                {/* Related Products Row (Bottom) */}
                <div className="mt-16 md:mt-24">
                    <h2 className="text-[0.65rem] md:text-[0.7rem] font-bold tracking-[0.4em] uppercase text-black mb-8">
                        You May Also Like
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
                        {relatedProducts.map((p) => (
                            <Link key={p._id} href={`/product/${p.slug}`} className="group space-y-3">
                                <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
                                    <Image
                                        src={p.mainImage}
                                        alt={p.title}
                                        fill
                                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-[10px] uppercase tracking-widest font-bold truncate text-black">{p.title}</h3>
                                    <div className="flex items-center gap-2">
                                        <p className={`text-[10px] font-bold ${p.salePrice ? "text-[#B21E1E]" : "text-black"}`}>
                                            LKR {(p.salePrice || p.price).toLocaleString()}
                                        </p>
                                        {p.salePrice && (
                                            <p className="text-[9px] text-gray-400 line-through">
                                                LKR {p.price.toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
