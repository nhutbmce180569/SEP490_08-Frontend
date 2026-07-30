import re

files = [
    r'd:\PROJECT_AFTER_PREVIEW\FRONTEND\SEP490_08-Frontend\stayhub\src\features\social\tracking\components\ManagerScheduleMapFeed.tsx',
    r'd:\PROJECT_AFTER_PREVIEW\FRONTEND\SEP490_08-Frontend\stayhub\src\features\social\tracking\pages\ManagerLocationsPage.tsx'
]

pattern = re.compile(r't\("([^"]+)"\)\s*\|\|\s*"([^"]+)"')

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    new_content = pattern.sub(r't("\1", "\2")', content)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(new_content)
