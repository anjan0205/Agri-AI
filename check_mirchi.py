import subprocess, sys
result = subprocess.run(
    [sys.executable, 'crop_suitability_system.py'],
    capture_output=True, text=True, encoding='ascii', errors='replace',
    cwd=r'C:\Users\Panga Anjan\Desktop\Agri-ai'
)
full = result.stdout + result.stderr
# Print Scenario D section
printing = False
for line in full.split('\n'):
    if 'SCENARIO D' in line:
        printing = True
    if printing:
        print(line)
print('\n--- MIRCHI FOUND?', 'Mirchi' in full)
print('--- EXIT CODE:', result.returncode)
