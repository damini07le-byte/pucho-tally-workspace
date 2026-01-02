import React from 'react';
import { MapPin } from 'lucide-react';

const MiniMap = () => {
    return (
        <div className="w-full h-full bg-[#f8f9fa] rounded-2xl overflow-hidden relative border border-gray-100">
            {/* Mock Map Background */}
            <div
                className="absolute inset-0 opacity-40 grayscale"
                style={{
                    backgroundImage: `url("https://api.mapbox.com/styles/v1/mapbox/light-v10/static/77.5946,12.9716,10,0/600x400?access_token=pk.eyJ1IjoibW9ja21hcCIsImEiOiJjbTF4eHh4eHh4eHh4eHh4eHh4eHh4In0.mock")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            />

            {/* Grid Pattern overlay for "tech" feel */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* Mock Markers */}
            <div className="absolute top-1/4 left-1/3 animate-bounce">
                <div className="p-1 bg-black rounded-full shadow-lg">
                    <MapPin size={12} className="text-white" />
                </div>
            </div>
            <div className="absolute bottom-1/3 right-1/4 animate-pulse">
                <div className="p-2 bg-[#A0D296] rounded-full shadow-sm opacity-60" />
            </div>

            {/* Info Overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-xl border border-white/20 shadow-lg">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Business Density</p>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">Bangalore, IN</span>
                    <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Primary Hub</span>
                </div>
            </div>
        </div>
    );
};

export default MiniMap;
