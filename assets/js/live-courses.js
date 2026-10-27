/* ============================================================
   LEARNOVA — live course search (browse page only)
   ------------------------------------------------------------
   Fetches real results from open, CORS-friendly indexes in the
   learner's browser. Nothing is pre-loaded or invented. When an
   index is unreachable it is marked unavailable and the rest keep
   going. Results always link to the original creator.
   ============================================================ */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", init);

  const PAGE_SIZE = 6;
  const REQUEST_TIMEOUT = 11000;
  const DAY_MS = 86400000;
  const RECENT_DAYS = 90;
  const NEW_DAYS = 30;

  const STOPWORDS = new Set([
    "free", "course", "courses", "class", "classes", "online", "best", "top",
    "the", "a", "an", "in", "of", "for", "to", "and", "my", "i", "want", "find",
    "with", "how", "any", "all", "learn", "learning", "study", "full", "tutorial",
    "tutorials", "video", "videos", "beginner", "beginners", "advanced"
  ]);

  const COURSEY_RE = /\b(course|courses|class|classes|lesson|lessons|tutorial|tutorials|learn|learning|teach|teaching|training|bootcamp|curriculum|syllabus|certification|academy|masterclass|basics?|intro(?:duction)?|beginner|beginners|roadmap|lecture|lectures|workshop|playlist|study|school|guide)\b/i;
  const REPO_COURSE_RE = /\b(course|curriculum|roadmap|tutorials?|bootcamp|academy|study plan|education|learning path|syllabus|guide)\b/i;
  const PIRATE_RE = /(udemy|lynda|pluralsight|skillshare|torrent|desire-course|free-course-site|course-for-free|udacity[-_\s]?download|download[-_\s]?course)/i;
  const FRESH_COURSE_RE = /\b(course|courses|class|classes|lesson|lessons|tutorial|tutorials|bootcamp|masterclass|curriculum|syllabus|lecture|lectures|workshop|training)\b/i;
  const FRESH_SKIP_RE = /(dropshipping|internship|scheme|stipend|salary|job guarantee|apply now|earn money|make money|passive income|affiliate|giveaway|forex|binary options|casino|betting|loan|coupon)/i;
  const FRESH_ROUNDUP_RE = /\b(best|top|ultimate list|list of)\b.*\b(courses?|certifications?|certificates?)\b/i;

  /* Known free/open course hosts and academic domains get a free label; other
     course-like web pages are kept only when they explicitly say they are free. */
  const FREE_HOSTS = [
    "khanacademy.org", "nptel.ac.in", "swayam.gov.in", "swayam2.gov.in",
    "freecodecamp.org", "ocw.mit.edu", "cs50.harvard.edu", "pll.harvard.edu",
    "openstax.org", "openlearn.open.ac.uk", "open.edu", "saylor.org", "gcfglobal.org",
    "archive.org", "openlibrary.org", "gutenberg.org",
    "w3schools.com", "developer.mozilla.org", "javascript.info", "python.org",
    "programiz.com", "geeksforgeeks.org", "javatpoint.com", "tutorialspoint.com",
    "learnpython.org", "theodinproject.com", "fullstackopen.com", "exercism.org",
    "roadmap.sh", "code.org", "kaggle.com", "cognitiveclass.ai", "open.hpi.de",
    "developers.google.com", "learn.microsoft.com",
    "mathsisfun.com", "phet.colorado.edu", "ck12.org", "openwho.org", "who.int",
    "musictheory.net", "justinguitar.com", "duolingo.com", "learnvern.com",
    "magnetbrains.com", "ncert.nic.in", "cbseacademic.nic.in", "nios.ac.in",
    "epathshala.nic.in", "diksha.gov.in", "bbc.co.uk", "britishcouncil.org"
  ];
  const WEB_SKIP_RE = /(^|\.)(youtube\.com|youtu\.be|duckduckgo\.com|bing\.com|google\.com|github\.com|wikiversity\.org|dev\.to|facebook\.com|instagram\.com|linkedin\.com|reddit\.com|quora\.com|pinterest\.com|tiktok\.com|x\.com|twitter\.com|medium\.com|bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly)$/i;
  const PAID_WEB_HOST_RE = /(^|\.)(udemy\.com|lynda\.com|pluralsight\.com|skillshare\.com|datacamp\.com|udacity\.com|masterclass\.com|brilliant\.org)$/i;
  const WEB_NOISE_PATH_RE = /\/(answers|questions|forum|forums|threads|discussion|community|qna)(\/|$)/i;

  const SOURCE_DEFS = [
    { id: "youtube", name: "YouTube", run: searchYouTube, dated: true },
    { id: "web", name: "Web", run: searchWeb, via: "DuckDuckGo" },
    { id: "github", name: "GitHub", run: searchGitHub, dated: true },
    { id: "peertube", name: "PeerTube", run: searchPeerTube, dated: true },
    { id: "wikimedia", name: "Wikiversity", run: searchWiki },
    { id: "devto", name: "DEV", run: searchDevTo, dated: true, launch: false }
  ];

  let els = null;
  let activeCtrl = null;
  let searchSeq = 0;
  let busy = false;
  let searched = false;
  let currentQuery = "";
  let sourceState = {};
  let resultsBySource = {};
  let orderedResults = [];
  let shown = PAGE_SIZE;
  let startedAt = 0;
  let liveDirty = false;
  let browseSyncTimer = null;
  let recentOnly = false;
  let recentCutoff = 0;

  /* ---------- text + URL helpers ---------- */
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, m =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }
  function cleanQuery(value) {
    return String(value == null ? "" : value)
      .replace(/\s+/g, " ").trim().slice(0, 120);
  }
  function tidy(value, max) {
    return String(value == null ? "" : value)
      .replace(/\s+/g, " ").trim().slice(0, max || 220);
  }
  function stripTags(value) {
    return tidy(String(value == null ? "" : value)
      .replace(/<[^>]*>/g, " ")
      .replace(/&quot;/g, '"').replace(/&#39;|&rsquo;/g, "'")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " "), 260);
  }
  function normalize(value) {
    return String(value == null ? "" : value)
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}+#.\s-]/gu, " ")
      .replace(/\s+/g, " ").trim();
  }
  function tokensFor(value) {
    const all = normalize(value).split(" ").filter(Boolean);
    const useful = all.filter(t => !STOPWORDS.has(t));
    return useful.length ? useful : all;
  }
  function safeUrl(value) {
    try {
      const url = new URL(value);
      return /^https?:$/.test(url.protocol) ? url.href : "";
    } catch (e) { return ""; }
  }
  function asTimestamp(value) {
    if (value == null || value === "") return 0;
    if (typeof value === "number" && Number.isFinite(value)) {
      return value > 1e12 ? value : value > 1e9 ? value * 1000 : 0;
    }
    const parsed = Date.parse(String(value));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  function dateText(value) {
    const timestamp = asTimestamp(value);
    if (!timestamp) return "";
    const days = Math.max(0, Math.floor((Date.now() - timestamp) / DAY_MS));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 30) return days + " days ago";
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short", day: "numeric", year: "numeric"
    });
  }
  function isNew(item) {
    return Boolean(item && item.publishedAt && Date.now() - item.publishedAt <= NEW_DAYS * DAY_MS);
  }
  function sourceDefsForMode() {
    return recentOnly ? SOURCE_DEFS.filter(def => def.dated && def.launch !== false) : SOURCE_DEFS;
  }
  function freshResultAllowed(item) {
    if (!item || !item.publishedAt) return false;
    const title = item.title || "";
    if (FRESH_SKIP_RE.test(title) || FRESH_ROUNDUP_RE.test(title)) return false;
    if (!FRESH_COURSE_RE.test(title + " " + (item.text || ""))) return false;
    if (item.sourceId === "youtube" && !item.videoCount) {
      if (!FRESH_COURSE_RE.test(title) || Number(item.seconds) < 1200) return false;
    }
    return true;
  }
  function normUrl(value) {
    try {
      const url = new URL(value);
      url.hash = "";
      return url.href.replace(/\/+$/, "");
    } catch (e) { return ""; }
  }
  function isAcademicHost(host) {
    return /(^|\.)(edu|gov)(\.[a-z]{2})?$/.test(host) ||
      /\.(ac|edu|gov)\.[a-z]{2}$/.test(host) ||
      /\.nic\.in$/.test(host);
  }
  function webHostInfo(value) {
    try {
      const host = new URL(value).hostname.toLowerCase().replace(/^www\./, "");
      if (FREE_HOSTS.some(domain => host === domain || host.endsWith("." + domain))) {
        return { free: true, host: host };
      }
      if (isAcademicHost(host)) return { free: false, host: host };
      return null;
    } catch (e) { return null; }
  }
  function relevant(item, tokens) {
    if (!tokens.length) return true;
    const hay = normalize([item.title, item.text, item.meta].filter(Boolean).join(" "));
    return tokens.some(token => hay.includes(token));
  }
  function dedupe(items) {
    const seen = new Set();
    const seenTitles = new Set();
    return (items || []).filter(item => {
      if (!item || !item.title || !item.url) return false;
      const key = normUrl(item.url);
      const titleKey = normalize(item.title + " " + (item.meta || ""));
      if (!key || seen.has(key) || (titleKey && seenTitles.has(titleKey))) return false;
      seen.add(key);
      if (titleKey) seenTitles.add(titleKey);
      return true;
    });
  }

  /* ---------- network ---------- */
  function fetchJSON(url, signal, options) {
    const opts = options || {};
    const ctrl = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      ctrl.abort();
    }, opts.timeout || REQUEST_TIMEOUT);
    const onAbort = () => ctrl.abort();

    if (signal) {
      if (signal.aborted) {
        clearTimeout(timer);
        const err = new Error("cancelled");
        err.name = "AbortError";
        return Promise.reject(err);
      }
      signal.addEventListener("abort", onAbort, { once: true });
    }

    const headers = Object.assign({ Accept: "application/json" }, opts.headers || {});

    return fetch(url, {
      signal: ctrl.signal,
      headers: headers,
      referrerPolicy: "no-referrer"
    })
      .then(response => {
        if (!response.ok) {
          const err = new Error("HTTP " + response.status);
          err.status = response.status;
          throw err;
        }
        return response.json();
      })
      .catch(err => {
        if (timedOut) {
          const timeout = new Error("request timed out");
          timeout.name = "TimeoutError";
          throw timeout;
        }
        if (signal && signal.aborted) {
          const aborted = new Error("cancelled");
          aborted.name = "AbortError";
          throw aborted;
        }
        throw err;
      })
      .finally(() => {
        clearTimeout(timer);
        if (signal) signal.removeEventListener("abort", onAbort);
      });
  }

  function fetchText(url, signal, options) {
    const opts = options || {};
    const ctrl = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      ctrl.abort();
    }, opts.timeout || REQUEST_TIMEOUT);
    const onAbort = () => ctrl.abort();

    if (signal) {
      if (signal.aborted) {
        clearTimeout(timer);
        const err = new Error("cancelled");
        err.name = "AbortError";
        return Promise.reject(err);
      }
      signal.addEventListener("abort", onAbort, { once: true });
    }

    const headers = Object.assign({ Accept: "text/plain" }, opts.headers || {});

    return fetch(url, {
      signal: ctrl.signal,
      headers: headers,
      referrerPolicy: "no-referrer"
    })
      .then(response => {
        if (!response.ok) {
          const err = new Error("HTTP " + response.status);
          err.status = response.status;
          throw err;
        }
        return response.text();
      })
      .catch(err => {
        if (timedOut) {
          const timeout = new Error("request timed out");
          timeout.name = "TimeoutError";
          throw timeout;
        }
        if (signal && signal.aborted) {
          const aborted = new Error("cancelled");
          aborted.name = "AbortError";
          throw aborted;
        }
        throw err;
      })
      .finally(() => {
        clearTimeout(timer);
        if (signal) signal.removeEventListener("abort", onAbort);
      });
  }

  /* ---------- YouTube ---------- */
  const PIPED_HOST = "https://pipedapi.ducks.party";
  const INVIDIOUS_HOSTS = ["https://yt.chocolatemoo53.com", "https://inv.nadeko.net"];

  function pipedItem(item, tokens) {
    if (!item) return null;
    if (item.type === "stream") {
      const title = tidy(item.title, 180);
      const url = safeUrl("https://www.youtube.com" + (item.url || ""));
      const seconds = Number(item.duration) || 0;
      if (!title || !url) return null;
      if (seconds < 1200 && !COURSEY_RE.test(title)) return null;
      const result = {
        sourceId: "youtube", source: "YouTube", title: title, url: url,
        text: tidy(item.shortDescription, 220), meta: tidy(item.uploaderName || "YouTube", 80),
        kind: seconds >= 2400 ? "Video course" : "Video lecture",
        seconds: seconds, views: Number(item.views) || 0,
        publishedAt: asTimestamp(item.uploaded)
      };
      return relevant(result, tokens) ? result : null;
    }
    if (item.type === "playlist") {
      const match = String(item.url || "").match(/[?&]list=([^&]+)/);
      const title = tidy(item.name || item.title, 180);
      const count = Number(item.videos) || 0;
      if (!match || !title || count < 2) return null;
      const result = {
        sourceId: "youtube", source: "YouTube", title: title,
        url: "https://www.youtube.com/playlist?list=" + encodeURIComponent(match[1]),
        text: "", meta: tidy(item.uploaderName || "YouTube", 80),
        kind: "Course playlist", videoCount: count,
        publishedAt: asTimestamp(item.uploaded)
      };
      return relevant(result, tokens) ? result : null;
    }
    return null;
  }

  function invidiousVideo(video, tokens) {
    if (!video || !video.videoId || !video.title) return null;
    const title = tidy(video.title, 180);
    const seconds = Number(video.lengthSeconds) || 0;
    if (seconds < 1200 && !COURSEY_RE.test(title)) return null;
    const result = {
      sourceId: "youtube", source: "YouTube", title: title,
      url: "https://www.youtube.com/watch?v=" + encodeURIComponent(video.videoId),
      text: tidy(video.description, 220), meta: tidy(video.author || "YouTube", 80),
      kind: seconds >= 2400 ? "Video course" : "Video lecture",
      seconds: seconds, views: Number(video.viewCount) || 0,
      publishedAt: asTimestamp(video.published)
    };
    return relevant(result, tokens) ? result : null;
  }

  function invidiousPlaylist(playlist, tokens) {
    if (!playlist || !playlist.playlistId || !playlist.title) return null;
    const result = {
      sourceId: "youtube", source: "YouTube", title: tidy(playlist.title, 180),
      url: "https://www.youtube.com/playlist?list=" + encodeURIComponent(playlist.playlistId),
      text: "", meta: tidy(playlist.author || "YouTube", 80),
      kind: "Course playlist", videoCount: Number(playlist.videoCount) || 0,
      publishedAt: asTimestamp(playlist.published)
    };
    return relevant(result, tokens) ? result : null;
  }

  async function invidiousSearch(query, signal, tokens) {
    let lastError = null;
    for (const host of INVIDIOUS_HOSTS) {
      try {
        const [videos, playlists] = await Promise.all([
          fetchJSON(host + "/api/v1/search?q=" + encodeURIComponent(query) + "&type=video", signal),
          fetchJSON(host + "/api/v1/search?q=" + encodeURIComponent(query) + "&type=playlist", signal)
        ]);
        const items = (Array.isArray(videos) ? videos : []).map(v => invidiousVideo(v, tokens))
          .concat((Array.isArray(playlists) ? playlists : []).map(p => invidiousPlaylist(p, tokens)));
        const clean = dedupe(items);
        if (clean.length) return clean;
      } catch (err) {
        if (err && err.name === "AbortError") throw err;
        lastError = err;
      }
    }
    if (lastError) throw lastError;
    return [];
  }

  async function searchYouTube(query, signal, options) {
    let search = /\b(course|playlist|tutorial)\b/i.test(query) ? query : query + " full course";
    if (options && options.recent) {
      const year = String(new Date().getFullYear());
      if (!new RegExp("\\b" + year + "\\b").test(search)) search += " " + year;
    }
    const tokens = tokensFor(query);
    let items = [];
    let pipedAnswered = false;
    try {
      const json = await fetchJSON(PIPED_HOST + "/search?q=" + encodeURIComponent(search) + "&filter=all", signal);
      pipedAnswered = true;
      items = dedupe((json.items || []).map(item => pipedItem(item, tokens)));
    } catch (err) {
      if (err && err.name === "AbortError") throw err;
    }
    if (!items.length) {
      try {
        items = await invidiousSearch(search, signal, tokens);
      } catch (err) {
        if (err && err.name === "AbortError") throw err;
        if (!pipedAnswered) throw err;
      }
    }
    return items.slice(0, 10);
  }

  /* ---------- GitHub ---------- */
  async function searchGitHub(query, signal, options) {
    const tokens = tokensFor(query);
    let search = query + " course in:name,description";
    if (options && options.recent) {
      search += " created:>" + new Date(Date.now() - RECENT_DAYS * DAY_MS).toISOString().slice(0, 10);
    }
    const url = "https://api.github.com/search/repositories?q=" +
      encodeURIComponent(search) + "&sort=stars&order=desc&per_page=12";
    const json = await fetchJSON(url, signal, {
      headers: { Accept: "application/vnd.github+json" }
    });
    const items = (json.items || []).map(repo => {
      const title = tidy(String(repo.name || "").replace(/[-_]+/g, " "), 140);
      const description = tidy(repo.description || "", 220);
      const topics = (repo.topics || []).join(" ");
      const hay = [repo.name, repo.description, topics].filter(Boolean).join(" ");
      if (!title || PIRATE_RE.test(hay) || !REPO_COURSE_RE.test(hay)) return null;
      if (!tokens.some(token => normalize(title).includes(token))) return null;
      const result = {
        sourceId: "github", source: "GitHub", title: title,
        url: safeUrl(repo.html_url),
        text: [description, topics].filter(Boolean).join(" · "),
        meta: tidy(repo.full_name || "github.com", 90),
        kind: "Course repository", stars: Number(repo.stargazers_count) || 0,
        publishedAt: asTimestamp(repo.created_at)
      };
      if (!result.url) return null;
      return relevant(result, tokens) ? result : null;
    });
    return dedupe(items).slice(0, 8);
  }

  /* ---------- PeerTube ---------- */
  async function searchPeerTube(query, signal, options) {
    const tokens = tokensFor(query);
    const search = /\bcourse\b/i.test(query) ? query : query + " course";
    const count = options && options.recent ? 50 : 20;
    const url = "https://sepiasearch.org/api/v1/search/videos?search=" +
      encodeURIComponent(search) + "&count=" + count + "&nsfw=false";
    const json = await fetchJSON(url, signal);
    const items = (json.data || []).map(video => {
      if (!video || !video.name || !video.account || !video.uuid) return null;
      const title = tidy(video.name, 180);
      const seconds = Number(video.duration) || 0;
      if (seconds < 600 || (!COURSEY_RE.test(title) && seconds < 1800)) return null;
      if (PIRATE_RE.test(title)) return null;
      const host = tidy(video.account.host, 90);
      const titleKey = normalize(title);
      if (!tokens.some(token => titleKey.includes(token)) && !COURSEY_RE.test(title)) return null;
      const result = {
        sourceId: "peertube", source: "PeerTube", title: title,
        url: safeUrl("https://" + host + "/w/" + video.uuid),
        text: tidy(video.description, 220), meta: host,
        kind: "Video course", seconds: seconds, views: Number(video.views) || 0,
        publishedAt: asTimestamp(video.publishedAt || video.createdAt)
      };
      if (!result.url) return null;
      return relevant(result, tokens) ? result : null;
    });
    return dedupe(items).slice(0, 6);
  }

  /* ---------- Wikiversity ---------- */
  async function searchWiki(query, signal) {
    const tokens = tokensFor(query);
    const terms = (tokens.length ? tokens : normalize(query).split(" ").filter(Boolean))
      .map(word => '"' + word.replace(/"/g, "") + '"').join(" ");
    if (!terms) return [];
    const url = "https://en.wikiversity.org/w/api.php?action=query&list=search&srnamespace=0&srlimit=12" +
      "&srsearch=" + encodeURIComponent(terms) + "&format=json&origin=*";
    const json = await fetchJSON(url, signal);
    const items = (((json.query || {}).search) || []).map(hit => {
      if (!hit || !hit.title || /print version/i.test(hit.title)) return null;
      const title = tidy(hit.title, 180);
      const titleKey = normalize(title);
      if (tokens.length && !tokens.some(token =>
        titleKey.includes(token) || (token === "maths" && titleKey.includes("math")))) return null;
      return {
        sourceId: "wikimedia", source: "Wikiversity", title: title,
        url: safeUrl("https://en.wikiversity.org/wiki/" + encodeURIComponent(String(hit.title).replace(/ /g, "_"))),
        text: stripTags(hit.snippet), meta: "wikiversity.org",
        kind: "Open learning page"
      };
    });
    return dedupe(items).slice(0, 6);
  }

  /* ---------- DEV Community ---------- */
  async function searchDevTo(query, signal, options) {
    const tokens = tokensFor(query);
    const tag = tokens.find(token => /^[a-z][a-z0-9]{1,19}$/.test(token));
    if (!tag) return [];
    let json = [];
    try {
      const endpoint = options && options.recent
        ? "https://dev.to/api/articles/latest"
        : "https://dev.to/api/articles";
      const perPage = options && options.recent ? 20 : 10;
      json = await fetchJSON(endpoint + "?tag=" +
        encodeURIComponent(tag) + "&per_page=" + perPage, signal);
    } catch (err) {
      if (err && (err.name === "AbortError" || err.status === 404)) {
        if (err.name === "AbortError") throw err;
        return [];
      }
      throw err;
    }
    const items = (Array.isArray(json) ? json : []).map(article => {
      if (!article || !article.title || !article.url) return null;
      const hay = [article.title, article.description].filter(Boolean).join(" ");
      if (PIRATE_RE.test(hay) || !COURSEY_RE.test(hay)) return null;
      const result = {
        sourceId: "devto", source: "DEV Community", title: tidy(article.title, 180),
        url: safeUrl(article.url), text: tidy(article.description, 220),
        meta: "dev.to", kind: "Tutorial", minutes: Number(article.reading_time_minutes) || 0,
        publishedAt: asTimestamp(article.published_at)
      };
      if (!result.url) return null;
      return relevant(result, tokens) ? result : null;
    });
    return dedupe(items).slice(0, 5);
  }

  /* ---------- Open web (DuckDuckGo via Jina Reader) ---------- */
  function unwrapDDG(raw) {
    try {
      const url = new URL(String(raw).replace(/&amp;/g, "&"));
      const host = url.hostname.toLowerCase();
      if (host === "duckduckgo.com" || host.endsWith(".duckduckgo.com")) {
        if (url.pathname === "/l/" || url.pathname === "/l") {
          return url.searchParams.get("uddg") || "";
        }
        return "";
      }
      return url.href;
    } catch (e) { return ""; }
  }

  function stripMarkdown(value) {
    return tidy(String(value == null ? "" : value)
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[*_`~#>]/g, " ")
      .replace(/\\([\[\]()])/g, "$1")
      .replace(/&quot;/g, '"').replace(/&#39;|&rsquo;/g, "'")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " "), 320);
  }

  function parseWebResults(markdown, tokens) {
    const lines = String(markdown || "").split(/\r?\n/);
    const out = [];
    const seen = new Set();
    const seenHosts = new Set();
    for (let index = 0; index < lines.length; index++) {
      const match = lines[index].match(/^##\s+\[(.+?)\]\((https?:\/\/[^)\s]+)\)/);
      if (!match) continue;
      const title = stripMarkdown(match[1]);
      const rawUrl = unwrapDDG(match[2]);
      if (!title || !rawUrl) continue;
      let parsed;
      try { parsed = new URL(rawUrl); } catch (e) { continue; }
      if (WEB_NOISE_PATH_RE.test(parsed.pathname)) continue;
      const url = safeUrl(parsed.href);
      if (!url) continue;
      const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
      if (WEB_SKIP_RE.test(host) || PAID_WEB_HOST_RE.test(host) || seenHosts.has(host)) continue;
      const info = webHostInfo(url);

      let snippet = "";
      for (let next = index + 1; next < lines.length && !/^##\s+\[/.test(lines[next]); next++) {
        const text = stripMarkdown(lines[next]);
        if (text.length > snippet.length) snippet = text;
      }
      const hay = [title, snippet].filter(Boolean).join(" ");
      if (PIRATE_RE.test(url + " " + hay) || !COURSEY_RE.test(hay)) continue;
      if (!(info && info.free) && !/\bfree\b/i.test(hay)) continue;
      if (tokens.length) {
        const hayKey = normalize(hay + " " + host);
        if (!tokens.some(token => hayKey.includes(token))) continue;
      }
      const key = normUrl(url);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      seenHosts.add(host);
      out.push({
        sourceId: "web", source: "Web", title: title, url: url,
        text: snippet, meta: info ? info.host : host,
        kind: info && info.free ? "Free website" : "Web page"
      });
      if (out.length >= 8) break;
    }
    return out;
  }

  async function searchWeb(query, signal) {
    const tokens = tokensFor(query);
    let search = query;
    if (!/\bfree\b/i.test(search)) search += " free";
    if (!COURSEY_RE.test(search)) search += " course";
    const target = "https://html.duckduckgo.com/html/?q=" + encodeURIComponent(search);
    const markdown = await fetchText("https://r.jina.ai/" + target, signal, { timeout: 16000 });
    return dedupe(parseWebResults(markdown, tokens)).slice(0, 8);
  }

  /* ---------- rendering ---------- */
  function durationText(item) {
    if (item.videoCount) return item.videoCount + (item.videoCount === 1 ? " video" : " videos");
    if (item.minutes) return Math.round(item.minutes) + " min read";
    if (item.seconds) {
      const minutes = Math.round(item.seconds / 60);
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const rest = minutes % 60;
        return hours + "h" + (rest ? " " + rest + "m" : "");
      }
      return minutes + " min";
    }
    return "";
  }
  function countText(value) {
    const n = Number(value) || 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return n ? String(n) : "";
  }

  function cardHTML(item) {
    const meta = [];
    if (item.meta) meta.push(item.meta);
    const duration = durationText(item);
    if (duration) meta.push(duration);
    if (item.views) meta.push(countText(item.views) + " views");
    if (item.stars) meta.push(countText(item.stars) + " stars");
    const published = dateText(item.publishedAt);
    if (published) meta.push(published);
    const newBadge = isNew(item) ? "New" : (recentOnly && item.publishedAt ? "Recent" : "");
    const label = item.title + " — " + item.source + " " + item.kind +
      (published ? " published " + published : "") + " (opens in a new tab)";
    return '<a class="live-card" href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer"' +
      ' data-source="' + esc(item.sourceId) + '" aria-label="' + esc(label) + '">' +
        '<div class="live-card-top">' +
          '<span class="live-source-tag" data-source="' + esc(item.sourceId) + '">' + esc(item.source) + "</span>" +
          '<span class="live-card-badges">' +
            (newBadge ? '<span class="live-new-badge' + (newBadge === "Recent" ? " is-recent" : "") + '">' + newBadge + "</span>" : "") +
            '<span class="live-kind">' + esc(item.kind) + "</span>" +
          "</span>" +
        "</div>" +
        "<h3>" + esc(item.title) + "</h3>" +
        (item.text ? "<p>" + esc(item.text) + "</p>" : "<p></p>") +
        '<div class="live-card-meta">' + meta.map(value => "<span>" + esc(value) + "</span>").join("") + "</div>" +
        '<span class="live-card-cta">Open original <span aria-hidden="true">↗</span></span>' +
      "</a>";
  }

  function renderSources() {
    if (!els) return;
    els.sources.innerHTML = sourceDefsForMode().map(def => {
      const state = sourceState[def.id] || { state: "idle" };
      const text = state.state === "busy" ? "checking"
        : state.state === "ok" ? String(state.count)
        : state.state === "fail" ? "unavailable"
        : "waiting";
      const title = def.name + (def.via ? " via " + def.via : "") + ": " + (state.state === "ok"
        ? state.count + (state.count === 1 ? " result" : " results")
        : text);
      return '<li class="live-source is-' + esc(state.state) + '" title="' + esc(title) + '">' +
        '<span class="dot" aria-hidden="true"></span>' + esc(def.name) +
        " <b>" + esc(text) + "</b></li>";
    }).join("");
    els.sources.hidden = false;
  }

  function renderCards() {
    const cards = orderedResults.slice(0, shown);
    els.grid.innerHTML = cards.map(cardHTML).join("");
    els.grid.hidden = cards.length === 0;
    els.grid.setAttribute("data-mode", recentOnly ? "recent" : "all");
    const remaining = Math.max(0, orderedResults.length - shown);
    els.more.hidden = remaining === 0 || busy;
    els.moreBtn.textContent = "Show " + Math.min(PAGE_SIZE, remaining) +
      (recentOnly ? " more newly launched " : " more live ") +
      (Math.min(PAGE_SIZE, remaining) === 1 ? "result" : "results");
  }

  function updateProgress() {
    if (!busy) return;
    const total = Object.keys(resultsBySource).reduce((sum, id) => sum + resultsBySource[id].length, 0);
    const defs = sourceDefsForMode();
    const remaining = defs.filter(def => (sourceState[def.id] || {}).state === "busy").length;
    if (total) {
      els.status.innerHTML = "Found <strong>" + total + "</strong> " +
        (recentOnly ? "newly launched " : "live ") +
        (total === 1 ? "result" : "results") + " so far — still checking " +
        remaining + " " + (remaining === 1 ? "source" : "sources") + "…";
    } else {
      els.status.innerHTML = "Searching <strong>" + defs.length + " " +
        (recentOnly ? "dated " : "") + "live sources</strong> for " +
        (recentOnly ? "newly launched " : "") + "<strong>" + esc(currentQuery) + "</strong>…";
    }
  }

  function setEmpty(title, text) {
    els.emptyTitle.textContent = title;
    els.emptyText.textContent = text;
    els.empty.hidden = false;
    els.grid.hidden = true;
  }

  function updateFreshUI() {
    if (!els) return;
    els.fresh.classList.toggle("is-active", recentOnly);
    els.freshBtn.textContent = recentOnly ? "Refresh newly launched" : "Show newly launched";
    els.freshBtn.setAttribute("aria-pressed", recentOnly ? "true" : "false");
    els.freshActive.hidden = !recentOnly;
  }

  function updateFreshParam(active) {
    const params = new URLSearchParams(location.search);
    if (active) params.set("fresh", "1");
    else params.delete("fresh");
    const qs = params.toString();
    try {
      history.replaceState(null, "", "courses.html" + (qs ? "?" + qs : "") + location.hash);
    } catch (e) {}
  }

  function finishSearch() {
    busy = false;
    searched = true;
    els.btn.disabled = false;
    els.btn.removeAttribute("aria-busy");
    els.btn.textContent = "Search live web";
    els.loading.hidden = true;
    updateFreshUI();

    orderedResults = collectOrdered();
    const total = orderedResults.length;
    const defs = sourceDefsForMode();
    const answered = defs.filter(def => (sourceState[def.id] || {}).state === "ok").length;
    const failed = defs.filter(def => (sourceState[def.id] || {}).state === "fail").length;
    const elapsed = ((performance.now() - startedAt) / 1000).toFixed(1);

    if (total) {
      els.status.innerHTML = recentOnly
        ? "Found <strong>" + total + "</strong> newly launched " +
          (total === 1 ? "result" : "results") + " for <strong>" + esc(currentQuery) +
          "</strong> · published in the last " + RECENT_DAYS + " days · " +
          answered + " of " + defs.length + " dated sources answered" +
          (failed ? " · " + failed + " unavailable" : "") + " · " + elapsed + "s."
        : "Found <strong>" + total + "</strong> live " +
          (total === 1 ? "result" : "results") + " for <strong>" + esc(currentQuery) + "</strong> · " +
          answered + " of " + defs.length + " sources answered" +
          (failed ? " · " + failed + " unavailable" : "") + " · " + elapsed + "s.";
      els.empty.hidden = true;
      renderCards();
    } else {
      const allFailed = failed === defs.length;
      els.status.innerHTML = allFailed
        ? "No live source answered. Check your connection and try again."
        : recentOnly
          ? "No results published in the last " + RECENT_DAYS + " days for <strong>" + esc(currentQuery) + "</strong>."
          : "No live results for <strong>" + esc(currentQuery) + "</strong> in the sources that answered.";
      setEmpty(
        allFailed ? "Live search is unavailable right now"
          : recentOnly ? "No newly launched matches for “" + currentQuery + "”"
          : "No live matches for “" + currentQuery + "”",
        allFailed
          ? "The open indexes did not respond. Try again in a moment, or use the full live scan for a wider search."
          : recentOnly
            ? "The dated sources answered, but nothing was published in the last " + RECENT_DAYS +
              " days. Try another topic, or show all-time results."
            : "The sources answered, but nothing relevant came back. Try a shorter topic, or open the full live scan for more sources."
      );
    }
    els.freshEmptyBtn.hidden = !recentOnly || total > 0;
    els.scanLink.href = "scan.html" + (currentQuery ? "?q=" + encodeURIComponent(currentQuery) : "");
  }

  function collectOrdered() {
    const buckets = sourceDefsForMode().map(def => resultsBySource[def.id] || []);
    const out = [];
    const seen = new Set();
    for (let index = 0; ; index++) {
      let added = false;
      for (const bucket of buckets) {
        const item = bucket[index];
        if (!item) continue;
        added = true;
        const key = normUrl(item.url);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(item);
      }
      if (!added) break;
    }
    if (recentOnly) out.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));
    return out;
  }

  function resetResults() {
    if (activeCtrl) activeCtrl.abort();
    activeCtrl = null;
    searchSeq++;
    busy = false;
    searched = false;
    currentQuery = "";
    recentOnly = false;
    recentCutoff = 0;
    sourceState = {};
    resultsBySource = {};
    orderedResults = [];
    shown = PAGE_SIZE;
    els.btn.disabled = false;
    els.btn.removeAttribute("aria-busy");
    els.btn.textContent = "Search live web";
    els.grid.innerHTML = "";
    els.grid.hidden = true;
    els.loading.hidden = true;
    els.empty.hidden = true;
    els.more.hidden = true;
    els.sources.innerHTML = "";
    els.sources.hidden = true;
    els.freshEmptyBtn.hidden = true;
    updateFreshUI();
  }

  function setReady(query) {
    resetResults();
    updateFreshParam(false);
    const clean = cleanQuery(query);
    els.status.innerHTML = clean
      ? "Ready to search the live indexes for <strong>" + esc(clean) + "</strong>."
      : "Type a topic, or choose a suggestion above.";
    updateLinks(clean);
  }

  function updateLinks(query) {
    const clean = cleanQuery(query);
    const searchFor = clean || "free courses";
    const googleFor = clean
      ? clean + (/\b(free|course|courses|class|classes|tutorial|tutorials|lesson|lessons)\b/i.test(clean) ? "" : " free course")
      : "free courses";
    els.googleLink.href = "https://www.google.com/search?q=" + encodeURIComponent(googleFor);
    els.edxLink.href = "https://www.edx.org/search?q=" + encodeURIComponent(searchFor);
    els.courseraLink.href = "https://www.coursera.org/search?query=" + encodeURIComponent(searchFor);
    els.scanLink.href = "scan.html" + (clean ? "?q=" + encodeURIComponent(clean) : "");
    els.fullScanLink.href = els.scanLink.href;
  }

  function runSearch(rawQuery, options) {
    const query = cleanQuery(rawQuery);
    const wantsRecent = Boolean(options && options.recent);
    if (!query) {
      setReady("");
      els.input.focus();
      return;
    }
    if (busy && query === currentQuery && recentOnly === wantsRecent) return;

    if (activeCtrl) activeCtrl.abort();
    activeCtrl = new AbortController();
    const signal = activeCtrl.signal;
    const seq = ++searchSeq;

    liveDirty = true;
    busy = true;
    searched = true;
    currentQuery = query;
    recentOnly = wantsRecent;
    updateFreshParam(recentOnly);
    recentCutoff = Date.now() - RECENT_DAYS * DAY_MS;
    startedAt = performance.now();
    shown = PAGE_SIZE;
    sourceState = {};
    resultsBySource = {};
    orderedResults = [];
    const defs = sourceDefsForMode();
    defs.forEach(def => { sourceState[def.id] = { state: "busy", count: 0 }; });

    els.input.value = query;
    els.btn.disabled = true;
    els.btn.setAttribute("aria-busy", "true");
    els.btn.textContent = "Searching…";
    els.status.innerHTML = "Searching <strong>" + defs.length + " " +
      (recentOnly ? "dated " : "") + "live sources</strong> for " +
      (recentOnly ? "newly launched " : "") + "<strong>" + esc(query) + "</strong>…";
    els.grid.innerHTML = "";
    els.grid.hidden = true;
    els.empty.hidden = true;
    els.more.hidden = true;
    els.loading.hidden = false;
    els.sources.hidden = false;
    els.freshEmptyBtn.hidden = true;
    updateFreshUI();
    updateLinks(query);
    renderSources();

    const tasks = defs.map(def => {
      return def.run(query, signal, { recent: recentOnly })
        .then(items => {
          if (seq !== searchSeq) return;
          let clean = dedupe(items || []);
          if (recentOnly) clean = clean.filter(item =>
            item.publishedAt && item.publishedAt >= recentCutoff && freshResultAllowed(item));
          sourceState[def.id] = { state: "ok", count: clean.length };
          resultsBySource[def.id] = clean;
          renderSources();
          updateProgress();
        })
        .catch(err => {
          if (seq !== searchSeq) return;
          if (err && err.name === "AbortError") return;
          sourceState[def.id] = { state: "fail", count: 0 };
          resultsBySource[def.id] = [];
          renderSources();
          updateProgress();
        });
    });

    Promise.allSettled(tasks).then(() => {
      if (seq !== searchSeq) return;
      finishSearch();
    });
  }

  /* ---------- initial query + events ---------- */
  function initialQuery() {
    const params = new URLSearchParams(location.search);
    const q = cleanQuery(params.get("q") || "");
    if (q) return q;
    const subjects = [];
    params.getAll("subject").forEach(value => {
      String(value).split(",").forEach(part => {
        if (part.trim()) subjects.push(part.trim());
      });
    });
    if (subjects.length === 1 && window.LN_DATA) {
      const subject = (window.LN_DATA.subjects || []).find(item => item.id === subjects[0]);
      if (subject) return subject.name;
    }
    return "";
  }

  function init() {
    const section = document.getElementById("liveCourses");
    if (!section) return;

    els = {
      section: section,
      form: document.getElementById("liveSearchForm"),
      input: document.getElementById("liveSearchInput"),
      btn: document.getElementById("liveSearchBtn"),
      quick: document.getElementById("liveQuick"),
      status: document.getElementById("liveStatus"),
      sources: document.getElementById("liveSources"),
      loading: document.getElementById("liveLoading"),
      grid: document.getElementById("liveGrid"),
      empty: document.getElementById("liveEmpty"),
      emptyTitle: document.getElementById("liveEmptyTitle"),
      emptyText: document.getElementById("liveEmptyText"),
      retry: document.getElementById("liveRetryBtn"),
      scanLink: document.getElementById("liveScanLink"),
      more: document.getElementById("liveMoreWrap"),
      moreBtn: document.getElementById("liveMoreBtn"),
      fresh: document.getElementById("liveFresh"),
      freshBtn: document.getElementById("liveFreshBtn"),
      freshActive: document.getElementById("liveFreshActive"),
      freshClearBtn: document.getElementById("liveFreshClearBtn"),
      freshEmptyBtn: document.getElementById("liveFreshEmptyBtn"),
      googleLink: document.getElementById("liveGoogleLink"),
      edxLink: document.getElementById("liveEdxLink"),
      courseraLink: document.getElementById("liveCourseraLink"),
      fullScanLink: document.getElementById("liveFullScanLink")
    };

    const initial = initialQuery();
    const initialFresh = new URLSearchParams(location.search).get("fresh") === "1";
    if (initial) els.input.value = initial;
    setReady(initial);

    els.form.addEventListener("submit", event => {
      event.preventDefault();
      runSearch(els.input.value, { recent: false });
    });

    els.input.addEventListener("input", () => {
      const value = cleanQuery(els.input.value);
      liveDirty = Boolean(value);
      if (!value) {
        setReady("");
        return;
      }
      if (!busy && searched && value !== currentQuery) {
        els.status.innerHTML = "Press <strong>Search live web</strong> to look for <strong>" +
          esc(value) + "</strong>.";
      } else if (!searched) {
        els.status.innerHTML = "Ready to search the live indexes for <strong>" + esc(value) + "</strong>.";
      }
      updateLinks(value);
    });

    els.quick.addEventListener("click", event => {
      const button = event.target.closest("[data-live-query]");
      if (!button) return;
      runSearch(button.getAttribute("data-live-query"), { recent: false });
    });

    els.freshBtn.addEventListener("click", () => {
      const query = cleanQuery(els.input.value) || currentQuery || "free course";
      els.input.value = query;
      runSearch(query, { recent: true });
    });

    const clearFresh = () => {
      const query = cleanQuery(els.input.value) || currentQuery;
      if (query) runSearch(query, { recent: false });
      else setReady("");
    };
    els.freshClearBtn.addEventListener("click", clearFresh);
    els.freshEmptyBtn.addEventListener("click", clearFresh);

    els.moreBtn.addEventListener("click", () => {
      const firstNew = shown;
      shown += PAGE_SIZE;
      renderCards();
      const cards = els.grid.querySelectorAll(".live-card");
      if (cards[firstNew]) {
        try { cards[firstNew].focus({ preventScroll: true }); }
        catch (e) { cards[firstNew].focus(); }
      }
    });

    els.retry.addEventListener("click", () => {
      runSearch(currentQuery || els.input.value, { recent: recentOnly });
    });

    const browseSearch = document.getElementById("browseSearch");
    if (browseSearch) {
      browseSearch.addEventListener("input", () => {
        if (liveDirty || busy) return;
        clearTimeout(browseSyncTimer);
        browseSyncTimer = setTimeout(() => {
          if (liveDirty || busy) return;
          const value = cleanQuery(browseSearch.value);
          if (value === cleanQuery(els.input.value)) return;
          els.input.value = value;
          setReady(value);
        }, 350);
      });
    }

    if (initialFresh) {
      const query = initial || "free course";
      els.input.value = query;
      runSearch(query, { recent: true });
    }

    window.addEventListener("beforeunload", () => {
      if (activeCtrl) activeCtrl.abort();
    });
  }
})();
