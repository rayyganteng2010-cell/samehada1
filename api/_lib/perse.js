import * as cheerio from "cheerio";
import { absUrl } from "./fetch.js";

function clean(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function pickImgSrc($img) {
  if (!$img || !$img.length) return null;
  return (
    $img.attr("data-src") ||
    $img.attr("data-lazy-src") ||
    $img.attr("src") ||
    null
  );
}

function parseRatingTypeStatusViews(text) {
  // contoh kartu: "7.43 TV 208893 Views" atau "8.85 TV ... Completed"
  const t = clean(text);

  // rating bisa pakai koma: "6,2"
  const ratingMatch = t.match(/(\d+(?:[.,]\d+)?)/);
  const rating = ratingMatch ? Number(ratingMatch[1].replace(",", ".")) : null;

  const typeMatch = t.match(/\b(TV|Movie|ONA|OVA|Special)\b/i);
  const type = typeMatch ? typeMatch[1].toUpperCase() : null;

  const statusMatch = t.match(/\b(Ongoing|Completed|Finished Airing|Currently Airing)\b/i);
  const status = statusMatch ? statusMatch[1] : null;

  const viewsMatch = t.replace(/,/g, "").match(/(\d{2,})\s*Views/i);
  const views = viewsMatch ? Number(viewsMatch[1]) : null;

  return { rating, type, status, views };
}

export function parseAnimeCardsFromListing(html) {
  const $ = cheerio.load(html);

  // WordPress theme beda-beda, jadi kita cari blok yang “keliatan” kayak kartu:
  // heuristik: ada judul (h2/h3/h4) + link ke /anime/ atau post episode.
  const candidates = [];

  $("article, .listupd, .animepost, .bsx, .post, .result, li").each((_, el) => {
    const $el = $(el);
    const $a =
      $el.find('a[href*="samehadaku"]').first().length ? $el.find('a[href*="samehadaku"]').first()
      : $el.find('a[href^="/"]').first().length ? $el.find('a[href^="/"]').first()
      : $el.find("a").first();

    const href = $a.attr("href");
    const title =
      clean($el.find("h2,h3,h4").first().text()) ||
      clean($a.text());

    if (!href || !title) return;

    const url = absUrl(href);
    // filter: biar gak ngambil link menu/nav
    if (!url || title.length < 2) return;

    const img = pickImgSrc($el.find("img").first());
    const thumb = absUrl(img);

    const metaText = clean($el.text());
    const meta = parseRatingTypeStatusViews(metaText);

    // sinopsis pendek biasanya ada di paragraf
    const synopsis = clean($el.find("p").first().text()) || null;

    // genres biasanya link kategori
    const genres = [];
    $el.find('a[href*="/genre/"], a[rel="tag"]').each((__, a) => {
      const g = clean($(a).text());
      if (g && !genres.includes(g)) genres.push(g);
    });

    candidates.push({
      title,
      url,
      thumbnail: thumb,
      synopsis,
      ...meta,
      genres
    });
  });

  // dedupe berdasarkan url
  const seen = new Set();
  const out = [];
  for (const c of candidates) {
    if (seen.has(c.url)) continue;
    seen.add(c.url);
    out.push(c);
  }
  return out;
}

export function parseAnimeDetail(html) {
  const $ = cheerio.load(html);

  const title =
    clean($("h1").first().text()) ||
    clean($("title").text()).replace(/- Samehadaku.*/i, "");

  const thumbnail = absUrl(
    pickImgSrc($(".thumb img, .animeinfo img, .infox img, img").first())
  );

  // sinopsis: cari heading yang mengandung “Sinopsis”
  let synopsis = null;
  $("h2,h3").each((_, h) => {
    const t = clean($(h).text()).toLowerCase();
    if (t.includes("sinopsis")) {
      const p = clean($(h).nextAll("p").first().text());
      if (p) synopsis = p;
    }
  });

  // episode list: link yang mengandung “episode”
  const episodes = [];
  $('a[href*="episode"]').each((_, a) => {
    const name = clean($(a).text());
    const url = absUrl($(a).attr("href"));
    if (!url || !name) return;
    if (!episodes.some(e => e.url === url)) episodes.push({ name, url });
  });

  // genres
  const genres = [];
  $('a[href*="/genre/"], a[rel="tag"]').each((_, a) => {
    const g = clean($(a).text());
    if (g && !genres.includes(g)) genres.push(g);
  });

  // detail block: cari section yang mengandung “Japanese / Status / Type / Studio” dll
  const fullText = clean($("body").text());

  function extract(label) {
    // ambil teks setelah label sampai sebelum label berikutnya (heuristik)
    const re = new RegExp(`${label}\\s+([^]+?)(?=\\b(Japanese|Synonyms|English|Status|Type|Source|Duration|Total Episode|Season|Studio|Producers|Released)\\b|$)`, "i");
    const m = fullText.match(re);
    return m ? clean(m[1]).replace(/View All.*/i, "").slice(0, 300) : null;
  }

  const info = {
    japanese: extract("Japanese"),
    synonyms: extract("Synonyms"),
    english: extract("English"),
    status: extract("Status"),
    type: extract("Type"),
    source: extract("Source"),
    duration: extract("Duration"),
    totalEpisode: extract("Total Episode"),
    season: extract("Season"),
    studio: extract("Studio"),
    producers: extract("Producers"),
    released: extract("Released")
  };

  // rating kadang ada di halaman (misal list rekomendasi nampilin angka rating).
  // kita cari pola rating “8.16” dekat judul juga.
  const ratingMatch = fullText.match(/\b(\d+(?:[.,]\d+)?)\b\s+(TV|Movie|ONA|OVA|Special)\b/i);
  const rating = ratingMatch ? Number(ratingMatch[1].replace(",", ".")) : null;

  return {
    title,
    url: null,
    thumbnail,
    rating,
    synopsis,
    genres,
    info,
    episodes
  };
}

export function parseEpisodePage(html) {
  const $ = cheerio.load(html);

  const title =
    clean($("h1").first().text()) ||
    clean($("title").text()).replace(/- Samehadaku.*/i, "");

  const thumbnail = absUrl(pickImgSrc($("img").first()));

  // embed video (kalau ada)
  const embeds = [];
  $("iframe").each((_, f) => {
    const src = absUrl($(f).attr("src"));
    if (src) embeds.push(src);
  });

  // download table: cari link keluar (zippyshare/acefile/reupload, dll)
  const downloads = [];
  $("a").each((_, a) => {
    const href = $(a).attr("href");
    const text = clean($(a).text());
    if (!href) return;

    const url = absUrl(href);
    if (!url) return;

    // heuristik host download umum
    if (/(zippyshare|acefile|reupload|pixeldrain|kraken|gofile|mega|drive)/i.test(url)) {
      // quality biasanya dekat: 360p/480p/720p/1080p
      const ctx = clean($(a).parent().text());
      const q = (ctx.match(/\b(360p|480p|720p|1080p)\b/i) || [])[1] || null;
      const container = clean($(a).closest("div,li,p").text());
      const format = container.match(/\bMKV\b/i) ? "MKV" : container.match(/\bMP4\b/i) ? "MP4" : null;

      downloads.push({
        format,
        quality: q,
        host: text || new URL(url).hostname,
        url
      });
    }
  });

  // related episodes list (kalau ada)
  const otherEpisodes = [];
  $('a[href*="episode"]').each((_, a) => {
    const name = clean($(a).text());
    const url = absUrl($(a).attr("href"));
    if (!url || !name) return;
    if (!otherEpisodes.some(e => e.url === url)) otherEpisodes.push({ name, url });
  });

  return {
    title,
    thumbnail,
    embeds,
    downloads,
    otherEpisodes
  };
}

export function parseSchedule(html) {
  const $ = cheerio.load(html);

  // halaman jadwal itu ada list hari + item jam. 4
  const days = ["senin","selasa","rabu","kamis","jumaat","sabtu","minggu"];

  const items = [];
  $("a").each((_, a) => {
    const href = $(a).attr("href");
    const t = clean($(a).text());
    if (!href || !t) return;

    // judul anime biasanya punya type + rating juga
    // contoh: "TV 8.73 One Piece Action, Adventure" 5
    if (/\b(TV|Movie|ONA|OVA|Special)\b/.test(t)) {
      const url = absUrl(href);
      const meta = t;

      const ratingMatch = meta.match(/(\d+(?:[.,]\d+)?)/);
      const rating = ratingMatch ? Number(ratingMatch[1].replace(",", ".")) : null;

      const typeMatch = meta.match(/\b(TV|Movie|ONA|OVA|Special)\b/i);
      const type = typeMatch ? typeMatch[1].toUpperCase() : null;

      const title = clean(meta.replace(/\b(TV|Movie|ONA|OVA|Special)\b/i, "").replace(/^\s*\d+(?:[.,]\d+)?\s*/,""));

      items.push({ title, url, rating, type });
    }
  });

  // jam biasanya ada di link terpisah atau teks "00:15". 6
  const times = [];
  $("body").text().split(/\s+/).forEach(tok => {
    if (/^\d{2}:\d{2}$/.test(tok)) times.push(tok);
  });

  // gabung heuristik: pasangan urut
  const merged = items.map((it, i) => ({ ...it, time: times[i] || null, day: null }));

  // hari: ambil dari heading/list di halaman (tapi di HTML parse bisa berantakan)
  // kita minimal balikin merged list dulu.
  return { items: merged, days };
}
