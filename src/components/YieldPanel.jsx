import React from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function YieldPanel({ apiData, cropName }) {
  if (!apiData || !apiData.suitability) return null;

  const score = apiData.suitability.score;
  const baseYield = {
    wheat: 35, rice: 40, maize: 45, cotton: 25, soybean: 30,
    barley: 30, mirchi: 20, tomato: 60, potato: 250, onion: 180,
    sugarcane: 800, sorghum: 28, cabbage: 400, peanut: 15
  }[cropName] || 40;

  const currentYield = baseYield * (score / 100);
  const optimalYield = baseYield;
  const avgYield = baseYield * 0.85;

  const data = {
    labels: ['Current Projected', 'Optimal Target', '5-Year Average'],
    datasets: [
      {
        label: 'Yield (Qnt/HA)',
        data: [currentYield, optimalYield, avgYield],
        backgroundColor: [
           score < 60 ? '#ef4444' : '#E8A838', // Current (Red if bad, harvest if okay)
          '#1A6B3C', // Optimal 
          '#D4C5A9'  // Average
        ],
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Yield Forecast Comparison',
        color: '#5C3D2E',
        font: { family: "'Playfair Display', serif", size: 18 }
      },
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  const features = apiData.suitability.feature_status;
  
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-[#D4C5A9]/40 rounded-3xl p-8 shadow-xl">
      <div className="pb-6 border-b border-[#D4C5A9]/20 mb-8">
        <h2 className="text-3xl font-heading text-[#1A6B3C] font-bold">Diagnostic Yield Analysis</h2>
        <p className="text-gray-500 font-medium">Base predictions factoring localized environmental anomalies.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* LEFT COLUMN: Chart */}
        <div className="bg-[#F0F7F2] p-6 rounded-2xl border border-[#D4C5A9]/30 shadow-inner h-[400px]">
          <Bar options={options} data={data} />
        </div>

        {/* RIGHT COLUMN: Diagnostic Scorecard */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between bg-gradient-to-r from-[#1A6B3C] to-[#4CAF78] p-6 rounded-2xl text-white shadow-lg shadow-[#1A6B3C]/20">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest opacity-80">Aggregate Suitability</p>
              <h3 className="text-4xl font-extrabold font-heading">{score} <span className="text-xl">/ 100</span></h3>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold font-heading">{apiData.suitability.verdict.split('-')[0].trim()}</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 max-h-[300px]">
            {Object.entries(features).map(([key, val]) => {
              const isCrit = val.status === 'CRITICAL';
              const isOk = val.status === 'IDEAL';
              return (
                <div key={key} className="flex items-start gap-4 p-4 rounded-xl bg-white border border-[#D4C5A9]/30 shadow-sm transition-transform hover:translate-x-1">
                  <div className={`mt-0.5 ${isCrit ? 'text-red-500' : isOk ? 'text-[#1A6B3C]' : 'text-[#E8A838]'}`}>
                    {isCrit ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-bold text-[#5C3D2E] capitalize">{key.replace('_', ' ')}</p>
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                        isCrit ? 'bg-red-100 text-red-600' : isOk ? 'bg-[#1A6B3C]/10 text-[#1A6B3C]' : 'bg-[#E8A838]/10 text-[#E8A838]'
                      }`}>
                        {val.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      Current: <span className="font-bold text-gray-700">{val.current}</span> | Target: {val.ideal}
                    </p>
                    {!isOk && (
                      <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                        Deviation: {val.deviation_pct}%
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
