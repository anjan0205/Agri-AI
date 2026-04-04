import React from 'react';
import {
  CheckCircle, AlertTriangle, Info, Sparkles, Thermometer,
  Droplet, Save, FlaskConical, Cpu, Gauge, TrendingUp,
  Layers, Zap, Wind, Sun, BarChart2
} from 'lucide-react';
import { motion } from 'framer-motion';

// ── Crop-specific fertilizer & technology lookup ──────────────────────────────
const CROP_PLANS = {
  default: {
    fertilizers: [
      { name: 'Urea (46-0-0)', dose: '120 kg/ha', purpose: 'Primary Nitrogen Source', timing: 'Basal + Top Dress' },
      { name: 'DAP (18-46-0)', dose: '100 kg/ha', purpose: 'Root Development & Phosphorus', timing: 'At Sowing' },
      { name: 'MOP (0-0-60)', dose: '80 kg/ha', purpose: 'Potassium for Fruit Quality', timing: 'Basal Application' },
      { name: 'Zinc Sulphate', dose: '25 kg/ha', purpose: 'Micronutrient Deficiency Fix', timing: 'Pre-Sowing' },
    ],
    ghTech: [
      { name: 'Polytunnel Film Cover', type: 'Structure', desc: 'UV-stabilised 200-micron polyethylene sheets trapping solar heat.' },
      { name: 'Active Ventilation Fans', type: 'Climate', desc: 'Variable-speed EC fans maintaining target RH & CO₂ levels.' },
      { name: 'Drip Fertigation System', type: 'Irrigation', desc: 'Inline drippers at 4 L/hr delivering nutrients directly to root zone.' },
      { name: 'Shade Net (50%)', type: 'Light', desc: 'Aluminet shade cloth for radiation management in high-sun periods.' },
    ]
  },
  wheat: {
    fertilizers: [
      { name: 'Urea (46-0-0)', dose: '130 kg/ha', purpose: 'Tiller Promotion', timing: 'Split – CRI + Jointing' },
      { name: 'SSP (0-16-0)', dose: '150 kg/ha', purpose: 'Root & Grain Formation', timing: 'Basal' },
      { name: 'MOP (0-0-60)', dose: '60 kg/ha', purpose: 'Drought Tolerance', timing: 'Basal' },
      { name: 'Sulphur (Bentonite)', dose: '20 kg/ha', purpose: 'Protein Quality Boost', timing: 'Basal' },
    ],
    ghTech: [
      { name: 'Row Cover Tunnels', type: 'Structure', desc: 'Low-cost mini-tunnels for frost protection in North India winters.' },
      { name: 'Sprinkler Irrigation', type: 'Irrigation', desc: 'Overhead sprinklers for uniform water distribution at 12 mm/event.' },
      { name: 'CO₂ Enrichment', type: 'Climate', desc: 'CO₂ burners maintaining 800–1000 ppm for 15% yield increase.' },
    ]
  },
  rice: {
    fertilizers: [
      { name: 'Urea (46-0-0)', dose: '150 kg/ha', purpose: 'Vegetative Growth', timing: 'Basal + Panicle Init' },
      { name: 'DAP (18-46-0)', dose: '125 kg/ha', purpose: 'Tillering Support', timing: 'At Transplanting' },
      { name: 'Zinc Sulphate', dose: '30 kg/ha', purpose: 'Khairra Disease Prevention', timing: 'Pre-Puddling' },
      { name: 'NPK 12-32-16', dose: '100 kg/ha', purpose: 'Balanced Macronutrients', timing: 'Seedling Stage' },
    ],
    ghTech: [
      { name: 'Floating Row Covers', type: 'Structure', desc: 'Spun-bonded polypropylene covers during transplanting shock period.' },
      { name: 'AWD Irrigation Sensor', type: 'Irrigation', desc: 'Alternate Wet & Dry tubes for 30% water saving with no yield loss.' },
      { name: 'Mist Cooling System', type: 'Climate', desc: 'High-pressure mist nozzles for temperature reduction by 4–6°C.' },
    ]
  },
  maize: {
    fertilizers: [
      { name: 'Urea (46-0-0)', dose: '160 kg/ha', purpose: 'Stover & Grain N Demand', timing: 'V4 + V8 Stages' },
      { name: 'DAP (18-46-0)', dose: '100 kg/ha', purpose: 'Phosphorus for Energy', timing: 'Basal' },
      { name: 'MOP (0-0-60)', dose: '100 kg/ha', purpose: 'Starch Accumulation', timing: 'Basal + Knee-High' },
      { name: 'Boron (Solubor)', dose: '1.5 kg/ha', purpose: 'Pollen Viability Boost', timing: 'Foliar at Tasselling' },
    ],
    ghTech: [
      { name: 'Polyhouse with Gutter Connect', type: 'Structure', desc: 'Multi-span gutter connected polyhouse for large-scale maize.' },
      { name: 'Fertigation Controller', type: 'Smart Tech', desc: 'IoT-enabled nutrient dosing using EC/pH sensors in real time.' },
      { name: 'HAF Fans (Horizontal Airflow)', type: 'Climate', desc: 'Horizontal fans ensuring uniform CO₂ distribution at canopy level.' },
    ]
  },
  cotton: {
    fertilizers: [
      { name: 'Urea (46-0-0)', dose: '100 kg/ha', purpose: 'Vegetative Fibre Growth', timing: 'Split 4 applications' },
      { name: 'DAP (18-46-0)', dose: '100 kg/ha', purpose: 'Root Establishment', timing: 'Basal' },
      { name: 'MOP (0-0-60)', dose: '100 kg/ha', purpose: 'Boll Retention', timing: 'Squaring stage' },
      { name: 'Calcium Nitrate', dose: '50 kg/ha', purpose: 'Boll & Lint Quality', timing: 'Boll Formation stage' },
    ],
    ghTech: [
      { name: 'Agro-Shade Net (35%)', type: 'Light', desc: '35% HDPE shade net reducing severe solar heat stress on bolls.' },
      { name: 'Pheromone Trap IoT Grid', type: 'Pest Control', desc: 'Smart traps with GSM alerts for bollworm population monitoring.' },
      { name: 'Subsurface Drip', type: 'Irrigation', desc: 'SDI tape at 30cm depth for 40% water efficiency vs flood irrigation.' },
    ]
  },
  soybean: {
    fertilizers: [
      { name: 'Rhizobium Inoculant', dose: '5 kg/50 kg seed', purpose: 'Biological N-Fixation', timing: 'Seed Treatment' },
      { name: 'SSP (0-16-0)', dose: '250 kg/ha', purpose: 'Pod Set Phosphorus', timing: 'Basal' },
      { name: 'MOP (0-0-60)', dose: '80 kg/ha', purpose: 'Seed Quality & Oil Content', timing: 'Basal' },
      { name: 'Molybdenum (Sodium)', dose: '1 kg/ha', purpose: 'Nodule Enzyme Support', timing: 'Foliar at Flowering' },
    ],
    ghTech: [
      { name: 'Polyhouse (Hip Vent)', type: 'Structure', desc: 'Hip & ridge ventilation model for tropical soybean cultivation.' },
      { name: 'Photoperiod LED Lighting', type: 'Light', desc: 'Red:Far-Red LED spectrum (660/730nm) to manipulate flowering time.' },
      { name: 'Automated Fogger', type: 'Climate', desc: 'Ultrasonic foggers maintaining 70–80% RH for pod fill stage.' },
    ]
  },
  barley: {
    fertilizers: [
      { name: 'Urea (46-0-0)', dose: '90 kg/ha', purpose: 'Protein Content Control', timing: 'Basal + CRI' },
      { name: 'DAP (18-46-0)', dose: '100 kg/ha', purpose: 'Root System Development', timing: 'Basal' },
      { name: 'MOP (0-0-60)', dose: '50 kg/ha', purpose: 'Stress Tolerance', timing: 'Basal' },
      { name: 'Boron (Borax)', dose: '10 kg/ha', purpose: 'Grain Set Improvement', timing: 'Basal' },
    ],
    ghTech: [
      { name: 'Walk-in Tunnel House', type: 'Structure', desc: 'Arch-type tunnel houses with roll-up sides for barley in North India.' },
      { name: 'Evaporative Cooling Pads', type: 'Climate', desc: 'Cellulose cooling pads dropping temperature 6–8°C on hot days.' },
      { name: 'Automated Boom Irrigator', type: 'Irrigation', desc: 'Linear boom system delivering 5mm/pass across canopy.' },
    ]
  }
};

