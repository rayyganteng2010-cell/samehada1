import { fetchHtml, json, absUrl } from "./_lib/fetch.js";
import { parseEpisodePage } from "./_lib/parse.js";

export default async function handler(req, res) {
  try {
    const urlParam = (req.query.url || "").toString().trim();
    if (!urlParam) return json(res, { error: "Parameter url wajib diisi" }, 400);

    const url = absUrl(urlParam);
    const html = await fetchHtml(url);

    const data = parseEpisodePage(html);
    data.url = url;

    return json(res, data);
  } catch (e) {
    return json(res, { error: e.message }, 500);
  }
}
