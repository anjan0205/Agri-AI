import React, { useEffect } from 'react';
import { Thermometer, Droplets, Sun, CloudRain, Wind } from 'lucide-react';

export default function ClimateStrip({ lat, lon, meteoData, setMeteoData }) {
  useEffect(() => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&daily=precipitation_sum,shortwave_radiation_sum&timezone=auto`)
      .then(res => res.json())
      .then(data => setMeteoData(data))
      .catch(err => console.error("Climate fetch error:", err));
  }, [lat, lon, setMeteoData]);

  if (!meteoData || !meteoData.current) return (
    <div className="h-32 w-full animate-pulse bg-[#F0F7F2] rounded-3xl border border-[#D4C5A9]/20 flex items-center justify-center text-[#5C3D2E]/50 font-bold tracking-widest text-sm uppercase">
      Connecting to Satellites...
    </div>
  );

  const current = meteoData.current;
  const currentRain = meteoData.daily?.precipitation_sum?.[0] || 0;
  // Convert MJ/m2 to rough w/m2 (for display aesthetics)
  const currentRad = (meteoData.daily?.shortwave_radiation_sum?.[0] || 0) * 11.57;

  const styleBase = "flex flex-col items-center justify-center p-6 bg-white/60 backdrop-blur-md rounded-3xl border border-[#D4C5A9]/30 shadow-md transition-all duration-300 hover:scale-105 hover:bg-white/90 cursor-default hover:shadow-lg";

  return (
    <div className="flex gap-4 overflow-x-auto w-full custom-scrollbar pb-4 pt-2 px-2 snap-x">
      <div className={`${styleBase} min-w-[160px] flex-1 text-[#5C3D2E] snap-center`}>
        <Thermometer className={current.temperature_2m > 30 ? "text-red-500" : current.temperature_2m < 15 ? "text-blue-500" : "text-[#4CAF78]"} size={28} />
        <span className="text-3xl font-extrabold font-heading mt-3">{current.temperature_2m}°C</span>
        <span className="text-xs uppercase font-bold text-[#1A6B3C]/60 tracking-widest mt-1">Temperature</span>
      </div>
      
      <div className={`${styleBase} min-w-[160px] flex-1 text-[#1B4F8A] snap-center`}>
        <Droplets size={28} />
        <span className="text-3xl font-extrabold font-heading mt-3">{current.relative_humidity_2m}%</span>
        <span className="text-xs uppercase font-bold text-[#1A6B3C]/60 tracking-widest mt-1">Humidity</span>
      </div>
      
      <div className={`${styleBase} min-w-[160px] flex-1 text-[#E8A838] snap-center`}>
        <Sun className="animate-pulse" size={28} />
        <span className="text-3xl font-extrabold font-heading mt-3">{Math.round(currentRad)} <span className="text-sm">W/m²</span></span>
        <span className="text-xs uppercase font-bold text-[#1A6B3C]/60 tracking-widest mt-1">Solar Rad</span>
      </div>
      
      <div className={`${styleBase} min-w-[160px] flex-1 text-[#1A6B3C] snap-center`}>
        <CloudRain size={28} />
        <span className="text-3xl font-extrabold font-heading mt-3">{currentRain.toFixed(1)} <span className="text-sm">mm</span></span>
        <span className="text-xs uppercase font-bold text-[#1A6B3C]/60 tracking-widest mt-1">Rainfall</span>
      </div>
      
      <div className={`${styleBase} min-w-[160px] flex-1 text-gray-500 snap-center`}>
        <Wind size={28} />
        <span className="text-3xl font-extrabold font-heading mt-3">{current.wind_speed_10m} <span className="text-sm">km/h</span></span>
        <span className="text-xs uppercase font-bold text-[#1A6B3C]/60 tracking-widest mt-1">Wind Speed</span>
      </div>
    </div>
  )
}
