const API_KEY = 'c0b358786b92d36bcabe7619f9be1535';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

export const fetchWeatherData = async (city) => {
  try {
    const response = await fetch(`${BASE_URL}?q=${city}&appid=${API_KEY}&units=metric`);
    if (!response.ok) {
      throw new Error('City not found');
    }
    const data = await response.json();
    
    // Extract atmospheric data
    const temp = data.main.temp;
    const humidity = data.main.humidity;
    const windSpeed = data.wind.speed * 3.6; // Convert m/s to km/h
    const clouds = data.clouds.all;
    
    // Estimate Rainfall (check for rain object)
    const rainfall = data.rain ? (data.rain['1h'] || data.rain['3h'] || 0) : 0;
    
    // Estimate Solar Radiation (W/m2)
    // Clear sky ~ 800-1000, Cloudy ~ 100-300
    const solarRad = Math.max(100, 950 - (clouds * 7.5) + (temp * 2));
    
    // Estimate Evapotranspiration (mm/day) - Simplified Hargreaves approximation
    // ET0 = 0.0023 * (Temp + 17.8) * 5 (rough constant for extraterrestrial rad and temp range)
    const evapo = (0.0023 * (temp + 17.8) * 6).toFixed(1);

    return {
      temperature: Math.round(temp),
      humidity: humidity > 60 ? 'high' : (humidity > 30 ? 'medium' : 'low'),
      humidityPct: humidity,
      rainfall: rainfall,
      windSpeed: Math.round(windSpeed),
      solarRad: Math.round(solarRad),
      evapo: parseFloat(evapo),
      cityName: data.name,
      country: data.sys.country
    };
  } catch (error) {
    console.error('Weather Fetch Error:', error);
    throw error;
  }
};
