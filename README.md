<div align="center">
  <a href="http://localhost:5173" target="_blank">
    <img src="https://img.shields.io/badge/Status-Live_on_Localhost-4CAF78?style=for-the-badge&logo=react" alt="Run Locally" />
  </a>
  <img src="https://img.shields.io/badge/Frontend-React%20%7C%20Tailwind-1B4F8A?style=for-the-badge&logo=react" alt="Frontend" />
  <img src="https://img.shields.io/badge/Backend-Python%20Flask-E8A838?style=for-the-badge&logo=python" alt="Backend" />
  <br/><br/>
  <h1>🌱 Agri-AI: Precision Agriculture Ecosystem</h1>
  <p><strong>A Next-Generation, Data-Driven Cultivation Dashboard</strong></p>
</div>

<br />

Agri-AI is an ultra-premium, full-stack predictive interface designed for modern precision agriculture. By bridging real-time satellite telemetry with a rigorous Python-based deterministic ML engine, Agri-AI enables unparalleled crop forecasting, dynamic yield mapping, and hyper-local closed-environment (Greenhouse) simulations.

Built to win—combining a stunning organic-glassmorphism aesthetic with deeply functional mathematical modeling.

---

## 🚀 The AI Arsenal (Key Features)

* **📡 Live Satellite Telemetry (`Live Climate Strip`)**  
  Instantly pings Open-Meteo remote sensing APIs based on exact regional geolocation matrices to aggregate live Temp, Hum, Radiation, and Wind Speed without backend latency.
* **🧠 Smart Cultivation AI**  
  A robust Python backend dynamically calculates aggregated suitability architectures across 14 diverse crops (Wheat, Tomato, Sorghum, Cotton, etc.) against hyper-localized soil mapping.
* **📊 Live Yield Diagnostics (`Chart.js`)**  
  Maps projected yields natively across beautiful, responsive Chart.js interfaces, directly contrasting 5-year averages against your current micro-climate conditions.
* **🎛️ Mastermind Greenhouse Simulator**  
  A dedicated futuristic control center. Manipulate atmospheric sliders (CO2, Artificial Light, Temperature) and watch an instantaneous React Mathematical algorithm output your Projected Yield Boost percentage. 
* **🧪 AI Fertilization Intel**  
  Our backend generates strict, quantified chemical fixes (N-P-K deficit models) outlining exactly when and how much fertilizer (e.g., Urea, DAP, MOP) your system requires to repair detected deviances.

---

## 💻 Technical Blueprint

### 🎨 Frontend Architecture
* **Framework:** React + Vite (`npm run dev`)
* **Styling:** Tailwind CSS (Custom Dark/Mist Glassmorphism, heavily modified styling variables)
* **Typography:** Core Google Fonts (`Playfair Display`, `DM Sans`)
* **Visualization:** Chart.js + `react-chartjs-2`
* **Icons:** Lucide React

### ⚙️ Backend Neural Engine
* **Serverless API:** Python Flask (`api.py`) running asynchronously on port 5000.
* **Logic Handlers:** Deterministic Crop/Soil feature mapping utilizing heavily optimized python matrix structures.
* **Data Integration:** JSON Payloads mapping frontend raw weather injections straight into the suitability rating modules.

---

## ⚡ Live Execution Playbook (Run Locally)

Execute this project flawlessly on any local development machine by following these deployment protocols:

### Step 1: Clone the Core Architecture
Pull the codebase locally onto your machine.
```bash
git clone https://github.com/anjan0205/Agri-AI.git
cd Agri-AI
```

### Step 2: Ignite the Python ML Backend
Open your terminal and initialize the brain of the ecosystem.
```bash
# 1. Open your terminal in the Agri-AI folder
# 2. Install the necessary Python data science libraries
pip install Flask flask-cors pandas scikit-learn numpy joblib requests

# 3. Ignite the API engine
python api.py
```
> ✅ **Terminal Check:** You should see `Running on http://127.0.0.1:5000`

### Step 3: Launch the React Dashboard
Open a **second, separate terminal window** (keep the Python terminal running in the back).
```bash
# 1. Install all frontend UI dependencies
npm install

# 2. Deploy the local development server
npm run dev
```
> ✅ **Success:** The terminal will output `Local: http://localhost:5173/`. Hold `Ctrl`/`Cmd` and click that link to launch Agri-AI in your browser!

---

## 🧭 User Navigation Guide

Once the application is running (or you navigate to the live URL), follow these steps to explore the platform:

### 1. Global Reconnaissance (Main Dashboard)
* **Check Live Climate:** Look at the top "Live Climate Strip". It pings your IP/Region to pull real-time weather data.
* **Review Soil Intel:** The sidebar on the left displays the default soil analysis parameters.

### 2. Crop Prediction Engine
* **Select Region/Soil:** Use the dropdown inputs or rely on the defaults.
* **Hit 'Run Cultivation Analysis':** Click the central action button. The Python neural engine will calculate and render the top optimal crops for those specific conditions.
* **Analyze Yield vs Market:** Scroll through the results to see projected yields, confidence scores, and current market values.

### 3. Mastermind Greenhouse (Advanced Simulation)
* **Open the Greenhouse:** Click the **"Open Mastermind Simulator"** button or select the Greenhouse tab.
* **Tweak the Variables:** Use the futuristic sliders to manipulate **CO2 Concentration**, **Artificial Light**, and **Temperature**.
* **Watch Real-Time Analytics:** The platform will instantly calculate the "Projected Yield Boost" percentage across different variables and identify any required Chemical Fixes (Nitrogen/Phosphorus adjustments).

### 4. Interactive Data Visualizations
* **Chart Interactions:** Hover over the 'Yield vs Timeline' Chart.js graphs to compare your personalized projected growth against 5-year historical averages.

## 🎨 Design Philosophy

Agri-AI diverges heavily from the standard "admin panel" aesthetic and embraces an **Editorial-Premium Aesthetic**. 

We leveraged Earthy palettes (`#1A6B3C` Forest Greens, `#E8A838` Amber Harvests, `#1B4F8A` Deep Water) against pristine white translucent frosted-glass backgrounds. Every pixel operates under smooth transition animations rendering data not just readable, but undeniably impressive. 

> *“Precision agriculture meets Nature magazine editorial.”*
