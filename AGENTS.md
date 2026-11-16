# AGENTS.md — 夜市小吃圖鑑 (Night Market Field Guide)

> 這份文件是給 AI（Claude、Codex、Cursor…）與協作者看的「專案說明書」。
> 在新增或修改任何內容前，**請先完整讀完本文件**，並遵守其中所有規則。

---

## 1. 專案目的

「夜市小吃圖鑑」是一個以**圖鑑卡片**形式介紹台灣夜市小吃的靜態網站。

- 目標讀者：第一次逛台灣夜市的人、外國朋友、想認識小吃背景的學生。
- 每一道小吃 = 一篇「圖鑑條目」，格式完全一致，讓讀者可以快速比較。
- **一般人也能新增內容**：在網站的「＋ 新增」表單填寫，送出到 GitHub 後自動上線，不需要寫程式。

一句話：**一道小吃 = 一個 Markdown 檔**（`content/foods/<slug>.md`）。其他東西都是自動產生的。

---

## 2. 技術架構

| 項目 | 規定 |
|------|------|
| 技術 | 純 HTML + CSS + 原生 JavaScript（ES2020），不使用框架 |
| 外部函式庫 | **不使用**。Markdown 由 `assets/js/common.js` 內建的 `renderMarkdown()` 轉成 HTML |
| 字型 | Google Fonts：`Noto Sans TC`、`Noto Serif TC` |
| 索引 | `scripts/build.py`（只用 Python 標準函式庫）驗證所有 Markdown 並產生 `data/foods.json` |
| 部署 | `.github/workflows/pages.yml`：每次 push 到 `main` → 執行 `build.py` → 部署到 GitHub Pages。**驗證失敗就不會上線** |
| 禁止 | npm、bundler、SSG、TypeScript、SCSS 等任何需要額外安裝的建置流程 |

所有路徑一律使用**相對路徑**（例如 `assets/css/style.css`），不可用 `/` 開頭，否則在 GitHub Pages 子路徑下會壞掉。

---

## 3. 資料夾結構

```
night-market-guide/
├── AGENTS.md              ← 本文件：AI 協作規則（唯一真實來源）
├── CLAUDE.md              ← 指向 AGENTS.md
├── README.md              ← 給人看的專案簡介
├── index.html             ← 首頁：卡片牆 + 搜尋 + 分類篩選
├── food.html              ← 條目頁：用 ?slug=xxx 讀取並渲染 Markdown
├── add.html               ← 新增表單：填表 → 即時預覽 → 送出到 GitHub
├── about.html             ← 關於本站
├── assets/
│   ├── css/style.css      ← 唯一的樣式表（設計 token 都在 :root）
│   └── js/
│       ├── common.js      ← 共用：SITE 設定、讀 JSON、卡片、主題切換、Markdown 轉換
│       ├── home.js        ← 首頁邏輯
│       ├── food.js        ← 條目頁邏輯
│       └── add.js         ← 表單邏輯（含與 build.py 相同的檢查規則）
├── content/
│   └── foods/<slug>.md    ← ★ 唯一的內容來源，每道小吃一個檔
├── data/
│   └── foods.json         ← 由 build.py 自動產生，已列入 .gitignore，不要手動編輯
├── templates/
│   └── food-template.md   ← 新條目的 Markdown 範本
├── scripts/
│   └── build.py           ← 驗證 + 產生 data/foods.json
└── .github/workflows/pages.yml
```

**不要**新增其他頂層資料夾。圖片若未來需要，放在 `assets/img/<slug>.webp`。

---

## 4. 內容格式（最重要）

每道小吃是 `content/foods/<slug>.md`，由**front matter + 四段內文**組成：

```markdown
---
name: 蚵仔煎
en: Oyster Omelette
emoji: 🦪
category: 鹹食
region: 全台
price: 60–90
spicy: 0
tags: 海鮮, 煎炸, 經典
summary: 番薯粉漿包住鮮蚵與蛋，淋上甜辣醬的夜市代表。
added: 2026-11-16
---
## 它是什麼
...
## 怎麼吃最對味
...
## 小故事
...
## 逛夜市小提醒
...
```

