import { fetchHtml, BASE, json } from "./_lib/fetch.js";
import { parseSchedule } from "./_lib/parse.js";

export default async function handler(req, res) {
  try {
    const url = `${BASE}/jadwal-rilis/`;
    const html = await fetchHtml(url);

    return json(res, parseSchedule(html));
  } catch (e) {
    return json(res, { error: e.message }, 500);
  }
}
