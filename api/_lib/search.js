import { fetchHtml, BASE, json } from "./_lib/fetch.js";
import { parseAnimeCardsFromListing } from "./_lib/parse.js";

export default async function handler(req, res) {
  try {
    const q = (req.query.q || "").toString().trim();
    const page = Number(req.query.page || 1);
    if (!q) return json(res, { error: "Parameter q wajib diisi" }, 400);

    const url = `${BASE}/?s=${encodeURIComponent(q)}${page > 1 ? `&paged=${page}` : ""}`;
    const html = await fetchHtml(url);

    const results = parseAnimeCardsFromListing(html);
    return json(res, { query: q, page, results });
  } catch (e) {
    return json(res, { error: e.message }, 500);
  }
}
