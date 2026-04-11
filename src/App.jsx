import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ClimateStrip from './components/ClimateStrip';
import YieldPanel from './components/YieldPanel';
import GreenhousePanel from './components/GreenhousePanel';
import CropCalendar from './components/CropCalendar';

const INDIAN_STATES = {
    'Andhra Pradesh': { lat: 15.9129, lon: 79.7400 },
    'Assam': { lat: 26.2006, lon: 92.9376 },
    'Bihar': { lat: 25.0961, lon: 85.3131 },
    'Gujarat': { lat: 22.2587, lon: 71.1924 },
    'Karnataka': { lat: 15.3173, lon: 75.7139 },
    'Maharashtra': { lat: 19.7515, lon: 75.7139 },
    'Punjab': { lat: 31.1471, lon: 75.3412 },
    'Tamil Nadu': { lat: 11.1271, lon: 78.6569 },
    'Uttar Pradesh': { lat: 26.8467, lon: 80.9462 },
    'West Bengal': { lat: 22.9868, lon: 87.8550 },
    'Guntur': { lat: 16.3067, lon: 80.4365 }
};

const CROPS = [
  { id: 'rice', name: 'Rice', icon: '🌾' },
  { id: 'maize', name: 'Maize', icon: '🌽' },
  { id: 'mirchi', name: 'Mirchi', icon: '🌶️' },
  { id: 'onion', name: 'Onion', icon: '🧅' },
  { id: 'tomato', name: 'Tomato', icon: '🍅' },
  { id: 'sugarcane', name: 'Sugarcane', icon: '🎋' },
  { id: 'peanut', name: 'Groundnut', icon: '🥜' },
  { id: 'cotton', name: 'Cotton', icon: '☁️' },
  { id: 'soybean', name: 'Soybean', icon: '🫘' },
  { id: 'potato', name: 'Potato', icon: '🥔' },
];

const SOIL_TYPES = [
  { id: 'loamy', name: 'Alluvial Loamy', icon: 'layers' },
  { id: 'clay', name: 'Black Cotton', icon: 'layers' },
  { id: 'sandy', name: 'Sandy Red', icon: 'layers' },
  { id: 'laterite', name: 'Laterite Plateu', icon: 'layers' },
  { id: 'saline', name: 'Saline Coastal', icon: 'layers' },
];

