import React, { useState } from 'react';

export default function GreenhousePanel({ apiData, cropName, meteoData }) {
  const [controls, setControls] = useState({
    temp: apiData?.mapped_features?.temperature || 25,
    humidity: apiData?.mapped_features?.humidity || 60,
    co2: 400,
    light: 12
  });

  const [isAcreMode, setIsAcreMode] = useState(true);
  const conv = isAcreMode ? 2.471 : 1; 
  const unit = isAcreMode ? 'kg/acre' : 'kg/ha';

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
    const text = `AGRI-AI MASTER BLUEPRINT\n\nCrop: ${cropName.toUpperCase()}\nSimulated Yield: ${projectedYield.toFixed(1)} Q/ha\nBoost: +${boostPercent.toFixed(1)}%\n\nAtmospheric Config:\n- Temp: ${controls.temp} C\n- Humidity: ${controls.humidity}%\n- CO2: ${controls.co2} ppm\n- Lighting: ${controls.light} hrs\n\nInterventions:\n${Object.values(apiData?.greenhouse?.issues || {}).map(v => '- ' + v.action).join('\n')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');a.href = url;a.download = 'greenhouse_blueprint.txt';
    a.click();
  };

  const ambientTemp = meteoData?.current?.temperature_2m || apiData?.mapped_features?.temperature || controls.temp;
  const simulationDelta = controls.temp - ambientTemp;
  const requiredDelta = targetTemp - ambientTemp;

  return (
    <div className="bg-surface-container-low border border-outline-variant/10 rounded-[2rem] p-8 shadow-sm overflow-hidden relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-outline-variant/20 pb-8 mb-8">
        <div>
          <h2 className="text-3xl font-bold serif-text text-primary italic flex items-center gap-3">
             Simulated Greenhouse Environment
          </h2>
          <p className="text-on-surface-variant font-medium mt-2">Precision climate modulation to unlock maximum genetic yield potential.</p>
        </div>
        <div className="mt-6 md:mt-0 text-right bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20 shadow-sm min-w-[240px]">
          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2">Simulated Yield Potential</p>
          <div className="text-5xl font-extrabold serif-text text-primary flex items-baseline justify-end gap-2">
            {projectedYield.toFixed(1)} <span className="text-sm font-bold text-on-surface-variant italic">Q/ha</span>
          </div>
          <div className="text-primary font-bold text-xs flex items-center gap-1 justify-end mt-2 uppercase tracking-tight">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            +{boostPercent.toFixed(1)}% Efficiency Boost
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Sliders Area */}
        <div className="space-y-8 bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-primary uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">settings_input_component</span>
              Atmospheric Modulators
            </h3>
            <div className="flex gap-4">
               <div className="text-right">
                  <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest">Ambient</p>
                  <p className="text-xs font-bold text-on-surface">{ambientTemp}°C</p>
               </div>
               <div className="text-right">
                  <p className="text-[8px] font-bold text-primary uppercase tracking-widest">Target</p>
                  <p className="text-xs font-bold text-primary">{targetTemp}°C</p>
               </div>
            </div>
          </div>

          <div className="flex items-center gap-5 bg-surface-container-low p-5 rounded-2xl border border-primary/5 shadow-sm">
            <div className={`p-3 rounded-xl shadow-sm material-symbols-outlined text-white ${simulationDelta >= 1 ? 'bg-orange-600' : simulationDelta <= -1 ? 'bg-primary' : 'bg-on-surface-variant'}`}>
               {simulationDelta >= 1 ? 'heat_pump' : simulationDelta <= -1 ? 'ac_unit' : 'thermostat'}
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-1">Climate Adjustment Status</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-extrabold text-on-surface serif-text italic leading-none">
                  {simulationDelta > 0 ? '+' : ''}{simulationDelta.toFixed(1)}°C
                </p>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-on-surface uppercase tracking-tight">Current Simulation</span>
                  <p className="text-[10px] text-on-surface-variant font-medium">Shift from outdoor ambient</p>
                </div>
              </div>
            </div>
            <div className="text-right border-l border-outline-variant/20 pl-5">
               <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Recommended Fix</p>
               <p className={`text-xl font-extrabold serif-text ${requiredDelta > 0 ? 'text-orange-600' : 'text-primary'}`}>
                 {requiredDelta > 0 ? '+' : ''}{requiredDelta.toFixed(1)}°C
               </p>
               <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">To hit {targetTemp}°C Optimal</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              <span>Dynamic Temperature</span>
              <span className="text-primary">{controls.temp}°C</span>
            </div>
            <input 
              type="range" min="15" max="35" step="0.5"
              value={controls.temp} onChange={(e) => setControls(p => ({...p, temp: Number(e.target.value)}))}
              className="w-full h-1.5 bg-surface-variant rounded-full appearance-none cursor-pointer accent-primary"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              <span>RH Modulation</span>
              <span className="text-primary">{controls.humidity}%</span>
            </div>
            <input 
              type="range" min="40" max="90" step="1"
              value={controls.humidity} onChange={(e) => setControls(p => ({...p, humidity: Number(e.target.value)}))}
              className="w-full h-1.5 bg-surface-variant rounded-full appearance-none cursor-pointer accent-primary"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              <span>CO₂ Saturation</span>
              <span className="text-primary">{controls.co2} ppm</span>
            </div>
            <input 
              type="range" min="400" max="1200" step="50"
              value={controls.co2} onChange={(e) => setControls(p => ({...p, co2: Number(e.target.value)}))}
              className="w-full h-1.5 bg-surface-variant rounded-full appearance-none cursor-pointer accent-tertiary"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              <span>Radiation Pulse (Hrs)</span>
              <span className="text-primary">{controls.light} hrs/day</span>
            </div>
            <input 
              type="range" min="10" max="16" step="0.5"
              value={controls.light} onChange={(e) => setControls(p => ({...p, light: Number(e.target.value)}))}
              className="w-full h-1.5 bg-surface-variant rounded-full appearance-none cursor-pointer accent-tertiary"
            />
          </div>

          <button 
            onClick={handleDownload}
            className="w-full mt-6 primary-gradient text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 text-sm uppercase tracking-widest"
          >
            <span className="material-symbols-outlined">download</span>
            Generate Master Blueprint
          </button>
        </div>

        {/* Diagnostic Interventions */}
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-bold text-primary uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">verified_user</span>
              AI Recommended Interventions
            </h3>
            <button 
              onClick={() => setIsAcreMode(!isAcreMode)}
              className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-primary text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-sm flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[10px]">straighten</span>
              Unit: {isAcreMode ? 'Acre' : 'Hectare'}
            </button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2 max-h-[480px]">
            {Object.entries(apiData?.greenhouse?.issues || {}).map(([key, val]) => (
              <div key={key} className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-sm transition-all hover:translate-x-1">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-on-surface text-sm font-bold capitalize italic serif-text">{key.replace('_', ' ')} Adjustment</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${val.status === 'CRITICAL' ? 'bg-error-container text-on-error-container' : 'bg-tertiary-fixed text-on-tertiary-fixed'}`}>
                    {val.status} FIX
                  </span>
                </div>
                <p className="text-on-surface-variant text-[13px] font-medium leading-relaxed">
                   {val.action}
                </p>
              </div>
            ))}

            {Object.entries(apiData?.fertilizers || {}).filter(([k,v]) => v.status === 'Deficient').map(([k,v]) => (
              <div key={`fert-${k}`} className="bg-surface-container-lowest p-5 rounded-2xl border border-primary/20 shadow-sm transition-all hover:translate-x-1">
                <div className="flex justify-between items-center mb-3 text-primary">
                   <span className="text-xs font-black uppercase tracking-[0.1em]">{k} DEFICIT (-{(v.deficit / conv).toFixed(1)} {unit})</span>
                   <span className="material-symbols-outlined text-lg">science</span>
                </div>
                <p className="text-on-surface text-[13px] font-bold leading-relaxed mb-1">
                   Add {v.dose_raw ? (v.dose_raw / conv).toFixed(1) : (parseFloat(v.dose_kg_ha) / conv).toFixed(1)} {unit} of {v.fertilizer}
                </p>
                <p className="text-primary text-[10px] uppercase font-black tracking-widest opacity-60 italic">{v.timing}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
