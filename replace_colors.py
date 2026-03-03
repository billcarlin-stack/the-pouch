import os
import re

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        return
    
    # Replace blue-{number} with amber-{number} for tailwind classes
    new_content = re.sub(r'\bblue-(\d+)', r'amber-\1', content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {filepath}')

base_dir = r'c:\\Users\\BillCarlin\\OneDrive - INTELIA PTY LTD\\Documents\\Hawthorn\\frontend\\src'

for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.endswith(('.tsx', '.ts', '.css')):
            process_file(os.path.join(root, file))