### 4.1 檔名與 front matter

| 欄位 | 規則 |
|------|------|
| 檔名（slug） | 英文名稱轉小寫 + 連字號（kebab-case），例如 `Braised Pork Rice` → `braised-pork-rice.md`，全站唯一 |
| `name` | 中文名稱 |
| `en` | 英文名稱，只有英文字母與空格，每個單字首字大寫 |
| `emoji` | 1 個最能代表它的 emoji |
| `category` | 只能是：`鹹食`、`甜食`、`飲品`、`炸物`（四選一） |
| `region` | 發源或最具代表性的地區，例如 `全台`、`台南`、`基隆` |
| `price` | 一般價位，新台幣，格式 `最低–最高`（中間是 en dash `–`） |
| `spicy` | 辣度整數 `0`–`3` |
| `tags` | 1–3 個，用 `, ` 分隔，只能從允許清單挑：`海鮮`、`豬肉`、`雞肉`、`素食可`、`煎炸`、`燒烤`、`湯品`、`手拿`、`排隊名物`、`經典` |
| `summary` | 一句話介紹，**含句號 30 字以內**，結尾用全形句號 `。` |
| `added` | 新增日期 `YYYY-MM-DD`；首頁依此日期排序（同日依檔名） |

front matter 只能有上述 10 個欄位，多或少都會被 `build.py` 擋下。

### 4.2 內文

必須**依序**包含以下四個二級標題，文字一字不差，且每段都不可空白：

1. `## 它是什麼`：一段 2–4 句，寫用料、口感、外觀。
2. `## 怎麼吃最對味`：**無序清單**（`-`），2–5 點。
3. `## 小故事`：一段 2–4 句，起源或名稱由來。
4. `## 逛夜市小提醒`：**以一段 `>` 引用開頭**（最重要的提醒），之後可接 `-` 清單。

撰寫規則：

1. 使用**繁體中文**、台灣用語（例如「番薯粉」而非「红薯淀粉」）。
2. 不確定的歷史或數據，用「一說」「據說」等字眼，**不要捏造具體年份、店名或人名**。
3. 不使用一級標題 `#`、不放 HTML、圖片或表格。內建轉換器**只支援**：
   `## 標題`、一般段落、`- 清單`、`> 引用`、`**粗體**`、`` `程式碼` ``、`[文字](https://網址)`。
4. 中英文之間加一個半形空格（例如「用 Markdown 撰寫」）。

範本見 `templates/food-template.md`。

---

## 5. 新增一道小吃的流程

### 5.1 一般使用者（不需要寫程式）

1. 打開網站的 **「＋ 新增」**（`add.html`）。
2. 填表單，右邊會即時預覽卡片與內文；表單會即時檢查格式，全部正確才能送出。
3. 按 **「送出到 GitHub」** → 開啟 GitHub 新增檔案頁（內容已填好）→ 按綠色 **Commit changes**。
4. 約 1 分鐘後 GitHub Actions 驗證通過並自動更新網站。

沒有 repo 編輯權限的人可以按「下載 .md 檔」交給管理者放進 `content/foods/`。

### 5.2 AI 或開發者

1. 由英文名稱決定 `slug`，確認 `content/foods/` 裡沒有同名檔案。
2. 複製 `templates/food-template.md` 成 `content/foods/<slug>.md`，填好 front matter 與四段內文。
3. 執行驗證並產生索引：
   ```bash
   python3 scripts/build.py
   ```
   必須顯示 `✅ All checks passed`。有錯誤就依訊息修正後再跑一次。
4. 本機預覽：
   ```bash
   python3 -m http.server 8000
   ```
   打開 `http://localhost:8000/food.html?slug=<slug>` 確認畫面正常。
