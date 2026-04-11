import React from 'react';

export default function ClimateStrip({ meteoData }) {
  if (!meteoData || !meteoData.current) return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 animate-pulse">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-surface-container-lowest p-6 rounded-2xl h-40"></div>
        ))}
    </div>
  );

  const current = meteoData.current;
  const currentRain = meteoData.daily?.precipitation_sum?.[0] || 0;
  // Convert MJ/m2 to rough w/m2 (for display aesthetics)
  const currentRad = (meteoData.daily?.shortwave_radiation_sum?.[0] || 0) * 11.57;

  const cards = [
    { 
        label: 'Temperature', 
        val: `${current.temperature_2m}°C`, 
        icon: 'thermostat', 
        progress: Math.min(100, (current.temperature_2m / 50) * 100) 
    },
    { 
        label: 'Humidity', 
        val: `${current.relative_humidity_2m}%`, 
        icon: 'humidity_percentage', 
        progress: current.relative_humidity_2m 
    },
    { 
        label: 'Solar Radiation', 
        val: `${Math.round(currentRad)} W/m²`, 
        icon: 'wb_sunny', 
        progress: Math.min(100, (currentRad / 1000) * 100) 
    },
    { 
        label: 'Rainfall', 
        val: `${currentRain.toFixed(1)} mm`, 
        icon: 'rainy', 
        progress: Math.min(100, (currentRain / 50) * 100) 
    },
    { 
        label: 'Wind Speed', 
        val: `${current.wind_speed_10m} km/h`, 
        icon: 'air', 
        progress: Math.min(100, (current.wind_speed_10m / 40) * 100) 
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
      {cards.map((card, i) => (
        <div key={i} className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_20px_40px_rgba(4,32,18,0.04)] group hover:translate-y-[-4px] transition-all">
          <span className="material-symbols-outlined text-primary mb-4 text-3xl">{card.icon}</span>
          <p className="text-sm font-medium text-on-surface-variant mb-1">{card.label}</p>
          <p className="text-2xl font-bold serif-text">{card.val}</p>
          <div className="mt-4 h-1 w-full bg-surface-variant rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000" 
              style={{ width: `${card.progress}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}
