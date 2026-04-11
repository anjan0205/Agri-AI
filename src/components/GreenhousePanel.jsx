import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const [selectedIntervention, setSelectedIntervention] = useState(null);

  return (
    <div className="bg-surface-container-low border border-outline-variant/10 rounded-[2rem] p-8 shadow-sm overflow-hidden relative">
      <AnimatePresence>
        {selectedIntervention && (
          <PrescriptionModal 
            intervention={selectedIntervention} 
            onClose={() => setSelectedIntervention(null)} 
            conv={conv}
            unit={unit}
            cropName={cropName}
          />
        )}
      </AnimatePresence>

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
            {(projectedYield / conv).toFixed(1)} <span className="text-sm font-bold text-on-surface-variant italic">Q/{isAcreMode ? 'acre' : 'ha'}</span>
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
            {Object.entries(apiData?.greenhouse?.issues || {}).map(([key, val]) => {
              const isNutrient = ['nitrogen', 'phosphorus', 'potassium'].includes(key.toLowerCase());
              const fertInfo = isNutrient ? Object.entries(apiData?.fertilizers || {}).find(([k,v]) => k.toLowerCase() === key.toLowerCase()) : null;
              
              return (
                <div 
                  key={key} 
                  onClick={() => setSelectedIntervention({ key, ...val, fert: fertInfo ? fertInfo[1] : null })}
                  className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-sm transition-all hover:translate-x-1 hover:border-primary/30 cursor-pointer group"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-on-surface text-sm font-bold capitalize italic serif-text">{key.replace('_', ' ')} Adjustment</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${val.status === 'CRITICAL' ? 'bg-error-container text-on-error-container' : 'bg-tertiary-fixed text-on-tertiary-fixed'}`}>
                      {val.status} FIX
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-[13px] font-medium leading-relaxed group-hover:text-primary transition-colors">
                     {val.action}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-[9px] font-black uppercase text-primary opacity-0 group-hover:opacity-100 transition-opacity tracking-widest">
                    <span>View Detailed Recipe</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </div>
                </div>
              );
            })}

            {/* Render any fertilizers not already in issues (Fallback) */}
            {Object.entries(apiData?.fertilizers || {})
              .filter(([k,v]) => v.status === 'Deficient' && !Object.keys(apiData?.greenhouse?.issues || {}).some(ik => ik.toLowerCase() === k.toLowerCase()))
              .map(([k,v]) => (
              <div 
                key={`fert-${k}`} 
                onClick={() => setSelectedIntervention({ key: k, action: `Apply ${v.fertilizer}`, fert: v })}
                className="bg-surface-container-lowest p-5 rounded-2xl border border-primary/20 shadow-sm transition-all hover:translate-x-1 cursor-pointer group"
              >
                <div className="flex justify-between items-center mb-3 text-primary">
                   <span className="text-xs font-black uppercase tracking-[0.1em]">{k} DEFICIT (-{(v.deficit / conv).toFixed(1)} {unit})</span>
                   <span className="material-symbols-outlined text-lg">science</span>
                </div>
                <p className="text-on-surface text-[13px] font-bold leading-relaxed mb-1 group-hover:text-primary transition-colors">
                   Add {v.dose_raw ? (v.dose_raw / conv).toFixed(1) : (parseFloat(v.dose_kg_ha) / conv).toFixed(1)} {unit} of {v.fertilizer}
                </p>
                <p className="text-primary text-[10px] uppercase font-black tracking-widest opacity-60 italic">{v.timing}</p>
                <div className="mt-2 text-[9px] font-black uppercase text-primary opacity-0 group-hover:opacity-100 transition-opacity">View Prescription</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PrescriptionModal({ intervention, onClose, conv, unit, cropName }) {
  const { key, action, fert, status } = intervention;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-surface rounded-[2.5rem] shadow-2xl overflow-hidden border border-outline-variant/20"
      >
        <div className="primary-gradient p-10 text-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
            <span className="material-symbols-outlined">close</span>
          </button>
          <div className="flex items-center gap-4 mb-4">
             <span className="material-symbols-outlined text-4xl">description</span>
             <div>
               <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-70">Mastermind Prescription</p>
               <h3 className="text-3xl font-bold serif-text italic capitalize">{key.replace('_', ' ')} Correction Report</h3>
             </div>
          </div>
          <div className="flex gap-3">
             <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">{status || 'HIGH'} PRIORITY</span>
             <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">Crop: {cropName}</span>
          </div>
        </div>

        <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <section className="space-y-4">
             <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
               <span className="material-symbols-outlined text-lg">analytics</span>
               Nutrient Gap Analysis
             </h4>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-low p-4 rounded-2xl">
                   <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Current Soil State</p>
                   <p className="text-2xl font-bold serif-text text-on-surface">{fert?.current || 'N/A'} <span className="text-xs font-normal opacity-60">PPM</span></p>
                </div>
                <div className="bg-primary-container p-4 rounded-2xl">
                   <p className="text-[10px] font-bold text-primary uppercase mb-1">Target Ideal</p>
                   <p className="text-2xl font-bold serif-text text-primary">{fert?.ideal || 'N/A'} <span className="text-xs font-normal opacity-60">PPM</span></p>
                </div>
             </div>
          </section>

          <section className="bg-surface-container-high p-8 rounded-3xl border border-primary/10 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5">
                <span className="material-symbols-outlined text-9xl">science</span>
             </div>
             <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-6">Actionable Prescription</h4>
             <div className="space-y-6">
                <div>
                   <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-2">Requirement Per {unit.split('/')[1]}</p>
                   <p className="text-4xl font-extrabold text-primary serif-text italic leading-none">
                     {fert?.dose_raw ? (fert.dose_raw / conv).toFixed(1) : (parseFloat(fert?.dose_kg_ha) / conv || 0).toFixed(1)} {unit}
                   </p>
                </div>
                <div className="space-y-3">
                   <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-xl">inventory_2</span>
                      <p className="text-sm font-bold text-on-surface">Product: <span className="text-primary">{fert?.fertilizer || 'Manual Adjustment Needed'}</span></p>
                   </div>
                   <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-xl">schedule</span>
                      <p className="text-sm font-medium text-on-surface-variant italic leading-relaxed">
                         {fert?.timing || "Apply as per standard regional agronomy guidelines for greenhouse climates."}
                      </p>
                   </div>
                </div>
             </div>
          </section>

          <div className="p-5 bg-tertiary-container rounded-2xl flex items-start gap-4 border border-tertiary/10">
             <span className="material-symbols-outlined text-on-tertiary-container mt-1">lightbulb</span>
             <p className="text-xs font-medium text-on-tertiary-container leading-relaxed">
                <strong className="block mb-1 italic">Agronomist Pro-Tip:</strong>
                For maximum uptake efficiency, apply during low solar radiation periods and ensure immediate irrigation to prevent volatization.
             </p>
          </div>
        </div>

        <div className="p-8 bg-surface-container-lowest border-t border-outline-variant/30 flex justify-end gap-4">
           <button onClick={onClose} className="px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest text-on-surface-variant hover:bg-surface-variant transition-colors">Dismiss</button>
           <button onClick={onClose} className="primary-gradient px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-widest text-white shadow-lg shadow-primary/20">Acknowledge</button>
        </div>
      </motion.div>
    </div>
  );
}

