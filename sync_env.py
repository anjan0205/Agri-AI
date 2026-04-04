import pandas as pd

DATASET_PATH = r"C:\Users\Panga Anjan\Desktop\reduced_crop_dataset_20000.csv"
ENV_PATH = r"C:\Users\Panga Anjan\Desktop\Agri-ai\env"

df = pd.read_csv(DATASET_PATH)

# Categorical
regions  = ",".join(sorted(df['Region'].astype(str).unique()))
soils    = ",".join(sorted(df['Soil_Type'].astype(str).unique()))
crops    = ",".join(sorted(df['Crop'].astype(str).unique()))
weather  = ",".join(sorted(df['Weather_Condition'].astype(str).unique()))
soil_det = ",".join(sorted(df['soil_type'].astype(str).unique()))

# Default values (first item from sorted unique for categoricals)
def_region  = sorted(df['Region'].unique())[0]
def_soil    = sorted(df['Soil_Type'].unique())[0]
def_crop    = sorted(df['Crop'].unique())[0]
def_weather = sorted(df['Weather_Condition'].unique())[0]
def_soil_d  = sorted(df['soil_type'].unique())[0]

# Numeric stats
def stats(col):
    return df[col].min(), df[col].max(), round(df[col].mean(), 4)

r_mm_min, r_mm_max, r_mm_mean = stats('Rainfall_mm')
tc_min,   tc_max,   tc_mean   = stats('Temperature_Celsius')
dth_min,  dth_max,  dth_mean  = stats('Days_to_Harvest')
yld_min,  yld_max,  yld_mean  = stats('Yield_tons_per_hectare')
tmp_min,  tmp_max,  tmp_mean  = stats('temperature')
hum_min,  hum_max,  hum_mean  = stats('humidity')
rnf_min,  rnf_max,  rnf_mean  = stats('rainfall')
ws_min,   ws_max,   ws_mean   = stats('wind_speed')
sr_min,   sr_max,   sr_mean   = stats('solar_radiation')
et_min,   et_max,   et_mean   = stats('evapotranspiration')
ph_min,   ph_max,   ph_mean   = stats('soil_ph')
n_min,    n_max,    n_mean    = stats('nitrogen')
p_min,    p_max,    p_mean    = stats('phosphorus')
k_min,    k_max,    k_mean    = stats('potassium')
wa_min,   wa_max,   wa_mean   = stats('water_availability')

total = len(df)

env_content = f"""# ============================================================
# CROP DATASET ENVIRONMENT CONFIGURATION
# Generated from: reduced_crop_dataset_20000.csv
# Dataset Path  : {DATASET_PATH}
# Total Records : {total}
# ============================================================

# --- Dataset Path (absolute) ---
DATASET_PATH={DATASET_PATH}

# --- Categorical Fields ---
# Allowed values shown as comma-separated options

# Options: {regions}
REGION={def_region}

# Options: {soils}
SOIL_TYPE={def_soil}

# Options: {crops}
CROP={def_crop}

# Options: {weather}
WEATHER_CONDITION={def_weather}

# Options: {soil_det}
SOIL_TYPE_DETAIL={def_soil_d}

# --- Boolean / Binary Fields (0 or 1) ---

FERTILIZER_USED=false
IRRIGATION_USED=false
IRRIGATION=0
GREENHOUSE_POSSIBLE=0

# --- Numeric Fields ---
# Default = dataset mean, Min/Max from dataset

# Min={round(r_mm_min,4)}, Max={round(r_mm_max,4)}
RAINFALL_MM={r_mm_mean}

# Min={round(tc_min,4)}, Max={round(tc_max,4)}
TEMPERATURE_CELSIUS={tc_mean}

# Min={round(dth_min,4)}, Max={round(dth_max,4)}
DAYS_TO_HARVEST={dth_mean}

# Min={round(yld_min,4)}, Max={round(yld_max,4)}
YIELD_TONS_PER_HECTARE={yld_mean}

# Min={round(tmp_min,4)}, Max={round(tmp_max,4)}
TEMPERATURE={tmp_mean}

# Min={round(hum_min,4)}, Max={round(hum_max,4)}
HUMIDITY={hum_mean}

# Min={round(rnf_min,4)}, Max={round(rnf_max,4)}
RAINFALL={rnf_mean}

# Min={round(ws_min,4)}, Max={round(ws_max,4)}
WIND_SPEED={ws_mean}

# Min={round(sr_min,4)}, Max={round(sr_max,4)}
SOLAR_RADIATION={sr_mean}

# Min={round(et_min,4)}, Max={round(et_max,4)}
EVAPOTRANSPIRATION={et_mean}

# Min={round(ph_min,4)}, Max={round(ph_max,4)}
SOIL_PH={ph_mean}

# Min={round(n_min,4)}, Max={round(n_max,4)}
NITROGEN={n_mean}

# Min={round(p_min,4)}, Max={round(p_max,4)}
PHOSPHORUS={p_mean}

# Min={round(k_min,4)}, Max={round(k_max,4)}
POTASSIUM={k_mean}

# Min={round(wa_min,4)}, Max={round(wa_max,4)}
WATER_AVAILABILITY={wa_mean}

# --- Model & App Configuration ---

MODEL_TYPE=RandomForestClassifier
N_ESTIMATORS=500
TEST_SIZE=0.10
RANDOM_STATE=42
GH_TOLERANCE=0.10
NPK_DEFICIENCY_THRESHOLD=0.85
"""

with open(ENV_PATH, 'w') as f:
    f.write(env_content)

print(f"env file updated successfully at: {ENV_PATH}")
print(f"Total records used: {total}")
print(f"Regions: {regions}")
print(f"Crops: {crops}")
