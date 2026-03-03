import os

replacements = {
    'Hawthorn': 'Hawthorn',
    'Hawthorn': 'Hawthorn',
    'hfc': 'hfc',
    'HFC': 'HFC',
    'Hawks': 'Hawks',
    'Hawk': 'Hawk',
    'hawk': 'hawk',
    'The Nest': 'The Nest',
    'HawkChat': 'HawkChat',
    'Hawk Ai': 'Hawk Ai',
    'Hawk AI': 'Hawk AI',
    'Hawk': 'Hawk',
    'hawk': 'hawk',
    'Brown': 'Brown',
    'brown': 'brown',
    'Brown': 'Brown',
    'brown': 'brown',
    'Gold': 'Gold',
    'gold': 'gold'
}

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        return
    
    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {filepath}')

base_dir = r'c:\\Users\\BillCarlin\\OneDrive - INTELIA PTY LTD\\Documents\\Hawthorn'

for root, dirs, files in os.walk(base_dir):
    # skip node_modules, .git, __pycache__, dist
    dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', '__pycache__', 'dist', '.env']]
    for file in files:
        if file.endswith(('.png', '.jpg', '.jpeg', '.woff', '.woff2', '.ttf', '.eot')):
            continue
        process_file(os.path.join(root, file))