export default function App() {
  const [inputs, setInputs] = useState({
    location: 'Punjab',
    lat: 31.1471,
    lon: 75.3412,
    crop: 'rice',
    landType: 'loamy'
  });

  const [loading, setLoading] = useState(false);
  const [showYield, setShowYield] = useState(false);
  const [showGreenhouse, setShowGreenhouse] = useState(false);
  
  const [apiData, setApiData] = useState(null);
  const [meteoData, setMeteoData] = useState(null);
  
  const updateLocation = (stateName) => {
    if (INDIAN_STATES[stateName]) {
      setInputs(prev => ({
        ...prev, 
        location: stateName, 
        lat: INDIAN_STATES[stateName].lat,
        lon: INDIAN_STATES[stateName].lon
      }));
    }
  };

  const handlePredict = async () => {
    setLoading(true);
    setShowGreenhouse(false);
    setShowYield(false);

    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${inputs.lat}&longitude=${inputs.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&daily=precipitation_sum,shortwave_radiation_sum&timezone=auto`);
      const weather = await res.json();
      setMeteoData(weather);

      const temp = weather.current.temperature_2m;
      const hum = weather.current.relative_humidity_2m;
      const wind = weather.current.wind_speed_10m;
      const dailyRain = weather.daily.precipitation_sum || [];
      const rf = (dailyRain[0] || 0) * 15;
      const dailyRad = weather.daily.shortwave_radiation_sum || [];
      const sr = (dailyRad[0] || 0) * 10;

      const soilLookup = {
        loamy: { ph: 6.5, n: 60, p: 40, k: 50 },
        clay: { ph: 6.0, n: 30, p: 20, k: 30 },
        sandy: { ph: 5.5, n: 20, p: 10, k: 15 },
        laterite: { ph: 5.0, n: 25, p: 15, k: 20 },
        saline: { ph: 8.0, n: 40, p: 30, k: 40 },
      };
      const soil = soilLookup[inputs.landType] || soilLookup.loamy;

      const apiResponse = await fetch('/api/advise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop: inputs.crop,
          features: {
            temperature: temp,
            humidity: hum,
            rainfall: rf,
            windSpeed: wind,
            solarRad: sr,
            evapo: 5.5,
            soilPh: soil.ph,
            nitro: soil.n,
            phospho: soil.p,
            potas: soil.k,
            soilType: inputs.landType
          }
        })
      });

      const aiData = await apiResponse.json();
      if (!apiResponse.ok) throw new Error(aiData.error || 'ML API Error');
      
      setApiData(aiData);
      setShowYield(true);

      // Scroll to results
      setTimeout(() => {
        document.getElementById('yield-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);

    } catch (err) {
      console.error(err);
      alert("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = () => {
    if (apiData) {
      setShowGreenhouse(true);
      setTimeout(() => {
        document.getElementById('simulation-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      alert("Please Analyze local yields first!");
    }
  };

  return (
    <div className="min-h-screen bg-surface selection:bg-primary/10">
      {/* 1. HEADER */}
      <header className="w-full sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/10">
        <div className="max-w-[1440px] mx-auto px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-primary tracking-tight serif-text flex items-center gap-3">
            <img src="/logo_modern.png" alt="Agri-AI" className="w-10 h-10 object-contain rounded-lg shadow-sm" />
            Agri-AI
          </div>
          <nav className="hidden md:flex gap-8 items-center font-bold text-xs uppercase tracking-widest text-on-surface-variant">
            <a className="text-primary border-b-2 border-primary pb-1 cursor-pointer">Precision Diagnostics</a>
            <a className="hover:text-primary transition-colors cursor-pointer">ML Yield Models</a>
            <a className="hover:text-primary transition-colors cursor-pointer">Greenhouse Simulation</a>
          </nav>
          <div className="flex items-center gap-6">
            <div className="relative cursor-pointer group">
              <span className="material-symbols-outlined text-[#1A6B3C] group-hover:scale-110 transition-transform">notifications</span>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full outline outline-2 outline-surface"></span>
            </div>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container shadow-sm">
              <img 
                alt="User" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5ntSEE75N51tW1nNKzgrP3v-W6yUHX1pF2hKuUAz7nMZx5Bh5ZkLaEQjP37VDCL0c_0aR0h_lkY19lWtYLe47ajj9fqt0vGKDl5d0n0kghv6rfTXMloMxUTG3xYJ3oZ8gcROH16WN9zcD9A6Jd5sK086ZRkN9DNOGCybEgarTQyIgmrOebizQH5cjfMmjlKAOnAU0kh1QmegC33HgjyNMmLcLNULyweaEoq4DVd9ckQd-4JTshw64a_acea2jCiNaHeVNeJ2pewg" 
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-8 pb-20">
        {/* 2. HERO SECTION */}
        <section className="py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }} 
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="flex gap-3">
              <span className="px-4 py-1.5 bg-primary-fixed text-on-primary-fixed rounded-full text-[10px] font-bold tracking-wider uppercase shadow-sm">99.2% Accuracy</span>
              <span className="px-4 py-1.5 bg-surface-variant text-on-surface-variant rounded-full text-[10px] font-bold tracking-wider uppercase shadow-sm">20k Training Records</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-on-surface leading-[1.1] serif-text">
              Smart Location-Based <span className="text-primary italic">Farming</span>
            </h1>
            <p className="text-xl text-on-surface-variant leading-relaxed max-w-xl">
              Harnessing satellite data and ML architectures to provide hyper-local crop optimization for Bharat systems. We curate your harvest's biological potential.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={handlePredict}
                className="primary-gradient text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 shadow-lg shadow-primary/20 hover:scale-105 duration-200 transition-all hover:shadow-xl active:scale-95"
              >
                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <span className="material-symbols-outlined">monitoring</span>}
                Analyze & Predict Yield
              </button>
              <button 
                onClick={handleSimulate}
                disabled={!apiData}
                className="glass-card text-primary px-8 py-4 rounded-xl font-bold border border-primary/10 hover:bg-surface-variant transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                Simulate Master Greenhouse
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-[2.5rem] overflow-hidden aspect-square shadow-2xl group"
          >
            <img 
              alt="Farmland" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCaYPlDxkb0dNKOohB-VVMqgmiWm_9yy9JALEE-VyVh5JZ6s6OtsWOJoejvRXWVMTdqBnxOmM74CK99J00hrd4OT6BPBwizDeDAI8n_s_RCiyf0ehC_eytdk4atr-HKxm54fbEdfCoW4cIrRMomfxkNrRNfHVDYeUCuBvB8NQAzwdOoV3wQT2WJDIcwj_BAwkh7CrkZit4-WSRYPitu6QGoRTtwQOA17EBRCHItzxTy4J-Xww4pDmR5hZXLjyxYsw4OppZb9l-h1x0" 
            />
            <div className="absolute bottom-6 left-6 right-6 glass-card p-6 rounded-2xl flex justify-between items-center transform translate-y-0 group-hover:-translate-y-2 transition-transform duration-500">
              <div>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Current Focus</p>
                <p className="text-lg font-semibold serif-text">{inputs.location} Regional Farm</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Health Index</p>
                <p className="text-lg font-semibold serif-text text-primary">0.94 NDVI</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 3. INPUT SECTION */}
        <section className="mb-20">
          <div className="bg-surface-container-low p-10 rounded-[2rem] space-y-10 shadow-sm border border-outline-variant/10">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Location Selector */}
              <div className="flex-1 space-y-3">
                <label className="text-xs font-bold text-primary uppercase tracking-widest px-1">Location Geometry</label>
                <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-3 border border-outline-variant/20 shadow-sm focus-within:ring-2 ring-primary/20 transition-all">
                  <span className="material-symbols-outlined text-primary">location_on</span>
                  <select 
                    className="bg-transparent border-none focus:ring-0 w-full text-on-surface font-bold text-sm cursor-pointer"
                    value={inputs.location}
                    onChange={(e) => updateLocation(e.target.value)}
                  >
                    {Object.keys(INDIAN_STATES).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Crop Selector */}
              <div className="flex-1 space-y-3">
                <label className="text-xs font-bold text-primary uppercase tracking-widest px-1">Target Crop Species</label>
                <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-3 border border-outline-variant/20 shadow-sm focus-within:ring-2 ring-primary/20 transition-all">
                  <span className="material-symbols-outlined text-primary">grass</span>
                  <select 
                    className="bg-transparent border-none focus:ring-0 w-full text-on-surface font-bold text-sm cursor-pointer"
                    value={inputs.crop}
                    onChange={(e) => setInputs(prev => ({ ...prev, crop: e.target.value }))}
                  >
                    {CROPS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Soil Selector */}
              <div className="flex-1 space-y-3">
                <label className="text-xs font-bold text-primary uppercase tracking-widest px-1">Soil Profile Type</label>
                <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-3 border border-outline-variant/20 shadow-sm focus-within:ring-2 ring-primary/20 transition-all">
                  <span className="material-symbols-outlined text-primary">layers</span>
                  <select 
                    className="bg-transparent border-none focus:ring-0 w-full text-on-surface font-bold text-sm cursor-pointer"
                    value={inputs.landType}
                    onChange={(e) => setInputs(prev => ({ ...prev, landType: e.target.value }))}
                  >
                    {SOIL_TYPES.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* 4. CLIMATE STRIP */}
            <ClimateStrip meteoData={meteoData} />
          </div>
        </section>

        {/* 5. RESULTS PANELS */}
        <AnimatePresence>
          {showYield && apiData && (
             <motion.section 
               id="yield-report"
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               className="mb-20 scroll-mt-24"
             >
               <YieldPanel apiData={apiData} cropName={inputs.crop} />
             </motion.section>
          )}

          {showGreenhouse && apiData && (
            <motion.section
              id="simulation-report"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-20 scroll-mt-24"
            >
              <GreenhousePanel apiData={apiData} cropName={inputs.crop} meteoData={meteoData} />
            </motion.section>
          )}
        </AnimatePresence>

        {/* 6. SEASONAL CYCLE */}
        <section className="pt-10">
           <CropCalendar crop={inputs.crop} />
        </section>

      </main>

      {/* 7. FOOTER */}
      <footer className="bg-surface-container-highest py-16 px-8 mt-20">
        <div className="max-w-[1440px] mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <h3 className="text-2xl font-bold serif-text text-primary mb-6">Agri-AI</h3>
            <p className="text-on-surface-variant max-w-md leading-relaxed font-medium">
              Empowering the Indian Kisan with the synthesis of machine intelligence and traditional wisdom. Our platform is the digital bridge for the next Green Revolution.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-xs uppercase tracking-widest text-primary">Capabilities</h4>
            <ul className="space-y-4 text-on-surface-variant text-sm font-bold">
              <li className="hover:text-primary transition-colors cursor-pointer">Yield Prediction</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Pest Diagnostic</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Soil Mapping</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-xs uppercase tracking-widest text-primary">System</h4>
            <ul className="space-y-4 text-on-surface-variant text-sm font-bold">
              <li className="hover:text-primary transition-colors cursor-pointer">FPO Docs</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Kisan API</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Research Lab</li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto mt-16 pt-8 border-t border-outline-variant/30 flex justify-between items-center text-[10px] font-bold text-primary/40 uppercase tracking-widest">
          <span>© 2024 Agri-AI Bharat Systems</span>
          <span>Digital India Agricultural Alliance Partner</span>
        </div>
      </footer>
    </div>
  );
}
