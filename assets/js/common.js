// 共用函式：讀取資料、建立卡片、主題切換
// 規則：新增小吃時不需要修改這個檔案（見 AGENTS.md §6）

const DATA_URL = "data/foods.json";

// GitHub repo 設定：add.html 的「送出到 GitHub」會用到。換 repo 時只要改這裡。
const SITE = { repo: "laugwang/night-market-guide", branch: "main" };

// 把 Markdown 開頭 --- 包起來的 front matter 拿掉，只留內文
function stripFrontMatter(md) {
  return md.replace(/\r/g, "").replace(/^---\n[\s\S]*?\n---\n?/, "");
}

async function loadFoods() {
  const res = await fetch(DATA_URL, { cache: "no-cache" });
  if (!res.ok) throw new Error(`無法讀取 ${DATA_URL}（${res.status}）`);
  return res.json();
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

function spicyLabel(level) {
  return level > 0 ? "🌶️".repeat(level) : "不辣";
}

function cardHTML(food) {
  const tags = food.tags.map((t) => `<span class="tag">#${escapeHTML(t)}</span>`).join("");
  return `
    <a class="card" href="food.html?slug=${encodeURIComponent(food.slug)}">
      <div class="card-top">
        <span class="stamp" aria-hidden="true">${food.emoji}</span>
        <span class="badge">${escapeHTML(food.category)}</span>
      </div>
      <h3>${escapeHTML(food.name)}</h3>
      <span class="en">${escapeHTML(food.en)}</span>
      <p class="summary">${escapeHTML(food.summary)}</p>
      <div class="tags">${tags}</div>
      <div class="meta">
        <span>💰 <b>NT$ ${escapeHTML(food.price)}</b></span>
        <span>📍 <b>${escapeHTML(food.region)}</b></span>
        <span>${spicyLabel(food.spicy)}</span>
      </div>
    </a>`;
}

// ---------- 主題切換 ----------
const THEME_KEY = "nmg-theme";

function applyTheme(theme) {
  if (theme) document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
}

function currentTheme() {
  const set = document.documentElement.dataset.theme;
  if (set) return set;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function initThemeToggle() {
  try { applyTheme(localStorage.getItem(THEME_KEY)); } catch (_) { /* 無痕模式等情況忽略 */ }
  const btn = document.querySelector(".theme-btn");
  if (!btn) return;
  const sync = () => { btn.textContent = currentTheme() === "dark" ? "☀️" : "🌙"; };
  sync();
  btn.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (_) { /* ignore */ }
    sync();
  });
}

initThemeToggle();

// ---------- 迷你 Markdown 轉換器 ----------
// 只支援 AGENTS.md §4.2 允許的語法：## 標題、段落、- 清單、> 引用、**粗體**、`程式碼`、[連結](url)
function inlineMD(text) {
  return escapeHTML(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" rel="noopener">$1</a>');
}

function renderMarkdown(md) {
  const out = [];
  let list = null, para = [], quote = [];
  const flush = () => {
    if (para.length) { out.push(`<p>${inlineMD(para.join(""))}</p>`); para = []; }
    if (quote.length) { out.push(`<blockquote><p>${inlineMD(quote.join(""))}</p></blockquote>`); quote = []; }
    if (list) { out.push(`<ul>${list.map((li) => `<li>${inlineMD(li)}</li>`).join("")}</ul>`); list = null; }
  };
  for (const raw of md.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    let m;
    if ((m = line.match(/^##\s+(.+)/))) { flush(); out.push(`<h2>${inlineMD(m[1])}</h2>`); }
    else if ((m = line.match(/^[-*]\s+(.+)/))) { if (!list) { flush(); list = []; } list.push(m[1]); }
    else if ((m = line.match(/^>\s?(.*)/))) { if (!quote.length) flush(); quote.push(m[1]); }
    else { if (list || quote.length) flush(); para.push(line); }
  }
  flush();
  return out.join("\n");
}
