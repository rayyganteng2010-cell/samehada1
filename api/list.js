import { fetchHtml, BASE, json } from "./_lib/fetch.js";
import { parseAnimeCardsFromListing } from "./_lib/parse.js";

export default async function handler(req, res) {
  try {
    const page = Number(req.query.page || 1);
    const url = `${BASE}/daftar-anime-2/${page > 1 ? `page/${page}/` : ""}`;
    const html = await fetchHtml(url);

    const results = parseAnimeCardsFromListing(html);
    return json(res, { page, results });
  } catch (e) {
    return json(res, { error: e.message }, 500);
  }
}
