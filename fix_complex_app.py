#!/usr/bin/env python3
import re

# Read the complex app file
with open('/app/frontend/src/App_complex.js', 'r') as f:
    content = f.read()

# Replace all optional chaining operators with safe alternatives
replacements = [
    # Replace obj?.prop with obj && obj.prop
    (r'(\w+)\?\.([\w]+)', r'\1 && \1.\2'),
    # Replace obj?.method() with obj && obj.method()
    (r'(\w+)\?\.([\w()]+)', r'\1 && \1.\2'),
    # Replace error.response?.status with error.response && error.response.status
    (r'error\.response\?\.([\w]+)', r'error.response && error.response.\1'),
    # Replace user?.name with user && user.name
    (r'user\?\.([\w]+)', r'user && user.\1'),
    # Replace fileInputRef.current?.click() with fileInputRef.current && fileInputRef.current.click()
    (r'fileInputRef\.current\?\.([\w()]+)', r'fileInputRef.current && fileInputRef.current.\1'),
]

# Apply replacements
for pattern, replacement in replacements:
    content = re.sub(pattern, replacement, content)

# Write fixed version
with open('/app/frontend/src/App.js', 'w') as f:
    f.write(content)

print("✅ Complex app fixed and restored!")