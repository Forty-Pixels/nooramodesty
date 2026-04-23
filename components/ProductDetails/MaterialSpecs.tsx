import { MaterialSpecs as Specs } from "@/types/product";
import Image from "next/image";

interface MaterialSpecsProps {
    specs: Specs;
}

export const MaterialSpecs = ({ specs }: MaterialSpecsProps) => {
    return (
        <div className="bg-[#FBFBFB] p-8 md:p-12 mt-12 border border-gray-100">
            <div className="flex flex-col md:flex-row gap-12 items-center">
                {/* Macro Image */}
                <div className="relative w-full md:w-1/3 aspect-square overflow-hidden group">
                    <div className="absolute inset-0 z-10 bg-black/5 group-hover:bg-transparent transition-colors" />
                    <Image
                        src={specs.macroImage}
                        alt="Fabric texture macro shot"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] uppercase tracking-widest font-bold">
                        Fabric Texture
                    </div>
                </div>

                {/* Specs Content */}
                <div className="flex-1 space-y-8">
                    <div className="space-y-2">
                        <h3 className="text-xl font-medium tracking-tight">Technical Material Quality</h3>
                        <p className="text-sm text-gray-500">Exclusively sourced premium fabrics for maximum comfort and durability.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">Material Composition</span>
                            <p className="text-lg font-medium">{specs.composition}</p>
                        </div>
                        <div className="space-y-2">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">Technical Metric</span>
                            <p className="text-lg font-medium">{specs.gsm} GSM <span className="text-sm font-normal text-gray-400">(Grams per Square Meter)</span></p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-200">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">Physical Properties</span>
                        <div className="flex flex-wrap gap-3">
                            {specs.properties.map((prop, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-black rounded-full" />
                                    <span className="text-sm text-gray-700">{prop}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
