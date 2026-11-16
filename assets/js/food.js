// 條目頁：讀取 ?slug=xxx → 從 foods.json 取後設資料 → 讀 content/foods/<slug>.md 渲染

const root = document.querySelector("#entry");

function notFound(msg) {
  root.innerHTML = `
    <a class="back" href="index.html">← 回到圖鑑</a>
    <p class="empty">${escapeHTML(msg)}</p>`;
  document.title = "找不到條目｜夜市小吃圖鑑";
}

function pagerLink(food, cls, label) {
  if (!food) return "<span></span>";
  return `<a class="${cls}" href="food.html?slug=${encodeURIComponent(food.slug)}">
    <small>${label}</small>${food.emoji} ${escapeHTML(food.name)}</a>`;
}

(async () => {
  const slug = new URLSearchParams(location.search).get("slug");
  if (!slug) return notFound("網址缺少 slug 參數。");

  let foods;
  try { foods = await loadFoods(); } catch (err) { return notFound(err.message); }

  const idx = foods.findIndex((f) => f.slug === slug);
  if (idx === -1) return notFound(`圖鑑裡還沒有「${slug}」這道小吃。`);
  const food = foods[idx];

  const res = await fetch(`content/foods/${encodeURIComponent(slug)}.md`, { cache: "no-cache" });
  if (!res.ok) return notFound(`找不到 ${slug}.md 內文檔案。`);
  const md = await res.text();
  const body = renderMarkdown(md);

  document.title = `${food.name} ${food.en}｜夜市小吃圖鑑`;
  document.querySelector('meta[name="description"]').setAttribute("content", food.summary);

  root.innerHTML = `
    <a class="back" href="index.html">← 回到圖鑑</a>
    <header class="entry-head">
      <span class="stamp" aria-hidden="true">${food.emoji}</span>
      <div>
        <h1>${escapeHTML(food.name)}</h1>
        <div class="en">${escapeHTML(food.en)}</div>
      </div>
    </header>
    <div class="entry-facts">
      <div class="fact"><small>分類</small><span>${escapeHTML(food.category)}</span></div>
      <div class="fact"><small>價位</small><span>NT$ ${escapeHTML(food.price)}</span></div>
      <div class="fact"><small>代表地區</small><span>${escapeHTML(food.region)}</span></div>
      <div class="fact"><small>辣度</small><span>${spicyLabel(food.spicy)}</span></div>
    </div>
    <div class="tags">${food.tags.map((t) => `<span class="tag">#${escapeHTML(t)}</span>`).join("")}</div>
    <article class="prose">${body}</article>
    <nav class="pager" aria-label="上一道 / 下一道">
      ${pagerLink(foods[idx - 1], "prev", "← 上一道")}
      ${pagerLink(foods[idx + 1], "next", "下一道 →")}
    </nav>`;
})();
