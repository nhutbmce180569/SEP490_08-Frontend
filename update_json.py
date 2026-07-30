import json

en_file = r'd:\PROJECT_AFTER_PREVIEW\FRONTEND\SEP490_08-Frontend\stayhub\src\i18n\locales\en\social.json'
vi_file = r'd:\PROJECT_AFTER_PREVIEW\FRONTEND\SEP490_08-Frontend\stayhub\src\i18n\locales\vi\social.json'

def update_json(filepath, new_data):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    data.update(new_data)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')

update_json(en_file, {
    "gettingLocation": "Getting your location to generate route...",
    "locationError": "Unable to get your location. Please grant location permissions."
})

update_json(vi_file, {
    "gettingLocation": "Đang lấy vị trí của bạn để dẫn đường...",
    "locationError": "Không thể lấy vị trí của bạn. Vui lòng cấp quyền vị trí."
})
