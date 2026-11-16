#!/usr/bin/env python3
"""夜市小吃圖鑑：驗證內容 + 產生首頁索引。

唯一的內容來源是 content/foods/<slug>.md（開頭的 front matter + 四段內文）。
這支腳本會：
  1. 依 AGENTS.md 規則檢查每個 Markdown 檔
  2. 全部通過後，產生 data/foods.json（首頁與條目頁讀取用）

用法：
  python3 scripts/build.py          # 驗證 + 產生 data/foods.json
  python3 scripts/build.py --check  # 只驗證，不寫檔

只使用 Python 標準函式庫；GitHub Actions 每次部署前都會執行。
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content" / "foods"
OUTPUT = ROOT / "data" / "foods.json"

FIELDS = ["name", "en", "emoji", "category", "region",
          "price", "spicy", "tags", "summary", "added"]
CATEGORIES = {"鹹食", "甜食", "飲品", "炸物"}
TAGS = {"海鮮", "豬肉", "雞肉", "素食可", "煎炸", "燒烤", "湯品", "手拿", "排隊名物", "經典"}
SECTIONS = ["它是什麼", "怎麼吃最對味", "小故事", "逛夜市小提醒"]

errors: list[str] = []


def err(where: str, msg: str) -> None:
    errors.append(f"[{where}] {msg}")


def split_front_matter(text: str):
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", text.replace("\r", ""), re.S)
    if not m:
        return None, text
    meta = {}
    for line in m.group(1).splitlines():
        if not line.strip():
            continue
        key, sep, value = line.partition(":")
        if not sep:
            return None, text
        meta[key.strip()] = value.strip()
    return meta, m.group(2)


def check_meta(where: str, slug: str, meta: dict):
    keys = list(meta.keys())
    missing = [k for k in FIELDS if k not in meta]
    extra = [k for k in keys if k not in FIELDS]
    if missing:
        err(where, f"front matter 缺少欄位：{missing}")
    if extra:
        err(where, f"front matter 有不認得的欄位：{extra}")
    if missing:
        return None

    food = {"slug": slug, **{k: meta[k] for k in FIELDS}}
    food["tags"] = [t.strip() for t in re.split(r"[,，、]", meta["tags"]) if t.strip()]
    try:
        food["spicy"] = int(meta["spicy"])
    except ValueError:
        food["spicy"] = -1

    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", slug):
        err(where, "檔名（slug）必須是 kebab-case 小寫英文，例如 braised-pork-rice.md")
    if not food["name"] or not food["emoji"] or not food["region"]:
        err(where, "name / emoji / region 不可為空")
    if not re.fullmatch(r"[A-Z][A-Za-z]*( [A-Z][A-Za-z]*)*", food["en"]):
        err(where, "en 每個單字首字需大寫，只能有英文字母與空格")
    if food["category"] not in CATEGORIES:
        err(where, f"category 只能是 {sorted(CATEGORIES)}")
    if not re.fullmatch(r"\d+–\d+", food["price"]):
        err(where, "price 格式應為 最低–最高（中間是 en dash –），例如 60–90")
    if food["spicy"] not in (0, 1, 2, 3):
        err(where, "spicy 必須是 0–3 的整數")
    if not (1 <= len(food["tags"]) <= 3) or not set(food["tags"]) <= TAGS:
        err(where, f"tags 需 1–3 個且只能來自 {sorted(TAGS)}")
    if len(food["summary"]) > 30 or not food["summary"].endswith("。"):
        err(where, f"summary 需 30 字內且以「。」結尾（目前 {len(food['summary'])} 字）")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", food["added"]):
        err(where, "added 格式應為 YYYY-MM-DD")
    return food


def check_body(where: str, body: str) -> None:
    if re.search(r"^# ", body, re.M):
        err(where, "內文不可使用一級標題 #")
    if re.search(r"<[a-zA-Z/][^>]*>", body):
        err(where, "內文不可包含 HTML 標籤")
    if re.search(r"（(吃法|補充提醒|一句最重要|2–4 句)", body):
        err(where, "還留有範本的佔位文字")
    heads = re.findall(r"^## (.+)$", body, re.M)
    if heads != SECTIONS:
        err(where, f"二級標題需依序為 {SECTIONS}，目前為 {heads}")
        return
    parts = dict(zip(SECTIONS, re.split(r"^## .+$", body, flags=re.M)[1:]))
    for name, text in parts.items():
        if not text.strip():
            err(where, f"「{name}」段落不可空白")
    if not (2 <= len(re.findall(r"^- ", parts["怎麼吃最對味"], re.M)) <= 5):
        err(where, "「怎麼吃最對味」需 2–5 個 - 清單項目")
    if not parts["逛夜市小提醒"].strip().startswith(">"):
        err(where, "「逛夜市小提醒」需以 > 引用區塊開頭")


def main() -> int:
    check_only = "--check" in sys.argv
    foods = []
    for path in sorted(CONTENT.glob("*.md")):
        where = f"content/foods/{path.name}"
        meta, body = split_front_matter(path.read_text(encoding="utf-8"))
        if meta is None:
            err(where, "檔案開頭需要 --- 包起來的 front matter（見 templates/food-template.md）")
            continue
        food = check_meta(where, path.stem, meta)
        check_body(where, body)
        if food:
            foods.append(food)

    if errors:
        print(f"❌ 發現 {len(errors)} 個問題：")
        for e in errors:
            print("  -", e)
        return 1

    foods.sort(key=lambda f: (f["added"], f["slug"]))
    if not check_only:
        OUTPUT.parent.mkdir(exist_ok=True)
        OUTPUT.write_text(json.dumps(foods, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"📝 已產生 {OUTPUT.relative_to(ROOT)}")
    print(f"✅ All checks passed（{len(foods)} 道小吃）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