5. Commit 訊息：`feat(food): add <中文名稱>`，只需要 commit 那一個 `.md` 檔。

**不需要**修改任何 HTML、JS 或 JSON。如果你發現「為了加一道菜必須改程式」，代表做法錯了，請停下來重新檢查。

---

## 6. 視覺風格

主題：**「紙燈籠下的圖鑑」**——米色紙張質感 + 夜市紅燈籠的朱紅色 + 琥珀色點綴。

所有顏色都定義在 `assets/css/style.css` 的 `:root`，**禁止在其他地方寫死色碼**：

| Token | 用途 | 淺色 | 深色 |
|-------|------|------|------|
| `--bg` | 頁面背景 | `#f6f0e4` 紙色 | `#17130f` 夜色 |
| `--surface` | 卡片背景 | `#fffaf0` | `#221c16` |
| `--ink` | 主要文字 | `#2b2118` | `#f1e7d6` |
| `--muted` | 次要文字 | `#7a6a58` | `#a8987f` |
| `--lantern` | 主色（燈籠紅） | `#c8372d` | `#ff6a5c` |
| `--amber` | 點綴（琥珀黃） | `#e0a526` | `#f2bf4a` |
| `--line` | 邊框 | `#e3d6c0` | `#3a3027` |

元件規則：

- **卡片**：圓角 `16px`，左上角 emoji 圓章，右上角分類小標籤，下方是名稱、英文名、一句話介紹、標籤、價格、地區與辣度。
- **辣度**用 🌶️ 表示（0 顯示「不辣」）。
- 標題用 `Noto Serif TC`，內文用 `Noto Sans TC`。
- **按鈕**：主要動作用 `.btn.primary`（燈籠紅），其他用 `.btn`；選項用 `.chip` / `.chip-choice` 膠囊樣式。
- 需支援**深色模式**（跟隨系統，並可用右上角按鈕切換，偏好存在 `localStorage`）。
- 需支援**手機寬度**（≥ 360px），左右留白至少 `16px`，不可出現水平捲軸。

不要新增新的配色、動畫庫或 icon 套件；需要新元件時，先重用既有 class。

---

## 7. 修改程式或樣式時的規則

- **檢查規則有三份，必須同步**：本文件第 4 節、`scripts/build.py`、`assets/js/add.js` 的 `RULES` 與 `validate()`。改其中一個（例如新增一個標籤），另外兩個一定要一起改。
- 新增 front matter 欄位時，還要同步更新：`templates/food-template.md`、`add.html` 表單、`add.js` 的 `toMarkdown()`。
- 換 GitHub repo 時，只需要改 `assets/js/common.js` 的 `SITE`。
- 新增頁面時，複製既有頁面的 `<head>` 與 header/footer，並在所有頁面的導覽列加上連結。
- 所有頁面都要有 `<title>`、`<meta name="description">`、`lang="zh-Hant"`。
- 不可刪除既有條目；若內容有誤，直接修正。

## 8. Commit 訊息格式

| 類型 | 用途 | 範例 |
|------|------|------|
| `feat(food)` | 新增小吃條目 | `feat(food): add 胡椒餅` |
| `fix(food)` | 修正條目內容 | `fix(food): correct 臭豆腐 price` |
| `feat(site)` | 新功能 | `feat(site): add spicy filter` |
| `style` | 只改樣式 | `style: tweak card shadow` |
| `docs` | 修改文件 | `docs: update AGENTS.md tags list` |

透過表單送出的 commit，GitHub 預設訊息為 `Create <slug>.md`，可以接受。

## 9. 完成前檢查清單

- [ ] `python3 scripts/build.py` 通過
- [ ] 首頁看得到新卡片，點進去內容正常
- [ ] 手機寬度（360px）沒有跑版
- [ ] 深色模式下文字看得清楚
- [ ] 沒有寫死的色碼、沒有 `/` 開頭的路徑
- [ ] 若改了檢查規則：AGENTS.md、build.py、add.js 三處一致
