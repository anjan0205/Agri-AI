import React from 'react';

export default function CropCalendar({ crop }) {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const currentMonthIdx = new Date().getMonth();
  
  return (
    <div className="mb-20">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-bold serif-text mb-2 uppercase tracking-tight">Seasonal Crop Cycle</h2>
          <p className="text-on-surface-variant font-medium">Strategic temporal mapping for optimized {crop || 'regional'} harvest</p>
        </div>
        <div className="flex items-center gap-2 bg-primary-fixed px-4 py-2 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span className="text-sm font-bold text-on-primary-fixed uppercase tracking-widest">Active Season</span>
        </div>
      </div>

      <div className="relative overflow-x-auto pb-10 custom-scrollbar">
        <div className="min-w-[1000px] flex flex-col gap-8">
          <div className="grid grid-cols-12 gap-1 px-4">
            {months.map((m, i) => (
              <div key={m} className={`text-center font-bold text-xs ${i === currentMonthIdx ? 'text-primary' : 'text-primary/40'}`}>
                {m}
              </div>
            ))}
          </div>
          
          <div className="relative h-20 bg-surface-container-high rounded-full overflow-hidden flex items-stretch border-[6px] border-surface-container-high shadow-inner">
            <div className="w-[16.6%] bg-secondary-fixed flex items-center justify-center text-xs font-bold text-on-secondary-fixed-variant uppercase tracking-widest rounded-l-full">Sowing</div>
            <div className="w-[33.3%] bg-primary flex items-center justify-center text-xs font-bold text-white uppercase tracking-widest">Growth Phase</div>
            <div className="w-[25%] bg-tertiary-fixed flex items-center justify-center text-xs font-bold text-on-tertiary-fixed-variant uppercase tracking-widest">Harvest</div>
            <div className="w-[25.1%] bg-surface-variant flex items-center justify-center text-xs font-bold text-on-surface-variant uppercase tracking-widest rounded-r-full">Zaid Crop</div>
            
            {/* Playhead */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white/60 backdrop-blur-sm z-10 shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-1000"
              style={{ left: `${(currentMonthIdx / 12) * 100}%` }}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-white px-3 py-1 rounded text-[10px] font-bold">NOW</div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-8">
            <TimelineInfo icon="spa" title="Sowing Strategy" color="text-secondary" desc="Precision-seeded techniques with bio-fertilizer coating for enhanced root development and early vigor." />
            <TimelineInfo icon="monitoring" title="Growth Analytics" color="text-primary" desc="AI-guided irrigation scheduling and nitrogen monitoring via regional multispectral satellite indices." />
            <TimelineInfo icon="inventory_2" title="Harvest Window" color="text-tertiary" desc="Optimizing peak biological maturity and crop moisture levels to ensure premium Mandi quality grading." />
            <TimelineInfo icon="restore" title="Soil Health" color="text-on-surface-variant" desc="Implementation of green manure and nitrogen-fixing cover crops to restore organic matter levels." />
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineInfo({ icon, title, color, desc }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={`material-symbols-outlined ${color} text-sm`}>{icon}</span>
        <h4 className="font-bold text-sm">{title}</h4>
      </div>
      <p className="text-xs text-on-surface-variant leading-relaxed">{desc}</p>
    </div>
  );
}
