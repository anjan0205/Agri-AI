import pandas as pd
import numpy as np

df = pd.read_csv(r"C:\Users\Panga Anjan\Desktop\reduced_crop_dataset_20000.csv")

f = open("diag2.txt", "w")

# Check yield
f.write("=== YIELD PER CROP ===\n")
f.write(df.groupby('Crop')['Yield_tons_per_hectare'].agg(['mean','std','min','max']).round(3).to_string())

# Check Days_to_Harvest per Crop
f.write("\n\n=== DAYS_TO_HARVEST PER CROP ===\n")
f.write(df.groupby('Crop')['Days_to_Harvest'].agg(['mean','std','min','max']).round(3).to_string())

# Check if Fertilizer_Used correlates with Crop
f.write("\n\n=== FERTILIZER_USED x CROP ===\n")
ct = pd.crosstab(df['Fertilizer_Used'], df['Crop'])
f.write((ct.div(ct.sum(axis=1), axis=0) * 100).round(1).to_string())

# Binary columns
f.write("\n\n=== GREENHOUSE_POSSIBLE per Crop ===\n")
f.write(df.groupby('Crop')['greenhouse_possible'].mean().round(3).to_string())

f.write("\n\n=== IRRIGATION per Crop ===\n")
f.write(df.groupby('Crop')['irrigation'].mean().round(3).to_string())

# Check all column dtypes
f.write("\n\n=== ALL DTYPES ===\n")
f.write(str(df.dtypes))

f.close()
print("Written to diag2.txt")
