import React from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function YieldPanel({ apiData, cropName }) {
  if (!apiData || !apiData.suitability) return null;

  const score = apiData.suitability.score;
  const baseYieldHA = {
    wheat: 35, rice: 40, maize: 45, cotton: 25, soybean: 30,
    barley: 30, mirchi: 20, tomato: 60, potato: 250, onion: 180,
    sugarcane: 800, sorghum: 28, cabbage: 400, peanut: 15
  }[cropName] || 40;

  const baseYield = baseYieldHA / 2.471; // Convert Hectare base to Acre base

  const currentYield = baseYield * (score / 100);
  const optimalYield = baseYield;
  const avgYield = baseYield * 0.85;

  const data = {
    labels: ['Current Projected', 'Optimal Target', '5-Year Average'],
    datasets: [
      {
        label: 'Yield (Qnt/Acre)',
        data: [currentYield, optimalYield, avgYield],
        backgroundColor: [
          score < 60 ? '#ba1a1a' : '#005129', // Error Color : Primary Color
          '#1a6b3c', // Primary Container
          '#bfc9be'  // Outline Variant
        ],
        borderRadius: 12,
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
        text: 'Production Variance Analysis',
        color: '#042012',
        font: { family: "'Noto Serif', serif", size: 20, weight: 'bold' }
      },
    },
    scales: {
      y: { 
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' }
      },
      x: {
        grid: { display: false }
      }
    }
  };

  const features = apiData.suitability.feature_status;
  
  return (
    <div className="bg-surface-container-low border border-outline-variant/10 rounded-[2rem] p-8 shadow-sm">
      <div className="pb-6 border-b border-outline-variant/20 mb-8">
        <h2 className="text-3xl font-bold serif-text text-primary italic">Diagnostic Yield Analysis</h2>
        <p className="text-on-surface-variant font-medium">Hyper-local forecasting utilizing regional environmental anomalies.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* LEFT COLUMN: Chart */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-inner h-[400px]">
          <Bar options={options} data={data} />
        </div>

        {/* RIGHT COLUMN: Diagnostic Scorecard */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between primary-gradient p-8 rounded-3xl text-white shadow-lg shadow-primary/20">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80 mb-2">Aggregate Suitability</p>
              <h3 className="text-5xl font-extrabold serif-text">{score}<span className="text-xl font-normal opacity-60 ml-1">/100</span></h3>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold serif-text italic">{apiData.suitability.verdict.split('-')[0].trim()}</div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-60 mt-1">Status Level</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 max-h-[280px]">
            {Object.entries(features).map(([key, val]) => {
              const status = val.status;
              const isCrit = status === 'CRITICAL';
              const isOk = status === 'IDEAL';
              return (
                <div key={key} className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10 shadow-sm transition-all hover:translate-x-1">
                  <span className={`material-symbols-outlined text-3xl ${
                      isCrit ? 'text-error' : isOk ? 'text-primary' : 'text-tertiary shadow-sm'
                    }`}>
                    {isCrit ? 'warning' : isOk ? 'verified' : 'info'}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <p className="font-bold text-on-surface capitalize leading-tight">{key.replace('_', ' ')}</p>
                      <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${
                        isCrit ? 'bg-error-container text-on-error-container' : isOk ? 'bg-surface-container-high text-primary' : 'bg-tertiary-fixed text-on-tertiary-fixed'
                      }`}>
                        {status}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant font-medium">
                      Current <span className="text-primary font-bold">{val.current}</span> | Required <span className="font-bold">{val.ideal}</span>
                    </p>
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
