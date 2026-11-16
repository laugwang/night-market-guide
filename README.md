# 🏮 夜市小吃圖鑑 Night Market Field Guide

用「圖鑑卡片」介紹台灣夜市小吃的靜態網站。每道小吃都遵循同一套格式，並透過 [`AGENTS.md`](./AGENTS.md) 讓 AI 能依規則持續新增內容。

- 🌐 網站：https://laugwang.github.io/night-market-guide/
- 📘 AI 協作規則：[`AGENTS.md`](./AGENTS.md)（`CLAUDE.md` 指向它）

## 特色

- 純 HTML / CSS / 原生 JS，**零建置、零外部依賴**，直接跑在 GitHub Pages
- 首頁卡片牆、關鍵字搜尋、分類篩選，皆由 `data/foods.json` 自動產生
- 條目頁由 Markdown 渲染，固定四段結構
- 深色模式、手機版排版
- `scripts/check.py` 自動驗證內容是否符合規則

## 新增一道小吃

```bash
cp templates/food-template.md content/foods/<slug>.md   # 1. 寫內文
# 2. 在 data/foods.json 最後加一筆資料
python3 scripts/check.py                                  # 3. 驗證
python3 -m http.server 8000                               # 4. 預覽
```

或直接對 AI 說：「請依照 AGENTS.md 新增一道『滷肉飯』」。
