#!/usr/bin/env python3
import re

# Read the file
with open('/app/frontend/src/App.js', 'r') as f:
    content = f.read()

# Replace optional chaining patterns
patterns = [
    # Replace obj?.method() with obj && obj.method()
    (r'(\w+)\.current\?\.([\w()]+)', r'\1.current && \1.current.\2'),
    # Replace obj?.prop with obj && obj.prop
    (r'(\w+)\?\.([\w]+)', r'\1 && \1.\2'),
    # Replace more complex patterns
    (r'error\.response\?\.([\w]+)', r'error.response && error.response.\1'),
    (r'user\?\.([\w]+)', r'user && user.\1'),
    (r'speechLanguages\.find\([^)]+\)\?\.([\w]+)', lambda m: m.group(0).replace('?.', ' && ' + m.group(0).split('?.')[0].split('(')[0] + '.')),
]

# Apply replacements
for pattern, replacement in patterns:
    if callable(replacement):
        content = re.sub(pattern, replacement, content)
    else:
        content = re.sub(pattern, replacement, content)

# Handle specific cases that need manual attention
content = content.replace('speechLanguages.find(l => l.code === speechLanguage)?.name', 
                         'speechLanguages.find(l => l.code === speechLanguage) && speechLanguages.find(l => l.code === speechLanguage).name')
content = content.replace('speechLanguages.find(l => l.code === speechLanguage)?.flag', 
                         'speechLanguages.find(l => l.code === speechLanguage) && speechLanguages.find(l => l.code === speechLanguage).flag')

# Write back
with open('/app/frontend/src/App.js', 'w') as f:
    f.write(content)

print("Optional chaining operators have been replaced")