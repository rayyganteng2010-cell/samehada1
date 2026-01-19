const $ = (id) => document.getElementById(id);

function card(item) {
  const rating = item.rating ?? "-";
  const type = item.type ?? "-";
  const status = item.status ?? "-";
  const views = item.views ?? "-";

  const genres = (item.genres || []).slice(0, 6).map(g => `<span class="tag">${g}</span>`).join("");

  return `
    <div class="card">
      <img src="${item.thumbnail || ""}" alt="">
      <div class="p">
        <div class="meta">${type} | ${status} | ⭐ ${rating} | 👀 ${views}</div>
        <div class="title"><a href="${item.url}" target="_blank" rel="noreferrer">${item.title}</a></div>
        <div class="meta">${item.synopsis || ""}</div>
        <div>${genres}</div>
        <div class="meta" style="margin-top:8px;">
          <button data-anime="${encodeURIComponent(item.url)}">Detail</button>
        </div>
      </div>
    </div>
  `;
}

async function run(endpoint) {
  $("status").textContent = "Loading...";
  $("grid").innerHTML = "";
  const res = await fetch(endpoint);
  const data = await res.json();
  $("status").textContent = JSON.stringify(data, null, 2);

  const list = data.results || [];
  $("grid").innerHTML = list.map(card).join("");

  // tombol detail anime -> ambil /api/anime
  document.querySelectorAll("button[data-anime]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const url = decodeURIComponent(btn.dataset.anime);
      const r = await fetch(`/api/anime?url=${encodeURIComponent(url)}`);
      const d = await r.json();
      alert(`Episodes: ${(d.episodes || []).length}\nTitle: ${d.title}`);
      $("status").textContent = JSON.stringify(d, null, 2);
    });
  });
}

$("btn").addEventListener("click", () => {
  const q = $("q").value.trim();
  run(`/api/search?q=${encodeURIComponent(q)}`);
});

$("btnLatest").addEventListener("click", () => run(`/api/latest`));
$("btnSchedule").addEventListener("click", () => run(`/api/schedule`));
