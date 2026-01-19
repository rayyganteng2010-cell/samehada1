export const BASE = "https://v1.samehadaku.how";

export async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; VercelScraper/1.0; +https://vercel.com)",
      "accept": "text/html,application/xhtml+xml"
    }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Fetch gagal ${res.status} ${res.statusText} | ${url}\n${text.slice(0, 200)}`);
  }
  return await res.text();
}

export function absUrl(href) {
  if (!href) return null;
  if (href.startsWith("http")) return href;
  if (href.startsWith("//")) return "https:" + href;
  return BASE.replace(/\/$/, "") + (href.startsWith("/") ? href : "/" + href);
}

export function json(res, data, status = 200) {
  return res.status(status).json(data);
}
