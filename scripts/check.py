#!/usr/bin/env python3
"""驗證夜市小吃圖鑑的內容是否符合 AGENTS.md 規則。

用法：python3 scripts/check.py
通過時輸出「✅ All checks passed」，否則列出所有錯誤並以 exit code 1 結束。
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "foods.json"
CONTENT = ROOT / "content" / "foods"

FIELDS = ["slug", "name", "en", "emoji", "category", "region",
          "price", "spicy", "tags", "summary", "added"]
CATEGORIES = {"鹹食", "甜食", "飲品", "炸物"}
TAGS = {"海鮮", "豬肉", "雞肉", "素食可", "煎炸", "燒烤", "湯品", "手拿", "排隊名物", "經典"}
SECTIONS = ["它是什麼", "怎麼吃最對味", "小故事", "逛夜市小提醒"]

errors: list[str] = []


def err(where: str, msg: str) -> None:
    errors.append(f"[{where}] {msg}")


def check_entry(i: int, food: dict, seen: set) -> None:
    where = f"foods.json #{i} {food.get('slug', '?')}"
    if list(food.keys()) != FIELDS:
        err(where, f"欄位或順序不符，應為 {FIELDS}")
    slug = food.get("slug", "")
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", slug):
        err(where, "slug 必須是 kebab-case 小寫英文")
    if slug in seen:
        err(where, "slug 重複")
    seen.add(slug)
    if not re.fullmatch(r"[A-Z][A-Za-z]*( [A-Z][A-Za-z]*)*", food.get("en", "")):
        err(where, "en 每個單字首字需大寫，只能有英文字母")
    if food.get("category") not in CATEGORIES:
        err(where, f"category 只能是 {sorted(CATEGORIES)}")
    if not re.fullmatch(r"\d+–\d+", food.get("price", "")):
        err(where, "price 格式應為 最低–最高（en dash）")
    if food.get("spicy") not in (0, 1, 2, 3):
        err(where, "spicy 必須是 0–3 的整數")
    tags = food.get("tags", [])
    if not (1 <= len(tags) <= 3) or not set(tags) <= TAGS:
        err(where, f"tags 需 1–3 個且只能來自 {sorted(TAGS)}")
    summary = food.get("summary", "")
    if len(summary) > 30 or not summary.endswith("。"):
        err(where, f"summary 需 30 字內且以「。」結尾（目前 {len(summary)} 字）")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", food.get("added", "")):
        err(where, "added 格式應為 YYYY-MM-DD")
    if not food.get("name") or not food.get("emoji") or not food.get("region"):
        err(where, "name / emoji / region 不可為空")
    if not (CONTENT / f"{slug}.md").exists():
        err(where, f"找不到 content/foods/{slug}.md")


def check_markdown(path: Path, slugs: set) -> None:
    where = f"content/foods/{path.name}"
    if path.stem not in slugs:
        err(where, "foods.json 中沒有對應的 slug")
    text = path.read_text(encoding="utf-8")
    if re.search(r"^# ", text, re.M):
        err(where, "不可使用一級標題 #")
    if re.search(r"<[a-zA-Z/][^>]*>", text):
        err(where, "不可包含 HTML 標籤")
    if "（" in text and re.search(r"（(吃法|補充提醒|一句最重要|2–4 句)", text):
        err(where, "還留有範本的佔位文字")
    heads = re.findall(r"^## (.+)$", text, re.M)
    if heads != SECTIONS:
        err(where, f"二級標題需依序為 {SECTIONS}，目前為 {heads}")
        return
    parts = dict(zip(SECTIONS, re.split(r"^## .+$", text, flags=re.M)[1:]))
    if not (3 <= len(re.findall(r"^- ", parts["怎麼吃最對味"], re.M)) <= 5):
        err(where, "「怎麼吃最對味」需 3–5 個 - 清單項目")
    if not parts["逛夜市小提醒"].strip().startswith(">"):
        err(where, "「逛夜市小提醒」需以 > 引用區塊開頭")
    body_len = len(re.sub(r"\s|[#>\-]", "", text))
    if not (200 <= body_len <= 650):
        err(where, f"全文長度約 {body_len} 字，建議 250–500 字")


def main() -> int:
    try:
        foods = json.loads(DATA.read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001
        print(f"❌ 無法解析 data/foods.json：{e}")
        return 1
    seen: set = set()
    for i, food in enumerate(foods):
        check_entry(i, food, seen)
    for md in sorted(CONTENT.glob("*.md")):
        check_markdown(md, seen)

    if errors:
        print(f"❌ 發現 {len(errors)} 個問題：")
        for e in errors:
            print("  -", e)
        return 1
    print(f"✅ All checks passed（{len(foods)} 道小吃）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
