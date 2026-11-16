// 新增小吃表單：把表單內容轉成符合 AGENTS.md §4 的 Markdown，
// 並在瀏覽器端做與 scripts/build.py 相同的檢查。
// 規則有變動時，三個地方要一起改：AGENTS.md、scripts/build.py、這個檔案的 RULES。

const RULES = {
  categories: ["鹹食", "甜食", "飲品", "炸物"],
  tags: ["海鮮", "豬肉", "雞肉", "素食可", "煎炸", "燒烤", "湯品", "手拿", "排隊名物", "經典"],
  spicy: ["不辣", "🌶️", "🌶️🌶️", "🌶️🌶️🌶️"],
  emojis: ["🍚", "🍜", "🥟", "🍢", "🍗", "🍖", "🦑", "🦪", "🍤", "🌭", "🥚", "🍠", "🍡", "🍧", "🍮", "🧋", "🥤", "🍋"],
};
const DRAFT_KEY = "nmg-add-draft";

const form = document.querySelector("#form");
const el = (sel) => document.querySelector(sel);
let existingSlugs = new Set();

// ---------- 建立選項按鈕 ----------
function chipButtons(container, items, type, name) {
  container.innerHTML = items.map((label, i) =>
    `<label class="chip-choice"><input type="${type}" name="${name}" value="${type === "radio" && name === "spicy" ? i : label}"><span>${label}</span></label>`
  ).join("");
}
chipButtons(el("#category-row"), RULES.categories, "radio", "category");
chipButtons(el("#spicy-row"), RULES.spicy, "radio", "spicy");
chipButtons(el("#tag-row"), RULES.tags, "checkbox", "tags");
form.spicy.value = "0";
el("#emoji-row").innerHTML = RULES.emojis.map((e) =>
  `<button type="button" class="emoji-btn" data-emoji="${e}" aria-label="使用 ${e}">${e}</button>`).join("");
el("#emoji-row").addEventListener("click", (e) => {
  const btn = e.target.closest(".emoji-btn");
  if (!btn) return;
  form.emoji.value = btn.dataset.emoji;
  update();
});

// ---------- 讀取表單 ----------
const lines = (text) => text.split("\n").map((s) => s.trim().replace(/^[-*•、]\s*/, "")).filter(Boolean);
const paragraph = (text) => text.trim().replace(/\s*\n\s*/g, "");

