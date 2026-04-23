import { Wind, Waves, Thermometer, Ban } from "lucide-react";

export const CareInstructions = () => {
    const instructions = [
        { icon: <Wind className="w-8 h-8" />, title: "Dry Clean", desc: "Recommended for longevity" },
        { icon: <Waves className="w-8 h-8" />, title: "Hand Wash", desc: "Cold water with mild soap" },
        { icon: <Thermometer className="w-8 h-8" />, title: "Low Iron", desc: "Steam iron preferred" },
        { icon: <Ban className="w-8 h-8" />, title: "No Tumble Dry", desc: "Air dry in shade" },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-12 border-t border-gray-100 mt-12">
            {instructions.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center text-center gap-3">
                    <div className="text-gray-400">
                        {item.icon}
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-xs uppercase tracking-widest font-bold">{item.title}</h4>
                        <p className="text-[10px] text-gray-500">{item.desc}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

