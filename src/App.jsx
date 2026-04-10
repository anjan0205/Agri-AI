import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Leaf, Bell, Search, MapPin, 
  Settings, Sparkles, BarChart3, ChevronDown, Droplet
} from 'lucide-react';
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
  { id: 'rice', name: 'Rice', icon: '🌾', suitability: 'Ideal' },
  { id: 'maize', name: 'Maize', icon: '🌽', suitability: 'Good' },
  { id: 'mirchi', name: 'Mirchi', icon: '🌶️', suitability: 'Ideal' },
  { id: 'onion', name: 'Onion', icon: '🧅', suitability: 'Moderate' },
  { id: 'tomato', name: 'Tomato', icon: '🍅', suitability: 'Good' },
  { id: 'sugarcane', name: 'Sugarcane', icon: '🎋', suitability: 'Ideal' },
  { id: 'peanut', name: 'Groundnut', icon: '🥜', suitability: 'Good' },
  { id: 'cotton', name: 'Cotton', icon: '☁️', suitability: 'Moderate' },
  { id: 'soybean', name: 'Soybean', icon: '🫘', suitability: 'Good' },
  { id: 'potato', name: 'Potato', icon: '🥔', suitability: 'Moderate' },
];

const LAND_TYPES = [
  { id: 'clay', name: 'Clay', desc: '(Moisture-Rich)', icon: '🌱', retention: 90 },
  { id: 'sandy', name: 'Sandy Loam', desc: '(Well-drained)', icon: '🪨', retention: 40 },
  { id: 'loamy', name: 'Loamy Alluvial', desc: '(Balanced)', icon: '🌾', retention: 70 },
  { id: 'laterite', name: 'Laterite', desc: '(Acidic)', icon: '🏜️', retention: 30 },
  { id: 'saline', name: 'Saline', desc: '(High Salt)', icon: '🌊', retention: 20 },
];

