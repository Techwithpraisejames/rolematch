export type SearchHit = {
  title: string;
  url: string;
  highlight?: string;
  time_published?: string;
  time_last_crawled?: string;
};

export async function searchJobs(query: string, count = 10): Promise<SearchHit[]> {
  const key = process.env.OCTEN_API_KEY;
  if (!key) throw new Error("Set OCTEN_API_KEY before running a live search.");
  if (!query.trim() || !Number.isInteger(count) || count < 1 || count > 10) {
    throw new Error("Invalid search parameters.");
  }
  const response = await fetch("https://api.octen.ai/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key },
    body: JSON.stringify({ query, count }),
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Octen search failed: " + response.status);
  const payload = await response.json();
  if (payload.code !== 0 || !Array.isArray(payload.data?.results)) {
    throw new Error("Unexpected Octen search response.");
  }
  return payload.data.results.filter((hit: SearchHit) => {
    try {
      return typeof hit.title === "string" && new URL(hit.url).protocol === "https:";
    } catch {
      return false;
    }
  }).map((hit: SearchHit) => ({
    title: hit.title,
    url: hit.url,
    highlight: hit.highlight,
    time_published: hit.time_published,
    time_last_crawled: hit.time_last_crawled,
  }));
}
