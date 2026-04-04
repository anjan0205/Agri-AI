import React from 'react';
import { Calendar } from 'lucide-react';

export default function CropCalendar({ crop }) {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonthIdx = new Date().getMonth();

  // Very simplified dataset for calendar timelines
  const calendars = {
    wheat: { sow: [10, 11], grow: [0, 1, 2], harvest: [3, 4] },
    rice: { sow: [5, 6], grow: [7, 8, 9], harvest: [10, 11] },
    maize: { sow: [5, 6], grow: [7, 8], harvest: [9, 10] },
    mirchi: { sow: [6, 7], grow: [8, 9, 10, 11, 0, 1], harvest: [2, 3, 4] },
    tomato: { sow: [5, 6], grow: [7, 8], harvest: [9, 10] },
    sugarcane: { sow: [0, 1], grow: [2, 3, 4, 5, 6, 7, 8, 9, 10], harvest: [11, 0] },
    potato: { sow: [9, 10], grow: [11, 0, 1], harvest: [2, 3] },
    onion: { sow: [10, 11], grow: [0, 1, 2], harvest: [3, 4] },
    peanut: { sow: [5, 6], grow: [7, 8], harvest: [9, 10] },
    cotton: { sow: [4, 5], grow: [6, 7, 8, 9], harvest: [10, 11] },
    soybean: { sow: [5, 6], grow: [7, 8], harvest: [9, 10] },
    sorghum: { sow: [5, 6], grow: [7, 8], harvest: [9, 10] },
    cabbage: { sow: [9, 10], grow: [11, 0], harvest: [1, 2] },
  };

  const schedule = calendars[crop] || calendars.wheat;

  const getStatus = (m) => {
    if (schedule.sow.includes(m)) return { status: 'Sowing Phase', color: 'bg-[#4CAF78]', text: 'text-white' };
    if (schedule.grow.includes(m)) return { status: 'Vegetative Growth', color: 'bg-[#A3D977]', text: 'text-[#1A6B3C]' };
    if (schedule.harvest.includes(m)) return { status: 'Harvest Ready', color: 'bg-[#E8A838]', text: 'text-white' };
    return { status: 'Fallow / Rest', color: 'bg-white', text: 'text-gray-400' };
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-[#D4C5A9]/40 rounded-3xl p-8 shadow-md">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-[#D4C5A9]/20 rounded-xl text-[#5C3D2E]">
          <Calendar size={20} />
        </div>
        <h3 className="text-2xl font-heading text-[#5C3D2E] font-bold">Annual Crop Architecture</h3>
      </div>

      <div className="overflow-x-auto custom-scrollbar pb-6 pl-1">
        <div className="flex gap-2 min-w-[900px]">
          {MONTHS.map((m, i) => {
            const { status, color, text } = getStatus(i);
            const isCurrent = i === currentMonthIdx;
            return (
              <div key={m} className={`flex-1 flex flex-col`}>
                <div className={`
                  p-4 h-24 rounded-2xl flex flex-col justify-end transition-all
                  ${color} ${isCurrent ? 'ring-2 ring-offset-2 ring-[#4CAF78] shadow-xl scale-[1.03] z-10' : 'border border-[#D4C5A9]/30'}
                `}>
                  <div className={`text-sm font-bold opacity-90 uppercase tracking-widest flex items-center justify-between ${text}`}>
                    <span>{m}</span>
                    {isCurrent && <span className="bg-white/30 text-white px-2 py-0.5 rounded-full text-[9px] tracking-wider animate-pulse">NOW</span>}
                  </div>
                  <div className={`font-medium text-xs leading-tight mt-1 ${text} opacity-90`}>{status}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-6 mt-6 justify-center">
        <div className="flex items-center gap-2 text-xs font-bold text-[#5C3D2E]"><span className="w-4 h-4 rounded-full bg-[#4CAF78]"></span> Sowing</div>
        <div className="flex items-center gap-2 text-xs font-bold text-[#5C3D2E]"><span className="w-4 h-4 rounded-full bg-[#A3D977]"></span> Growth</div>
        <div className="flex items-center gap-2 text-xs font-bold text-[#5C3D2E]"><span className="w-4 h-4 rounded-full bg-[#E8A838]"></span> Harvest</div>
        <div className="flex items-center gap-2 text-xs font-bold text-[#5C3D2E]"><span className="w-4 h-4 rounded-full bg-white border border-gray-300"></span> Fallow</div>
      </div>
    </div>
  );
}