export default function App() {
  const [inputs, setInputs] = useState({
    location: 'Guntur',
    lat: 16.3067,
    lon: 80.4365,
    crop: 'mirchi',
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
      // 1. Fetch live Open-Meteo Data
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${inputs.lat}&longitude=${inputs.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&daily=precipitation_sum,shortwave_radiation_sum&timezone=auto`);
      const weather = await res.json();
      setMeteoData(weather);

      // Extract required fields
      const temp = weather.current.temperature_2m;
      const hum = weather.current.relative_humidity_2m;
      const wind = weather.current.wind_speed_10m;
      
      // Calculate monthly precipitation equivalent and radiation average
      const dailyRain = weather.daily.precipitation_sum || [];
      const rf = (dailyRain[0] || 0) * 15; // Estimating a 15-day scaling factor based on immediate forecasts
      const dailyRad = weather.daily.shortwave_radiation_sum || [];
      const sr = (dailyRad[0] || 0) * 10; // Simple scaling to W/m2 equivalences

      // Provide baseline NPK matching the previous logic based on land type
      const soilLookup = {
        loamy: { ph: 6.5, n: 60, p: 40, k: 50 },
        clay: { ph: 6.0, n: 30, p: 20, k: 30 },
        sandy: { ph: 5.5, n: 20, p: 10, k: 15 },
        laterite: { ph: 5.0, n: 25, p: 15, k: 20 },
        saline: { ph: 8.0, n: 40, p: 30, k: 40 },
      };
      const soil = soilLookup[inputs.landType] || soilLookup.loamy;

      // 2. Transmit exact API match mapping to local Python server for heavy determinism
      const apiResponse = await fetch('http://127.0.0.1:5000/api/advise', {
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
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Please make sure the Python API is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = () => {
    if (apiData) {
      setShowGreenhouse(true);
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } else {
      alert("Please Analyze local yields first!");
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* 1. HEADER BAR */}
      <header className="sticky top-0 z-50 bg-[#F0F7F2]/90 backdrop-blur-md border-b border-[#D4C5A9]/30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
            <Leaf className="text-[#1A6B3C]" size={28} />
            <span className="font-heading font-bold text-xl text-[#5C3D2E] tracking-tight">Agri-AI</span>
          </div>
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-[#4CAF78]/10 rounded-full border border-[#4CAF78]/20">
            <span className="w-2 h-2 rounded-full bg-[#4CAF78] pulse-dot"></span>
            <span className="text-xs font-bold text-[#1A6B3C] uppercase tracking-wider">Automated Regional Diagnostics</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-[#5C3D2E] hover:text-[#1A6B3C] transition-colors relative">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#E8A838] rounded-full border border-[#F0F7F2]"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1A6B3C] to-[#4CAF78] flex items-center justify-center text-white font-bold text-sm shadow-sm">
              PA
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-12 space-y-12">
        {/* 2. HERO SECTION */}
        <section className="text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-heading mb-6 tracking-tight text-[#5C3D2E]">
              Smart <span className="text-[#1A6B3C]">Location-Based</span> Farming
            </h1>
            <p className="text-lg text-[#5C3D2E]/80 max-w-2xl mx-auto font-medium">
              Precision agriculture meets AI-driven editorial insights. 
              Deploy localized strategies tailored to earth's micro-climates.
            </p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="px-4 py-1.5 bg-[#1A6B3C]/10 rounded-full border border-[#1A6B3C]/20 flex items-center gap-2 shadow-sm">
                <Sparkles size={16} className="text-[#1A6B3C]" />
                <span className="text-xs font-bold text-[#1A6B3C] uppercase tracking-wider">Model Accuracy: 85.9%</span>
              </div>
              <div className="px-4 py-1.5 bg-[#4CAF78]/10 rounded-full border border-[#4CAF78]/20 flex items-center gap-2 shadow-sm">
                <BarChart3 size={16} className="text-[#4CAF78]" />
                <span className="text-xs font-bold text-[#4CAF78] uppercase tracking-wider">Trained on 20k Records</span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 3. INPUT CARD */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl shadow-[#1A6B3C]/5 border border-[#D4C5A9]/40 relative z-20 hover:shadow-2xl hover:shadow-[#1A6B3C]/10 transition-shadow duration-500"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* A. Location */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1A6B3C] uppercase tracking-wider pl-1">Location</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5C3D2E]/40" size={18} />
                <select 
                  className="w-full pl-12 pr-4 py-4 bg-[#F0F7F2] border-none rounded-2xl text-[#5C3D2E] font-bold appearance-none focus:ring-2 focus:ring-[#4CAF78] outline-none"
                  value={inputs.location}
                  onChange={(e) => updateLocation(e.target.value)}
                >
                  {Object.keys(INDIAN_STATES).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center text-[#E8A838]">
                  <MapPin size={16} />
                </div>
              </div>
            </div>

            {/* B. Target Crop */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1A6B3C] uppercase tracking-wider pl-1">Target Crop</label>
              <div className="relative">
                <select 
                  className="w-full px-4 py-4 bg-[#F0F7F2] border-none rounded-2xl text-[#5C3D2E] font-bold appearance-none focus:ring-2 focus:ring-[#4CAF78] outline-none"
                  value={inputs.crop}
                  onChange={(e) => setInputs(prev => ({ ...prev, crop: e.target.value }))}
                >
                  {CROPS.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5C3D2E]/40 pointer-events-none" size={18} />
              </div>
            </div>

            {/* C. Land Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1A6B3C] uppercase tracking-wider pl-1">Soil Type</label>
              <div className="relative group">
                <select 
                  className="w-full px-4 py-4 bg-[#F0F7F2] border-none rounded-2xl text-[#5C3D2E] font-bold appearance-none focus:ring-2 focus:ring-[#4CAF78] outline-none"
                  value={inputs.landType}
                  onChange={(e) => setInputs(prev => ({ ...prev, landType: e.target.value }))}
                >
                  {LAND_TYPES.map(l => (
                    <option key={l.id} value={l.id}>{l.icon} {l.name} {l.desc}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5C3D2E]/40 pointer-events-none" size={18} />
              </div>
            </div>
          </div>
        </motion.section>

        {/* 4. LIVE CLIMATE STRIP */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <ClimateStrip lat={inputs.lat} lon={inputs.lon} meteoData={meteoData} setMeteoData={setMeteoData} />
        </motion.section>

        {/* 5. ACTION BUTTONS */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <button 
            onClick={handlePredict}
            disabled={loading}
            className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-[#1A6B3C] to-[#4CAF78] text-white rounded-full font-bold text-lg shadow-lg shadow-[#4CAF78]/30 hover:scale-105 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:scale-100"
          >
            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Settings className="hover:rotate-180 transition-transform duration-700" />}
            Analyze & Predict Yield
          </button>

          <button 
            onClick={handleSimulate}
            disabled={!apiData}
            className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-[#1B4F8A] to-[#3A78C4] text-white rounded-full font-bold text-lg shadow-lg shadow-[#1B4F8A]/30 hover:scale-105 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            <Sparkles className="animate-pulse" />
            Simulate Master Greenhouse
          </button>
        </motion.section>

        {/* 6 & 7. PANELS */}
        <AnimatePresence>
          {showYield && apiData && (
             <motion.section 
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: 'auto' }}
               exit={{ opacity: 0, height: 0 }}
               className="overflow-hidden"
             >
               <YieldPanel apiData={apiData} cropName={inputs.crop} />
             </motion.section>
          )}

          {showGreenhouse && apiData && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <GreenhousePanel apiData={apiData} cropName={inputs.crop} meteoData={meteoData} />
            </motion.section>
          )}
        </AnimatePresence>

        {/* 8. CROP CALENDAR */}
        <section className="pt-10">
           <CropCalendar crop={inputs.crop} />
        </section>

      </main>
    </div>
  );
}
