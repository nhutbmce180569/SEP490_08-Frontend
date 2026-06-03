#!/usr/bin/env python3
"""Add useTranslation and replace UI strings in StayHub page components."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "stayhub"
LOCALE_EN = ROOT / "src" / "i18n" / "locales" / "en"
LOCALE_VI = ROOT / "src" / "i18n" / "locales" / "vi"

TARGET_DIRS = [
    ROOT / "src/features/booking/pages",
    ROOT / "src/features/tour/pages",
    ROOT / "src/features/content/pages",
    ROOT / "src/features/voucher/pages",
    ROOT / "src/features/wishlist",
]

# namespace -> { key: (en, vi) }
NEW_KEYS: dict[str, dict[str, tuple[str, str]]] = {
    "booking": {},
    "tour": {},
    "content": {},
    "voucher": {},
    "common": {},
    "staff": {},
    "manager": {},
    "errors": {},
}

# Exact string replacements: "English text" -> "namespace.key"
# Order: longest strings first when applying
REPLACEMENTS: list[tuple[str, str]] = []


def slug_key(text: str, existing: set[str]) -> str:
    words = re.findall(r"[A-Za-z0-9]+", text.strip())
    if not words:
        base = "text"
    else:
        base = words[0].lower() + "".join(w.title() for w in words[1:])
        if len(base) > 48:
            base = base[:48]
    key = base
    n = 2
    while key in existing:
        key = f"{base}{n}"
        n += 1
    existing.add(key)
    return key


def register(namespace: str, en: str, vi: str | None = None) -> str:
    if vi is None:
        vi = en  # placeholder; update manually in batch
    existing = set(NEW_KEYS.get(namespace, {}).keys())
    key = slug_key(en, existing)
    NEW_KEYS.setdefault(namespace, {})[key] = (en, vi)
    full = f"{namespace}.{key}"
    REPLACEMENTS.append((en, full))
    return full


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def import_path(file: Path) -> str:
    rel = Path("contexts/LocaleContext.tsx").relative_to(file.parent)
    return "./" + str(rel).replace("\\", "/").removesuffix(".tsx")


def add_hook(content: str, rel_import: str) -> str:
    if "useTranslation" in content:
        return content

    lines = content.split("\n")
    last_import = 0
    for i, line in enumerate(lines):
        if line.startswith("import "):
            last_import = i

    lines.insert(last_import + 1, f'import {{ useTranslation }} from "{rel_import}";')

    # Find component function and add hook
    for i, line in enumerate(lines):
        m = re.match(
            r"^(export\s+(?:default\s+)?(?:const|function)\s+\w+|const\s+\w+\s*:\s*React\.FC)",
            line,
        )
        if m:
            # find opening brace
            for j in range(i, min(i + 5, len(lines))):
                if "=>" in lines[j] or line.startswith("export function") or "function " in lines[j]:
                    insert_at = j + 1
                    if "{" in lines[j]:
                        insert_at = j + 1
                    elif j + 1 < len(lines) and "{" in lines[j + 1]:
                        insert_at = j + 2
                    else:
                        insert_at = j + 1
                    # skip if next non-empty is already hook
                    for k in range(insert_at, min(insert_at + 3, len(lines))):
                        if lines[k].strip() and "useTranslation" not in lines[k]:
                            lines.insert(k, "  const { t } = useTranslation();")
                            return "\n".join(lines)
                    lines.insert(insert_at, "  const { t } = useTranslation();")
                    return "\n".join(lines)

    # fallback: after first export function body
    for i, line in enumerate(lines):
        if re.match(r"export (const|function) ", line):
            for j in range(i + 1, min(i + 4, len(lines))):
                if "{" in lines[j]:
                    lines.insert(j + 1, "  const { t } = useTranslation();")
                    return "\n".join(lines)
    return "\n".join(lines)


def apply_replacements(content: str) -> str:
    for en, key in sorted(REPLACEMENTS, key=lambda x: -len(x[0])):
        if en not in content:
            continue
        # Skip if already t(
        if f't("{key}")' in content or f"t('{key}')" in content:
            continue
        content = content.replace(f'"{en}"', f'{{t("{key}")}}')
        content = content.replace(f"'{en}'", f'{{t("{key}")}}')
        # JSX text nodes
        content = re.sub(
            rf"(?<=[>{{\s]){re.escape(en)}(?=[<\s}}])",
            f'{{t("{key}")}}',
            content,
        )
    return content


def merge_locale(namespace: str) -> None:
    for locale, suffix in [("en", ""), ("vi", ".vi")]:
        pass
    en_path = LOCALE_EN / f"{namespace}.json"
    vi_path = LOCALE_VI / f"{namespace}.json"
    en_data = load_json(en_path)
    vi_data = load_json(vi_path)
    for key, (en_val, vi_val) in NEW_KEYS.get(namespace, {}).items():
        if key not in en_data:
            en_data[key] = en_val
        if key not in vi_data:
            vi_data[key] = vi_val
    if NEW_KEYS.get(namespace):
        save_json(en_path, en_data)
        save_json(vi_path, vi_data)


def main() -> None:
    # Pre-register common keys used across pages
    common_vi = {
        "Cancel": "Hủy",
        "Save": "Lưu",
        "Delete": "Xóa",
        "Edit": "Sửa",
        "Create": "Tạo",
        "Update": "Cập nhật",
        "View": "Xem",
        "Back": "Quay lại",
        "Search": "Tìm kiếm",
        "Loading...": "Đang tải...",
        "Actions": "Thao tác",
        "Status": "Trạng thái",
        "Active": "Hoạt động",
        "Inactive": "Không hoạt động",
        "Pending": "Đang chờ",
        "Approved": "Đã duyệt",
        "Rejected": "Đã từ chối",
        "Yes": "Có",
        "No": "Không",
        "Submit": "Gửi",
        "Close": "Đóng",
        "Confirm": "Xác nhận",
        "Refresh": "Làm mới",
        "Try again": "Thử lại",
        "N/A": "Không có",
        "Name": "Tên",
        "Description": "Mô tả",
        "Date": "Ngày",
        "Action": "Thao tác",
        "Details": "Chi tiết",
        "Continue": "Tiếp tục",
        "Done": "Xong",
        "Required": "Bắt buộc",
        "Deactivate": "Vô hiệu hóa",
        "Activate": "Kích hoạt",
        "Male": "Nam",
        "Female": "Nữ",
        "Other": "Khác",
        "Gender": "Giới tính",
        "Quantity": "Số lượng",
        "Total": "Tổng",
        "Loading details...": "Đang tải chi tiết...",
        "Loading requests...": "Đang tải yêu cầu...",
        "Failed to load requests.": "Không thể tải yêu cầu.",
    }
    for en, vi in common_vi.items():
        register("common", en, vi)

    migrated: list[str] = []
    for target_dir in TARGET_DIRS:
        for file in sorted(target_dir.rglob("*.tsx")):
            rel_import = import_path(file)
            original = file.read_text(encoding="utf-8")
            updated = add_hook(original, rel_import)
            updated = apply_replacements(updated)
            if updated != original:
                file.write_text(updated, encoding="utf-8")
                migrated.append(str(file.relative_to(ROOT)))

    for ns in NEW_KEYS:
        merge_locale(ns)

    print(f"Migrated {len(migrated)} files")
    for f in migrated:
        print(f"  - {f}")


if __name__ == "__main__":
    main()
