# AGENTS.md — 夜市小吃圖鑑 (Night Market Field Guide)

> 這份文件是給 AI（Claude、Codex、Cursor…）與協作者看的「專案說明書」。
> 在新增或修改任何內容前，**請先完整讀完本文件**，並遵守其中所有規則。

---

## 1. 專案目的

「夜市小吃圖鑑」是一個以**圖鑑卡片**形式介紹台灣夜市小吃的靜態網站。

- 目標讀者：第一次逛台灣夜市的人、外國朋友、想認識小吃背景的學生。
- 每一道小吃 = 一篇「圖鑑條目」，格式完全一致，讓讀者可以快速比較。
- 網站必須能直接部署在 **GitHub Pages**，**不需要任何建置步驟**（no build step）。

一句話：**新增一道小吃，只需要「一個 Markdown 檔 + 一筆 JSON 資料」。**

---

## 2. 技術架構

| 項目 | 規定 |
|------|------|
| 技術 | 純 HTML + CSS + 原生 JavaScript（ES2020），不使用框架 |
| 外部函式庫 | **不使用**。Markdown 由 `assets/js/common.js` 內建的 `renderMarkdown()` 轉成 HTML |
| 字型 | Google Fonts：`Noto Sans TC`、`Noto Serif TC` |
| 部署 | GitHub Pages，從 `main` 分支根目錄發佈 |
| 建置 | **禁止**加入 npm、bundler、SSG 等建置流程 |

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
├── about.html             ← 關於本站 / 撰寫規則公開版
├── assets/
│   ├── css/style.css      ← 唯一的樣式表（設計 token 都在 :root）
│   └── js/
│       ├── common.js      ← 共用函式：讀 JSON、建立卡片、主題切換、迷你 Markdown 轉換器
│       ├── home.js        ← 首頁邏輯
│       └── food.js        ← 條目頁邏輯
├── data/
│   └── foods.json         ← 所有小吃的「後設資料」(metadata) 清單
├── content/
│   └── foods/
│       └── <slug>.md      ← 每道小吃的內文
├── templates/
│   └── food-template.md   ← 新條目的 Markdown 範本
└── scripts/
    └── check.py           ← 驗證腳本：檢查 JSON 與 Markdown 是否符合規則
```

**不要**新增其他頂層資料夾。圖片若未來需要，放在 `assets/img/<slug>.webp`。

---

## 4. 內容模型（最重要）

### 4.1 `data/foods.json`

是一個陣列，每個元素代表一道小吃，**欄位與順序固定**：

```json
{
  "slug": "oyster-omelette",
  "name": "蚵仔煎",
  "en": "Oyster Omelette",
  "emoji": "🦪",
  "category": "鹹食",
  "region": "全台",
  "price": "60–90",
  "spicy": 0,
  "tags": ["海鮮", "煎炸"],
  "summary": "番薯粉漿包住鮮蚵與蛋，淋上甜辣醬的夜市代表。",
  "added": "2026-11-16"
}
```

| 欄位 | 規則 |
|------|------|
| `slug` | 小寫英文 + 連字號（kebab-case），必須與 `content/foods/<slug>.md` 檔名相同，且全站唯一 |
| `name` | 中文名稱 |
| `en` | 英文名稱，每個單字首字大寫 |
| `emoji` | 1 個最能代表它的 emoji |
| `category` | 只能是：`鹹食`、`甜食`、`飲品`、`炸物`（四選一） |
| `region` | 發源或最具代表性的地區，例如 `全台`、`台南`、`基隆` |
| `price` | 一般價位，新台幣，格式 `最低–最高`（使用 en dash `–`） |
| `spicy` | 辣度整數 `0`–`3` |
| `tags` | 1–3 個，只能從允許清單挑選：`海鮮`、`豬肉`、`雞肉`、`素食可`、`煎炸`、`燒烤`、`湯品`、`手拿`、`排隊名物`、`經典` |
| `summary` | 一句話介紹，**30 字以內**，結尾用全形句號 `。` |
| `added` | 新增日期 `YYYY-MM-DD` |

新條目**加在陣列最後面**，不要重新排序既有條目。

### 4.2 `content/foods/<slug>.md`

每篇條目的 Markdown **只寫內文**（標題、emoji、價格等由 JSON 自動產生，不要重複寫在 Markdown 裡）。
必須**依序**包含以下四個二級標題，標題文字一字不差：

```markdown
## 它是什麼
## 怎麼吃最對味
## 小故事
## 逛夜市小提醒
```

撰寫規則：

1. 使用**繁體中文**、台灣用語（例如「番薯粉」而非「红薯淀粉」）。
2. 每個段落 2–4 句，全文約 250–500 字。
3. 「怎麼吃最對味」用**無序清單**（`-`），3–5 點。
4. 「逛夜市小提醒」用**一段 `>` 引用區塊**開頭，作為重點提示，之後可接清單。
5. 不確定的歷史或數據，用「一說」「據說」等字眼，**不要捏造具體年份、店名或人名**。
6. 不使用一級標題 `#`、不放 HTML、不放圖片、不放表格。
   內建轉換器**只支援**以下語法，其他語法會被當成純文字：
   `## 標題`、一般段落、`- 清單`、`> 引用`、`**粗體**`、`` `程式碼` ``、`[文字](https://網址)`。
