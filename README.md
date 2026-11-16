# 🏮 夜市小吃圖鑑 Night Market Field Guide

用「圖鑑卡片」介紹台灣夜市小吃的靜態網站。每道小吃都遵循同一套格式，並透過 [`AGENTS.md`](./AGENTS.md) 讓 AI 能依規則持續新增內容。

- 🌐 網站：https://laugwang.github.io/night-market-guide/
- ✍️ 新增小吃：https://laugwang.github.io/night-market-guide/add.html
- 📘 AI 協作規則：[`AGENTS.md`](./AGENTS.md)（`CLAUDE.md` 指向它）

## 特色

- **填表單就能新增**：即時預覽、即時檢查格式，送出到 GitHub 後自動上線
- 一道小吃 = 一個 Markdown 檔，首頁索引由 `scripts/build.py` 自動產生
- 純 HTML / CSS / 原生 JS，零外部依賴
- 首頁卡片牆、關鍵字搜尋、分類篩選；深色模式；手機版
- GitHub Actions 部署前自動驗證，格式不對就不會上線

## 新增一道小吃

**一般使用者**：打開網站的「＋ 新增」→ 填表單 → 按「送出到 GitHub」→ 按綠色 Commit changes，約 1 分鐘後上線。

**用 AI**：對 AI 說「請依照 AGENTS.md 新增一道『滷肉飯』」。

**手動**：

```bash
cp templates/food-template.md content/foods/<slug>.md
```

```bash
python3 scripts/build.py
```

```bash
python3 -m http.server 8000
```