function toSlug(en) {
  return en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function titleCase(en) {
  return en.trim().replace(/\s+/g, " ").split(" ").filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function readForm() {
  const f = form;
  let summary = f.summary.value.trim().replace(/[。.!！]+$/, "");
  if (summary) summary += "。";
  const min = f.priceMin.value, max = f.priceMax.value;
  return {
    slug: toSlug(f.en.value),
    name: f.name.value.trim(),
    en: titleCase(f.en.value),
    emoji: f.emoji.value.trim(),
    category: f.category.value,
    region: f.region.value.trim(),
    price: min && max ? `${Math.min(min, max)}–${Math.max(min, max)}` : "",
    spicy: Number(f.spicy.value || 0),
    tags: [...f.querySelectorAll('input[name="tags"]:checked')].map((i) => i.value),
    summary,
    added: new Date().toLocaleDateString("sv-SE"), // YYYY-MM-DD（本地時間）
    what: paragraph(f.what.value),
    how: lines(f.how.value),
    story: paragraph(f.story.value),
    tipMain: paragraph(f.tipMain.value),
    tipMore: lines(f.tipMore.value),
  };
}

function validate(d) {
  const e = [];
  if (!d.name) e.push("請填中文名稱");
  if (!d.en) e.push("請填英文名稱");
  else if (!/^[A-Za-z ]+$/.test(form.en.value.trim())) e.push("英文名稱只能有英文字母和空格");
  else if (existingSlugs.has(d.slug)) e.push(`圖鑑裡已經有「${d.slug}」了，換個英文名稱吧`);
  if (!d.emoji) e.push("請選一個代表圖示");
  if (!d.category) e.push("請選分類");
  if (!d.region) e.push("請填代表地區");
  if (!d.price) e.push("請填最低與最高價位");
  if (d.tags.length < 1 || d.tags.length > 3) e.push("標籤請選 1–3 個");
  if (!d.summary) e.push("請填一句話介紹");
  else if (d.summary.length > 30) e.push(`一句話介紹含句號需 30 字內（目前 ${d.summary.length} 字）`);
  if (!d.what) e.push("請填「它是什麼」");
  if (d.how.length < 2 || d.how.length > 5) e.push("「怎麼吃最對味」請寫 2–5 行");
  if (!d.story) e.push("請填「小故事」");
  if (!d.tipMain) e.push("請填最重要的一個提醒");
  if (/<[a-zA-Z/]/.test([d.what, d.story, d.tipMain, ...d.how, ...d.tipMore].join(""))) e.push("內容不可包含 HTML 標籤");
  return e;
}

// ---------- 產生 Markdown（格式見 AGENTS.md §4） ----------
function toBody(d) {
  return [
    "## 它是什麼", "", d.what || "（尚未填寫）", "",
    "## 怎麼吃最對味", "", ...(d.how.length ? d.how.map((s) => `- ${s}`) : ["- （尚未填寫）"]), "",
    "## 小故事", "", d.story || "（尚未填寫）", "",
    "## 逛夜市小提醒", "", `> ${d.tipMain || "（尚未填寫）"}`,
    ...(d.tipMore.length ? ["", ...d.tipMore.map((s) => `- ${s}`)] : []), "",
  ].join("\n");
}
function toMarkdown(d) {
  return [
    "---",
    `name: ${d.name}`, `en: ${d.en}`, `emoji: ${d.emoji}`, `category: ${d.category}`,
    `region: ${d.region}`, `price: ${d.price}`, `spicy: ${d.spicy}`,
    `tags: ${d.tags.join(", ")}`, `summary: ${d.summary}`, `added: ${d.added}`,
    "---", toBody(d),
  ].join("\n");
}

// ---------- 畫面更新 ----------
function update() {
  const d = readForm();
  const errs = validate(d);
  el("#slug").textContent = d.slug ? `${d.slug}.md` : "—";
  el("#summary-count").textContent = d.summary.length;
  document.querySelectorAll(".emoji-btn").forEach((b) =>
    b.setAttribute("aria-pressed", b.dataset.emoji === d.emoji));

  el("#preview-card").innerHTML = cardHTML({
    ...d,
    name: d.name || "小吃名稱", en: d.en || "English Name", emoji: d.emoji || "❔",
    category: d.category || "分類", region: d.region || "地區",
    price: d.price || "?–?", summary: d.summary || "一句話介紹會顯示在這裡。",
  }).replace('<a class="card"', '<div class="card"').replace(/<\/a>\s*$/, "</div>");
  el("#preview-body").innerHTML = renderMarkdown(toBody(d));

  el("#submit").disabled = errs.length > 0;
  el("#errors").innerHTML = errs.length
    ? `<p>還差這些才能送出：</p><ul>${errs.map((x) => `<li>${escapeHTML(x)}</li>`).join("")}</ul>`
    : `<p class="ok">✅ 格式都正確，可以送出了！</p>`;
  saveDraft();
  return { d, errs };
}

// 標籤最多 3 個
el("#tag-row").addEventListener("change", (e) => {
  const checked = form.querySelectorAll('input[name="tags"]:checked');
  if (checked.length > 3) e.target.checked = false;
});

form.addEventListener("input", update);
form.addEventListener("change", update);

// ---------- 草稿暫存（只存在這台瀏覽器） ----------
function saveDraft() {
  try {
    const data = Object.fromEntries(new FormData(form));
    data.tags = [...form.querySelectorAll('input[name="tags"]:checked')].map((i) => i.value);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch (_) { /* ignore */ }
}
function loadDraft() {
  try {
    const data = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    if (!data) return;
    for (const [k, v] of Object.entries(data)) {
      if (k === "tags") continue;
      const field = form.elements[k];
      if (field) field.value = v;
    }
    form.querySelectorAll('input[name="tags"]').forEach((i) => { i.checked = (data.tags || []).includes(i.value); });
  } catch (_) { /* ignore */ }
}

// ---------- 按鈕 ----------
el("#submit").addEventListener("click", () => {
  const { d, errs } = update();
  if (errs.length) return;
  const params = new URLSearchParams({ filename: `content/foods/${d.slug}.md`, value: toMarkdown(d) });
  const url = `https://github.com/${SITE.repo}/new/${SITE.branch}?${params}`;
  window.open(url, "_blank", "noopener");
});
el("#download").addEventListener("click", () => {
  const { d } = update();
  const blob = new Blob([toMarkdown(d)], { type: "text/markdown;charset=utf-8" });
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob), download: `${d.slug || "new-food"}.md`,
  });
  a.click();
  URL.revokeObjectURL(a.href);
});
el("#copy").addEventListener("click", async (e) => {
  const { d } = update();
  try {
    await navigator.clipboard.writeText(toMarkdown(d));
    e.target.textContent = "已複製 ✓";
  } catch (_) {
    e.target.textContent = "複製失敗";
  }
  setTimeout(() => { e.target.textContent = "複製內容"; }, 1500);
});
el("#reset").addEventListener("click", () => {
  if (!confirm("確定要清空表單嗎？")) return;
  form.reset();
  form.spicy.value = "0";
  try { localStorage.removeItem(DRAFT_KEY); } catch (_) { /* ignore */ }
  update();
});

(async () => {
  loadDraft();
  update();
  try {
    existingSlugs = new Set((await loadFoods()).map((f) => f.slug));
    update();
  } catch (_) { /* 讀不到也能填，送出後由 build.py 把關 */ }
})();
