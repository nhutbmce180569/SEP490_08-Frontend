#!/usr/bin/env python3
"""Batch-add useTranslation import and hook to tour pages missing i18n."""
import re
from pathlib import Path

PAGES = Path(__file__).resolve().parents[1] / "stayhub/src/features/tour/pages"
IMPORT_LINE = 'import { useTranslation } from "../../../contexts/LocaleContext";\n'
HOOK_LINE = "  const { t } = useTranslation();\n"

FILES = [
    "TourScheduleDetail.tsx",
    "MyReviewsPage.tsx",
    "UpdateScheduleTicket.tsx",
    "UpdateScheduleItinerary.tsx",
    "UpdateItinerary.tsx",
    "TourScheduleList.tsx",
    "TourDetail.tsx",
    "CreateScheduleTicket.tsx",
    "CreateScheduleItinerary.tsx",
    "CreateItinerary.tsx",
    "CreateEditSchedule.tsx",
    "AssignedSchedulesPage.tsx",
    "DeleteScheduleTicket.tsx",
    "DashboardReviewManager.tsx",
    "DeleteScheduleItinerary.tsx",
    "CreateTour.tsx",
    "UpdateTour.tsx",
    "ScheduleDetail.tsx",
]


def ensure_i18n(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    if "useTranslation" in text:
        return
    # Insert import after last import block line before first non-import
    lines = text.splitlines(keepends=True)
    last_import = 0
    for i, line in enumerate(lines):
        if line.startswith("import "):
            last_import = i
    lines.insert(last_import + 1, IMPORT_LINE)
    text = "".join(lines)
    # Insert hook after component arrow/function open
    m = re.search(
        r"(export const \w+: React\.FC(?:<[^>]*>)? = \(\) => \{\n)(?!\s*const \{ t \})",
        text,
    )
    if not m:
        m = re.search(
            r"(const \w+: React\.FC[^=]*= \(\{[^}]*\}\) => \{\n)(?!\s*const \{ t \})",
            text,
        )
    if m:
        text = text[: m.end(1)] + HOOK_LINE + text[m.end(1) :]
    else:
        print(f"WARN: could not insert hook in {path.name}")
    path.write_text(text, encoding="utf-8")
    print(f"Updated imports/hook: {path.name}")


def main() -> None:
    for name in FILES:
        p = PAGES / name
        if p.exists():
            ensure_i18n(p)


if __name__ == "__main__":
    main()
