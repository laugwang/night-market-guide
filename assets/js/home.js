// 首頁：卡片牆 + 搜尋 + 分類篩選（分類固定四種，見 AGENTS.md §4.1）

const CATEGORIES = ["全部", "鹹食", "甜食", "飲品", "炸物"];

const state = { foods: [], category: "全部", query: "" };

const grid = document.querySelector("#grid");
const chips = document.querySelector("#chips");
const search = document.querySelector("#search");
const count = document.querySelector("#count");

function matches(food) {
  const inCat = state.category === "全部" || food.category === state.category;
  if (!inCat) return false;
  const q = state.query.trim().toLowerCase();
  if (!q) return true;
  return [food.name, food.en, food.summary, food.region, ...food.tags]
    .join(" ").toLowerCase().includes(q);
}

function render() {
  const list = state.foods.filter(matches);
  count.textContent = `共 ${list.length} / ${state.foods.length} 道小吃`;
  grid.innerHTML = list.length
    ? list.map(cardHTML).join("")
    : `<p class="empty">找不到符合的小吃 🥲 換個關鍵字試試？</p>`;
}

function renderChips() {
  chips.innerHTML = CATEGORIES.map((c) =>
    `<button class="chip" type="button" data-cat="${c}" aria-pressed="${c === state.category}">${c}</button>`
  ).join("");
}

chips.addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  state.category = btn.dataset.cat;
  renderChips();
  render();
});

search.addEventListener("input", () => { state.query = search.value; render(); });

(async () => {
  renderChips();
  try {
    state.foods = await loadFoods();
    render();
  } catch (err) {
    grid.innerHTML = `<p class="empty">${escapeHTML(err.message)}<br>若是直接開啟檔案，請改用 <code>python3 -m http.server</code> 預覽。</p>`;
  }
})();