7. 中英文之間加一個半形空格（例如「用 Markdown 撰寫」）。

範本見 `templates/food-template.md`。

---

## 5. 視覺風格

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

- **卡片**：圓角 `16px`，左上角放 emoji 圓章，右上角放分類小標籤，下方是名稱、英文名、一句話介紹、價格與辣度。
- **辣度**用 🌶️ 表示（0 顯示「不辣」）。
- 標題用 `Noto Serif TC`，內文用 `Noto Sans TC`。
- 需支援**深色模式**（跟隨系統，並可用右上角按鈕切換，偏好存在 `localStorage`）。
- 需支援**手機寬度**（≥ 360px），左右留白至少 `16px`，不可出現水平捲軸。

不要新增新的配色、動畫庫或 icon 套件；需要新元件時，先重用既有 class。

---

## 6. 新增一道小吃的標準流程（AI 請照做）

1. 決定 `slug`（kebab-case 英文），確認 `data/foods.json` 裡沒有重複。
2. 複製 `templates/food-template.md` 成 `content/foods/<slug>.md`，填寫四個段落。
3. 在 `data/foods.json` **最後**加入一筆資料，所有欄位依 4.1 規則填寫。
4. 執行驗證：
   ```bash
   python3 scripts/check.py
   ```
   必須顯示 `✅ All checks passed`。若有錯誤，修正後再跑一次。
5. 本機預覽（擇一）：
   ```bash
   python3 -m http.server 8000
   ```
   打開 `http://localhost:8000/food.html?slug=<slug>` 確認畫面正常。
6. Commit 訊息格式：`feat(food): add <中文名稱>`。

**不需要**修改任何 HTML 或 JS——首頁卡片、篩選、條目頁都會自動從 JSON 產生。
如果你發現「為了加一道菜必須改程式」，代表做法錯了，請停下來重新檢查。

---

## 7. 修改程式或樣式時的規則

- 修改 `assets/js/*.js` 或 `style.css` 前，先說明要改什麼、為什麼。
- 保持零建置：不可引入需要編譯的語法（TypeScript、JSX、SCSS）。
- 新增欄位到 `foods.json` 時，必須同步更新：本文件第 4.1 節、`scripts/check.py`、`templates/food-template.md`（如有關）。
- 不可刪除既有條目；若內容有誤，直接修正。
- 所有頁面都要有 `<title>`、`<meta name="description">`、`lang="zh-Hant"`。

## 8. Commit 訊息格式

| 類型 | 用途 | 範例 |
|------|------|------|
| `feat(food)` | 新增小吃條目 | `feat(food): add 胡椒餅` |
| `fix(food)` | 修正條目內容 | `fix(food): correct 臭豆腐 price` |
| `feat(site)` | 新功能 | `feat(site): add spicy filter` |
| `style` | 只改樣式 | `style: tweak card shadow` |
| `docs` | 修改文件 | `docs: update AGENTS.md tags list` |

## 9. 完成前檢查清單

- [ ] `python3 scripts/check.py` 通過
- [ ] 首頁看得到新卡片，點進去內容正常
- [ ] 手機寬度（360px）沒有跑版
- [ ] 深色模式下文字看得清楚
- [ ] 沒有寫死的色碼、沒有 `/` 開頭的路徑
