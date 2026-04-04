import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Download, Activity, Cpu } from 'lucide-react';

export default function GreenhousePanel({ apiData, cropName, meteoData }) {
  const [controls, setControls] = useState({
    temp: apiData?.mapped_features?.temperature || 25,
    humidity: apiData?.mapped_features?.humidity || 60,
    co2: 400,
    light: 12
  });

  const baseYield = {
    wheat: 35, rice: 40, maize: 45, cotton: 25, soybean: 30,
    barley: 30, mirchi: 20, tomato: 60, potato: 250, onion: 180,
    sugarcane: 800, sorghum: 28, cabbage: 400, peanut: 15
  }[cropName] || 40;

  const targetTemp = apiData?.ideal?.temperature || 24;
  const targetHum = apiData?.ideal?.humidity || 60;
  
  const tempDeltaToTarget = Math.abs(controls.temp - targetTemp);
  const humDeltaToTarget = Math.abs(controls.humidity - targetHum);
  
  const tempFactor = (20 - tempDeltaToTarget) * 0.02;
  const humFactor = (30 - humDeltaToTarget) * 0.015;
  const co2Factor = ((controls.co2 - 400) / 100) * 0.02;
  const lightFactor = ((controls.light - 10) / 2) * 0.05;
  
  const projectedYield = baseYield * (1 + tempFactor + humFactor + co2Factor + lightFactor);
  const boostPercent = Math.max(0, ((projectedYield / (baseYield * (apiData.suitability.score/100))) - 1) * 100);

  const handleDownload = () => {
    const text = `AGRI-AI MASTER GREENHOUSE PLAN\n\nCrop: ${cropName.toUpperCase()}\nTarget Yield: ${projectedYield.toFixed(1)} Q/ha (+${boostPercent.toFixed(1)}% Boost)\n\nSettings:\n- Temp: ${controls.temp} C\n- Humidity: ${controls.humidity}%\n- CO2: ${controls.co2} ppm\n- Light Run: ${controls.light} hrs/day\n\nAI Recommends:\n${Object.values(apiData?.greenhouse?.issues || {}).map(v => '- ' + v.action).join('\n')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');a.href = url;a.download = 'greenhouse_simulation.txt';
    a.click();
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-[#D4C5A9]/40 rounded-3xl p-8 shadow-xl overflow-hidden relative">
      <div className="flex justify-between items-end border-b border-[#D4C5A9]/20 pb-6 mb-8 relative z-10">
        <div>
          <h2 className="text-3xl font-heading text-[#1A6B3C] font-bold flex items-center gap-3">
            <Cpu className="text-[#4CAF78]" /> Simulated Optimal Environment
          </h2>
          <p className="text-gray-500 font-medium text-sm mt-2">Adjust atmospheric sliders to preview compounding yield effects natively.</p>
        </div>
        <div className="text-right bg-white p-4 rounded-2xl border border-[#D4C5A9]/30 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Projected Yield</p>
          <div className="text-4xl font-extrabold font-heading text-[#1A6B3C] flex items-baseline justify-end gap-2">
            {projectedYield.toFixed(1)} <span className="text-sm font-medium text-gray-500 font-sans">Q/ha</span>
          </div>
          <div className="text-[#4CAF78] font-bold text-sm flex items-center gap-1 justify-end mt-1">
            <Activity size={14} /> +{boostPercent.toFixed(1)}% Boost Detected
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
        {/* Sliders */}
        <div className="space-y-6 bg-white p-6 rounded-3xl border border-[#D4C5A9]/30 shadow-sm flex flex-col justify-start">
          <h3 className="font-bold text-[#1A6B3C] uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
            <Settings size={14} /> Mastermind Control Dashboard
          </h3>
          
          <div className="flex items-center gap-4 bg-orange-50 p-4 rounded-2xl border border-orange-200 mb-6 mt-2 shadow-sm">
            <div className="p-3 bg-white rounded-xl shadow-sm text-orange-500 hidden sm:block">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/><path d="M12 9v3"/></svg>
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest">Climate Adjustment</p>
              <p className="text-xl font-extrabold text-gray-900">
                {apiData?.mapped_features?.temperature ? (targetTemp - apiData.mapped_features.temperature > 0 ? '+' : '') : ''}
                {apiData?.mapped_features?.temperature ? (targetTemp - apiData.mapped_features.temperature).toFixed(1) : '-'}°C
                <span className="text-sm font-medium text-gray-500 ml-2">Targeting {targetTemp}°C</span>
              </p>
            </div>
            <div className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm ${apiData?.mapped_features?.temperature && targetTemp - apiData.mapped_features.temperature > 0 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
               {apiData?.mapped_features?.temperature && targetTemp - apiData.mapped_features.temperature > 0 ? 'Heating Active' : 'Cooling Active'}
            </div>
          </div>
          
          <div className="space-y-2 mt-2">
            <div className="flex justify-between text-sm font-bold text-gray-700">
              <span>Temperature</span>
              <span>{controls.temp}°C / Target: {targetTemp}°C</span>
            </div>
            <input 
              type="range" min="15" max="35" step="0.5"
              value={controls.temp} onChange={(e) => setControls(p => ({...p, temp: Number(e.target.value)}))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1A6B3C]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold text-gray-700">
              <span>Relative Humidity</span>
              <span>{controls.humidity}% / Target: {targetHum}%</span>
            </div>
            <input 
              type="range" min="40" max="90" step="1"
              value={controls.humidity} onChange={(e) => setControls(p => ({...p, humidity: Number(e.target.value)}))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1A6B3C]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold text-gray-700">
              <span>CO₂ Enrichment</span>
              <span>{controls.co2} ppm</span>
            </div>
            <input 
              type="range" min="400" max="1200" step="50"
              value={controls.co2} onChange={(e) => setControls(p => ({...p, co2: Number(e.target.value)}))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#E8A838]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold text-gray-700">
              <span>Artificial Lighting (Hours)</span>
              <span>{controls.light} hrs/day</span>
            </div>
            <input 
              type="range" min="10" max="16" step="0.5"
              value={controls.light} onChange={(e) => setControls(p => ({...p, light: Number(e.target.value)}))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#E8A838]"
            />
          </div>

          <button 
            onClick={handleDownload}
            className="w-full mt-6 bg-[#1A6B3C] hover:bg-[#13542E] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
          >
            <Download size={18} /> Download Master Blueprint
          </button>
        </div>

        {/* Diagnostic Interventions from Python Backend API */}
        <div className="bg-[#F0F7F2] border border-[#D4C5A9]/30 p-6 rounded-3xl h-full flex flex-col shadow-inner">
          <h3 className="font-bold text-[#1A6B3C] uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
            <ShieldCheck size={14} /> AI Recommended Interventions
          </h3>
          <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2 max-h-[440px]">
            {Object.entries(apiData?.greenhouse?.issues || {}).map(([key, val]) => (
              <div key={key} className="bg-white p-4 rounded-xl border border-[#D4C5A9]/50 shadow-sm transition-transform hover:scale-[1.02]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#5C3D2E] text-sm font-bold capitalize">{key.replace('_', ' ')}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${val.status === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-[#E8A838]/20 text-[#E8A838]'}`}>
                    {val.status} Fix
                  </span>
                </div>
                <p className="text-gray-600 text-xs font-semibold leading-relaxed">
                  → {val.action}
                </p>
              </div>
            ))}

            {Object.entries(apiData?.fertilizers || {}).filter(([k,v]) => v.status === 'Deficient').map(([k,v]) => (
              <div key={`fert-${k}`} className="bg-white p-4 rounded-xl border border-[#4CAF78]/40 shadow-sm transition-transform hover:scale-[1.02]">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-[#1A6B3C] text-sm font-bold uppercase">{k} DEFICIT (-{v.deficit} kg)</span>
                </div>
                <p className="text-gray-600 text-xs font-semibold leading-relaxed">
                  → Add {v.dose_kg_ha} of {v.fertilizer}
                </p>
                <p className="text-[#4CAF78] text-[9px] uppercase font-bold mt-1 tracking-widest opacity-80">{v.timing}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
