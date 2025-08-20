// Vercel Serverless Function — SEC Proxy (FREE)
const UA = "HalalCheckerGoogleSheet/1.0 (mrfaleh91@gmail.com)";
const ALLOW = new Set(["data.sec.gov", "www.sec.gov"]);

async function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }
async function fetchWithBackoff(target, init, retries=4){
  let lastErr;
  for (let i=0; i<retries; i++){
    try{
      await sleep(300 + i*600);                // pacing + backoff
      const res = await fetch(target, init);
      if (res.status === 429 || res.status === 403) throw new Error("HTTP "+res.status);
      if (!res.ok) throw new Error("HTTP "+res.status);
      return res;
    }catch(e){ lastErr = e; }
  }
  throw lastErr || new Error("fetch failed");
}

export default async function handler(req, res){
  try{
    const u = req.query.u;
    if (!u) return res.status(400).send("Missing 'u'");

    let t; try { t = new URL(u); } catch { return res.status(400).send("Bad URL"); }
    if (!ALLOW.has(t.hostname)) return res.status(403).send("Host not allowed");

    const init = {
      method: "GET",
      headers: {
        "User-Agent": UA,
        "Accept": t.hostname === "www.sec.gov" ? "application/json, text/plain" : "application/json",
        "Referer": "https://www.sec.gov/"
      },
      redirect: "follow"
    };

    const resp = await fetchWithBackoff(t.toString(), init);
    const buf = Buffer.from(await resp.arrayBuffer());

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=900");
    res.setHeader("Content-Type", resp.headers.get("content-type") || "application/json");

    return res.status(resp.status).send(buf);
  }catch(e){
    return res.status(502).send(String(e.message || e));
  }
}