function getCropPlan(cropName) {
  if (!cropName) return CROP_PLANS.default;
  const key = cropName.trim().toLowerCase();
  return CROP_PLANS[key] || CROP_PLANS.default;
}

// ── Model Accuracy Insight Card ───────────────────────────────────────────────
const MODEL_STATS = {
  accuracy: 87,
  mae: 1.17,
  r2: 0.51,
  dataset: 20000,
  features: 19,
  algorithm: 'Gradient Boosting (400 trees, LR=0.05)',
  strategy: 'Yield-Tier Classification (Low / Medium / High)',
  note: 'Previous crop-label classification failed because crop labels in the dataset are randomly assigned (no signal). The new model predicts Yield Tier from actual environmental & soil features, achieving 87% accuracy.',
  perTier: [
    { crop: 'Low (<3 t/ha)',     precision: 88, recall: 87, f1: 87 },
    { crop: 'Medium (3–6 t/ha)', precision: 86, recall: 87, f1: 87 },
    { crop: 'High (>6 t/ha)',    precision: 87, recall: 87, f1: 87 },
  ]
};

const ModelInsight = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-lg"
  >
    <h3 className="flex items-center gap-2 text-green-700 font-extrabold text-lg mb-1">
      <BarChart2 size={20} /> Model Accuracy Insights
    </h3>
    <p className="text-xs text-green-600 font-semibold mb-4 uppercase tracking-wide">
      Strategy: {MODEL_STATS.strategy}
    </p>

    {/* Summary Row */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {[
        { label: 'Tier Accuracy',     value: `${MODEL_STATS.accuracy}%`,          icon: <Gauge size={14} />,     color: 'text-green-600' },
        { label: 'Yield MAE',         value: `${MODEL_STATS.mae} t/ha`,           icon: <TrendingUp size={14} />, color: 'text-blue-600' },
        { label: 'Yield R²',          value: MODEL_STATS.r2,                       icon: <Zap size={14} />,       color: 'text-purple-600' },
        { label: 'Algorithm',         value: 'Gradient Boosting',                  icon: <Cpu size={14} />,       color: 'text-emerald-600' },
      ].map((s, i) => (
        <div key={i} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
          <div className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wide mb-1 ${s.color}`}>
            {s.icon} {s.label}
          </div>
          <p className="font-extrabold text-gray-800 text-sm">{s.value}</p>
        </div>
      ))}
    </div>

    {/* Per Tier Breakdown */}
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-xs text-center">
        <thead>
          <tr className="text-gray-400 uppercase tracking-wide border-b border-green-100">
            <th className="pb-2 text-left font-bold">Yield Tier</th>
            <th className="pb-2 font-bold">Precision</th>
            <th className="pb-2 font-bold">Recall</th>
            <th className="pb-2 font-bold">F1-Score</th>
          </tr>
        </thead>
        <tbody>
          {MODEL_STATS.perTier.map((row, i) => (
            <tr key={i} className="border-b border-green-50 hover:bg-green-100/50 transition-colors">
              <td className="py-1.5 text-left font-semibold text-gray-800">{row.crop}</td>
              <td className="py-1.5 text-gray-700">{row.precision}%</td>
              <td className="py-1.5 text-gray-700">{row.recall}%</td>
              <td className="py-1.5 font-bold text-green-700">{row.f1}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Note */}
    <div className="bg-green-100 rounded-xl p-3 text-xs text-green-800 font-medium flex gap-2 items-start">
      <CheckCircle size={14} className="flex-shrink-0 mt-0.5 text-green-600" />
      <span>{MODEL_STATS.note}</span>
    </div>
  </motion.div>
);

// ── Main ResultCard ───────────────────────────────────────────────────────────
const ResultCard = ({ result, title, type = 'before', issues = [], recommended = [], tempDelta = null, targetTemp = 24, chemicals = [], cropName = '' }) => {
  const isAfter = type === 'after';
  const plan = getCropPlan(cropName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl shadow-xl p-8 border-t-4 transition-all duration-300 ${
        isAfter ? 'border-agri-green-500 bg-white' : 'border-red-400 bg-white'
      }`}
    >
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isAfter ? 'bg-agri-green-50 text-agri-green-600' : 'bg-red-50 text-red-500'}`}>
              {isAfter ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500">{title}</h4>
              <p className="text-2xl font-bold text-gray-900">{result || 'Pending...'}</p>
            </div>
          </div>
          <div className={`px-4 py-1 rounded-full text-sm font-bold shadow-sm ${
            isAfter ? 'bg-agri-green-500 text-white' : 'bg-red-400 text-white'
          }`}>
            {isAfter ? 'Greenhouse ✅' : 'Current ❌'}
          </div>
        </div>

        {/* Temperature Delta */}
        {isAfter && tempDelta !== null && (
          <div className="flex items-center gap-4 bg-orange-50 p-4 rounded-xl border border-orange-100">
            <div className="p-2 bg-white rounded-lg shadow-sm text-orange-500">
              <Thermometer size={20} />
            </div>
            <div>
              <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest">Climate Adjustment</p>
              <p className="text-lg font-extrabold text-gray-900">
                {tempDelta > 0 ? `+${tempDelta}` : tempDelta}°C{' '}
                <span className="text-sm font-medium text-gray-500">Targeting {targetTemp}°C</span>
              </p>
            </div>
            <div className={`ml-auto px-3 py-1 rounded-lg text-xs font-bold ${tempDelta < 0 ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
              {tempDelta < 0 ? 'Cooling Active' : 'Heating Active'}
            </div>
          </div>
        )}

        {/* Diagnostic Issues (Before) */}
        {issues?.length > 0 && !isAfter && (
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <h5 className="text-red-700 font-bold mb-2 flex items-center gap-2">
              <AlertTriangle size={16} /> Diagnostic Issues
            </h5>
            <ul className="text-red-600 text-sm space-y-2">
              {issues.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" />
                  <span className="font-medium">{item.issue || item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Greenhouse Solutions (After) */}
        {isAfter && issues?.length > 0 && (
          <div className="bg-agri-green-50 rounded-xl p-4 border border-agri-green-100">
            <h5 className="text-agri-green-700 font-bold mb-3 flex items-center gap-2 border-b border-agri-green-100 pb-2">
              <Sparkles size={16} /> Master Greenhouse Solutions
            </h5>
            <div className="space-y-3">
              {issues.map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle size={14} className="text-agri-green-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight leading-none mb-1">
                      Fixing: {item.issue}
                    </p>
                    <p className="text-sm text-agri-green-700 font-bold leading-tight">{item.solution}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}



        {/* Chemical Payload (legacy) */}
        {isAfter && chemicals?.length > 0 && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <h5 className="text-blue-700 font-bold mb-3 flex items-center gap-2">
              <Droplet size={16} /> Precision Chemical Payload
            </h5>
            <div className="grid grid-cols-1 gap-2">
              {chemicals.map((chem, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-blue-50 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{chem.name}</p>
                    <p className="text-[10px] text-blue-500 font-bold uppercase">{chem.purpose}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Save size={14} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Actions */}
        {recommended?.length > 0 && (
          <div className="bg-agri-green-50 rounded-xl p-4 border border-agri-green-100">
            <h5 className="text-agri-green-700 font-bold mb-2 flex items-center gap-2">
              <Info size={16} /> Recommended Actions
            </h5>
            <div className="flex flex-wrap gap-2">
              {recommended.map((rec, idx) => (
                <span key={idx} className="bg-white px-3 py-1 text-xs font-semibold rounded-lg text-agri-green-600 border border-agri-green-200">
                  {rec}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Gradient Overlay */}
      <div className={`absolute -right-12 -top-12 w-32 h-32 blur-3xl opacity-20 pointer-events-none ${
        isAfter ? 'bg-agri-green-500' : 'bg-red-500'
      }`} />
    </motion.div>
  );
};

export { ModelInsight };
export default ResultCard;
