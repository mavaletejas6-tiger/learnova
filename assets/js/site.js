/* ============================================================
   LEARNOVA — shared front-end runtime
   ------------------------------------------------------------
   Catalogue search, saved courses, progress, reviews, profiles,
   header behaviour, and the global search suggestions.

   Local-first: everything works with no backend. If Supabase is
   configured in config.js, sign-in and saved/review data sync.
   ============================================================ */
(function () {
  "use strict";

  const D = window.LN_DATA;
  if (!D) {
    console.warn("Learnova data did not load.");
    return;
  }

  const PROVIDERS = D.providers || {};
  const SUBJECTS = D.subjects || [];
  const COURSES = D.courses || [];
  const COLLECTIONS = D.collections || [];
  const SUBJECT_MAP = {};
  SUBJECTS.forEach(s => { SUBJECT_MAP[s.id] = s; });
  const COURSE_MAP = {};
  COURSES.forEach(c => { COURSE_MAP[c.id] = c; });
  const CFG = window.LEARNOVA_CONFIG || {};
  const DB_CONFIGURED = Boolean(CFG.supabaseUrl && CFG.supabaseAnonKey);
  const PREFIX = "lnv1_";

  /* ---------- tiny helpers ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, m =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const normalize = s => String(s == null ? "" : s)
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}+#.\s-]/gu, " ")
    .replace(/\s+/g, " ").trim();
  const scoreText = n => (Math.round(Number(n || 0) * 10) / 10).toFixed(1);
  const plural = (n, one, many) => n === 1 ? one : (many || one + "s");
  const coursePath = id => "course.html?id=" + encodeURIComponent(id);
  const scanPath = q => "scan.html" + (q ? "?q=" + encodeURIComponent(q) : "");
  const browsePath = params => {
    const p = new URLSearchParams();
    Object.keys(params || {}).forEach(k => {
      const v = params[k];
      if (Array.isArray(v)) v.forEach(x => { if (x) p.append(k, x); });
      else if (v !== undefined && v !== null && String(v) !== "") p.set(k, v);
    });
    return "courses.html" + (p.toString() ? "?" + p.toString() : "");
  };

  const read = (key, fallback) => {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (!raw) return fallback;
      const value = JSON.parse(raw);
      return value == null ? fallback : value;
    } catch (e) { return fallback; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) {}
  };

  /* ---------- local state ---------- */
  let saved = new Set(Array.isArray(read("saved", [])) ? read("saved", []) : []);
  let progress = read("progress", {}) || {};
  let localProfile = read("profile", null);
  let localReviews = read("reviews", {}) || {};
  let recent = Array.isArray(read("recent", [])) ? read("recent", []) : [];
  let remoteUser = null;
  let sb = null;
  let supabasePromise = null;

  if (!(progress && typeof progress === "object" && !Array.isArray(progress))) progress = {};
  if (!(localReviews && typeof localReviews === "object" && !Array.isArray(localReviews))) localReviews = {};

  const subjectOf = c => SUBJECT_MAP[c && c.subject] || { id: "other", name: "Other", icon: "📚", c1: "#1B1F4B", c2: "#4F5BD5" };
  const providerOf = c => PROVIDERS[c && c.provider] || { name: "Independent", initials: "L", color: "#151C3B", text: "#fff", type: "Independent", url: "#", about: "" };
  const courseOf = id => COURSE_MAP[id] || null;
  const getProfile = () => remoteUser
    ? {
        name: (remoteUser.user_metadata && remoteUser.user_metadata.full_name) || (remoteUser.email || "Learner").split("@")[0],
        email: remoteUser.email || "",
        remote: true
      }
    : (localProfile || null);
  const getStatus = id => {
    if (progress[id] === "learning" || progress[id] === "completed") return progress[id];
    return saved.has(id) ? "saved" : null;
  };

  function persistSaved() {
    write("saved", Array.from(saved));
    write("progress", progress);
    dispatchState();
  }

  function avatarLetter(name) {
    const n = String(name || "").trim();
    return n ? n.charAt(0).toUpperCase() : "L";
  }

  function formatDate(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function firstName(name) {
    return String(name || "").trim().split(/\s+/)[0] || "Learner";
  }

  /* ---------- search ---------- */
  const STOPWORDS = new Set([
    "a", "an", "and", "the", "of", "for", "to", "in", "on", "with", "at", "by",
    "free", "course", "courses", "class", "classes", "online", "best", "top",
    "learn", "learning", "study", "i", "want", "find", "me", "my", "from"
  ]);

  function courseHaystack(c) {
    const s = subjectOf(c);
    const p = providerOf(c);
    return normalize([
      c.title, c.short, c.description, c.institution, p.name, s.name,
      c.level, c.language, c.target, (c.skills || []).join(" "),
      (c.syllabus || []).join(" "), c.instructor
    ].filter(Boolean).join(" "));
  }

  const HAYSTACKS = {};
  COURSES.forEach(c => { HAYSTACKS[c.id] = courseHaystack(c); });

  function searchCourses(query, limit) {
    const q = normalize(query);
    if (!q) return [];
    const tokens = q.split(" ").filter(Boolean);
    const significant = tokens.filter(t => !STOPWORDS.has(t));
    const terms = significant.length ? significant : tokens;
    const rows = [];

    COURSES.forEach(c => {
      const hay = HAYSTACKS[c.id] || courseHaystack(c);
      const title = normalize(c.title);
      const providerName = normalize(providerOf(c).name + " " + c.institution);
      const hits = terms.filter(t => hay.includes(t));
      if (!hits.length) return;
      if (hits.length < terms.length && terms.length > 1) return;

      let score = 0;
      if (title.includes(q)) score += 80;
      terms.forEach(t => {
        if (title.includes(t)) score += 16;
        if (normalize(c.short).includes(t)) score += 8;
        if (providerName.includes(t)) score += 6;
        if (normalize((c.skills || []).join(" ")).includes(t)) score += 5;
        if (normalize(c.subject).includes(t) || normalize(subjectOf(c).name).includes(t)) score += 5;
      });
      score += Number(c.popularity || 0) / 40;
      rows.push({ course: c, score });
    });

    rows.sort((a, b) => b.score - a.score || Number(b.course.score) - Number(a.course.score));
    return (typeof limit === "number" ? rows.slice(0, limit) : rows);
  }

  function matchesQuery(c, query) {
    const q = normalize(query);
    if (!q) return true;
    const terms = q.split(" ").filter(t => t && !STOPWORDS.has(t));
    if (!terms.length) return true;
    const hay = HAYSTACKS[c.id] || courseHaystack(c);
    return terms.every(t => hay.includes(t));
  }

  /* ---------- state change ---------- */
  function dispatchState() {
    try {
      window.dispatchEvent(new CustomEvent("ln:state", {
        detail: {
          saved: Array.from(saved),
          progress: Object.assign({}, progress),
          profile: getProfile(),
          recent: recent.slice()
        }
      }));
    } catch (e) {}
  }

  function updateSaveButtons(id) {
    const status = getStatus(id);
    $$("[data-save]").forEach(btn => {
      if (btn.getAttribute("data-save") !== id) return;
      const isSaved = Boolean(status);
      btn.setAttribute("aria-pressed", String(isSaved));
      btn.setAttribute("aria-label", isSaved ? "Remove from My learning" : "Save to My learning");
      btn.title = isSaved ? "Remove from My learning" : "Save to My learning";
    });
    $$("[data-status-select]").forEach(sel => {
      if (sel.getAttribute("data-status-select") !== id) return;
      sel.value = status || "";
    });
  }

  function toggleSave(id) {
    if (!COURSE_MAP[id]) return;
    if (getStatus(id)) {
      saved.delete(id);
      delete progress[id];
      pushRemoteSaved(id, null);
      toast("Removed from My learning");
    } else {
      saved.add(id);
      pushRemoteSaved(id, "saved");
      toast("Saved to My learning");
    }
    updateSaveButtons(id);
    persistSaved();
  }

  function setStatus(id, status) {
    if (!COURSE_MAP[id]) return;
    if (!status) {
      saved.delete(id);
      delete progress[id];
      pushRemoteSaved(id, null);
      toast("Removed from My learning");
    } else if (status === "saved") {
      saved.add(id);
      delete progress[id];
      pushRemoteSaved(id, "saved");
      toast("Saved to My learning");
    } else {
      saved.add(id);
      progress[id] = status;
      pushRemoteSaved(id, status);
      toast(status === "completed" ? "Marked as completed" : "Moved to in progress");
    }
    updateSaveButtons(id);
    persistSaved();
  }

  function removeCourse(id) {
    if (!COURSE_MAP[id]) return;
    saved.delete(id);
    delete progress[id];
    pushRemoteSaved(id, null);
    persistSaved();
    toast("Removed from My learning");
  }

  function savedCourses() {
    return Array.from(saved).map(courseOf).filter(Boolean)
      .sort((a, b) => Number(b.popularity) - Number(a.popularity));
  }

  function markViewed(id) {
    if (!COURSE_MAP[id]) return;
    recent = [id].concat(recent.filter(x => x !== id)).slice(0, 8);
    write("recent", recent);
    dispatchState();
  }

  function recentCourses(limit) {
    return recent.map(courseOf).filter(Boolean).slice(0, limit || 6);
  }

  /* ---------- cards ---------- */
  function coverColors(c) {
    const s = subjectOf(c);
    return "--c1:" + s.c1 + ";--c2:" + s.c2 + ";";
  }

  function starsMarkup(score) {
    const rounded = Math.max(0, Math.min(5, Math.round(Number(score || 0))));
    return '<span class="stars" aria-label="' + scoreText(score) + ' out of 5">' +
      "★".repeat(rounded) + "☆".repeat(5 - rounded) + "</span>";
  }

  function badgesFor(c, compact) {
    const badges = [];
    if (c.price === "free") badges.push('<span class="badge badge-free">Free</span>');
    else badges.push('<span class="badge badge-audit">Free to audit</span>');

    if (c.certificate === "free") badges.push('<span class="badge badge-cert">Free certificate</span>');
    else if (c.certificate === "paid") badges.push('<span class="badge badge-cert-paid">Certificate paid</span>');
    else if (!compact) badges.push('<span class="badge badge-none">No certificate</span>');

    if (!compact) badges.push('<span class="badge badge-level">' + esc(c.level) + "</span>");
    return badges.join("");
  }

  function saveButtonHTML(c) {
    const isSaved = Boolean(getStatus(c.id));
    return '<button class="save-btn" type="button" data-save="' + esc(c.id) + '" aria-pressed="' + isSaved + '" ' +
      'aria-label="' + (isSaved ? "Remove from My learning" : "Save to My learning") + '" title="' +
      (isSaved ? "Remove from My learning" : "Save to My learning") + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button>';
  }

  function statusOptions(status) {
    return '<option value=""' + (!status ? " selected" : "") + '>Not saved</option>' +
      '<option value="saved"' + (status === "saved" ? " selected" : "") + '>Saved</option>' +
      '<option value="learning"' + (status === "learning" ? " selected" : "") + '>In progress</option>' +
      '<option value="completed"' + (status === "completed" ? " selected" : "") + '>Completed</option>';
  }

  function courseCard(c, opts) {
    opts = opts || {};
    const s = subjectOf(c);
    const p = providerOf(c);
    const status = getStatus(c.id);
    const title = esc(c.title);
    const coverTag = c.featured ? '<span class="cover-tag">Editor’s pick</span>' : "";
    return '<article class="course-card" data-course-card="' + esc(c.id) + '">' +
      '<a class="course-cover" href="' + coursePath(c.id) + '" style="' + coverColors(c) + '" aria-label="' + title + '">' +
        coverTag +
        '<span class="cover-icon" aria-hidden="true">' + esc(s.icon) + "</span>" +
        '<span class="cover-provider">' + esc(p.initials) + "</span>" +
      "</a>" +
      saveButtonHTML(c) +
      '<div class="card-body">' +
        '<div class="card-provider"><span class="provider-initial" style="--pcolor:' + p.color + ';--ptext:' + (p.text || "#fff") + '">' + esc(p.initials) + "</span>" + esc(c.institution || p.name) + "</div>" +
        '<h3 class="card-title"><a href="' + coursePath(c.id) + '">' + title + "</a></h3>" +
        '<p class="card-desc">' + esc(c.short) + "</p>" +
        '<div class="card-meta">' +
          '<span class="card-score" title="Learnova editorial score"><span class="star" aria-hidden="true">★</span>' + scoreText(c.score) + '</span>' +
          '<span class="score-note">Learnova</span>' +
          '<span class="meta-dot" aria-hidden="true">·</span><span>' + esc(c.level) + "</span>" +
          '<span class="meta-dot" aria-hidden="true">·</span><span>' + esc(c.durationLabel) + "</span>" +
        "</div>" +
        '<div class="card-badges">' + badgesFor(c, true) + "</div>" +
        (opts.showStatus
          ? '<div class="card-actions">' +
              '<select class="select status-select" data-status-select="' + esc(c.id) + '" aria-label="Learning status for ' + title + '">' +
                statusOptions(status) +
              "</select>" +
              '<button class="remove-btn" type="button" data-remove-course="' + esc(c.id) + '">Remove</button>' +
            "</div>"
          : "") +
      "</div>" +
    "</article>";
  }

  function miniCourseRow(c) {
    const s = subjectOf(c);
    return '<a class="hero-mini" href="' + coursePath(c.id) + '">' +
      '<span class="hero-mini-cover" style="--c1:' + s.c1 + ';--c2:' + s.c2 + '">' + esc(s.icon) + "</span>" +
      '<span class="hero-mini-info"><strong>' + esc(c.title) + "</strong><span>" + esc(c.institution) + " · " + esc(c.level) + "</span></span>" +
      '<span class="mini-star"><i>★</i> ' + scoreText(c.score) + "</span>" +
    "</a>";
  }

  /* ---------- toast ---------- */
  let toastTimer = null;
  function ensureToast() {
    let el = $("#ln-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "ln-toast";
      el.className = "toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    return el;
  }
  function toast(message) {
    const el = ensureToast();
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
  }

  /* ---------- Supabase (optional) ---------- */
  function loadSupabase() {
    if (!DB_CONFIGURED) return Promise.resolve(null);
    if (sb) return Promise.resolve(sb);
    if (supabasePromise) return supabasePromise;
    supabasePromise = new Promise((resolve, reject) => {
      const makeClient = () => {
        try {
          sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
          resolve(sb);
        } catch (e) { reject(e); }
      };
      if (window.supabase) return makeClient();
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
      script.onload = makeClient;
      script.onerror = () => reject(new Error("Could not load Supabase"));
      document.head.appendChild(script);
    });
    return supabasePromise;
  }

  function setRemoteUser(user) {
    remoteUser = user || null;
    renderAuth();
    dispatchState();
    if (remoteUser) syncRemoteSaved();
  }

  function initSupabase() {
    if (!DB_CONFIGURED) return;
    loadSupabase().then(client => {
      client.auth.getSession().then(({ data }) => {
        setRemoteUser(data && data.session ? data.session.user : null);
      }).catch(() => {});
      client.auth.onAuthStateChange((_event, session) => {
        setRemoteUser(session && session.user ? session.user : null);
      });
    }).catch(err => {
      console.warn("Learnova: Supabase is not available; staying local.", err);
    });
  }

  function syncRemoteSaved() {
    if (!sb || !remoteUser) return;
    sb.from("saved_courses").select("course_id,status").then(({ data, error }) => {
      if (error) { console.warn("Learnova saved courses:", error.message); return; }
      (data || []).forEach(row => {
        if (!COURSE_MAP[row.course_id]) return;
        saved.add(row.course_id);
        if (row.status === "learning" || row.status === "completed") progress[row.course_id] = row.status;
      });
      write("saved", Array.from(saved));
      write("progress", progress);
      $$("[data-save]").forEach(btn => updateSaveButtons(btn.getAttribute("data-save")));
      renderAuth();
      dispatchState();
      if ((data || []).length === 0 && saved.size) {
        const rows = Array.from(saved).map(id => ({
          user_id: remoteUser.id, course_id: id, status: progress[id] || "saved"
        }));
        sb.from("saved_courses").upsert(rows, { onConflict: "user_id,course_id" }).then(() => {});
      }
    });
  }

  function pushRemoteSaved(id, status) {
    if (!sb || !remoteUser) return;
    if (!status) {
      sb.from("saved_courses").delete().eq("user_id", remoteUser.id).eq("course_id", id).then(() => {});
    } else {
      sb.from("saved_courses").upsert({
        user_id: remoteUser.id, course_id: id, status: status
      }, { onConflict: "user_id,course_id" }).then(() => {});
    }
  }

  function localReviewsFor(id) {
    return Array.isArray(localReviews[id]) ? localReviews[id] : [];
  }

  async function fetchReviews(id) {
    if (sb && DB_CONFIGURED) {
      try {
        const { data, error } = await sb.from("course_reviews")
          .select("id,user_id,author_name,rating,body,created_at")
          .eq("course_id", id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map(r => ({
          id: r.id, name: r.author_name || "Learner", rating: Number(r.rating),
          body: r.body, date: r.created_at, remote: true, own: remoteUser && r.user_id === remoteUser.id
        }));
      } catch (err) {
        console.warn("Learnova reviews: falling back to this device.", err.message || err);
      }
    }
    return localReviewsFor(id).map(r => ({ ...r, own: false }));
  }

  async function addReview(id, review) {
    const name = String(review.name || (getProfile() && getProfile().name) || "Learner").trim().slice(0, 60);
    const rating = Math.max(1, Math.min(5, Math.round(Number(review.rating) || 0)));
    const body = String(review.body || "").trim().slice(0, 2000);
    if (!COURSE_MAP[id]) throw new Error("Unknown course");
    if (!body) throw new Error("Please write a short review.");
    if (!rating) throw new Error("Please choose a star rating.");

    if (sb && remoteUser) {
      try {
        const { data, error } = await sb.from("course_reviews").insert({
          user_id: remoteUser.id, course_id: id, author_name: name, rating, body
        }).select("id,author_name,rating,body,created_at").single();
        if (error) throw error;
        return {
          id: data.id, name: data.author_name, rating: Number(data.rating),
          body: data.body, date: data.created_at, remote: true, own: true
        };
      } catch (err) {
        console.warn("Learnova reviews: saving locally instead.", err.message || err);
      }
    }

    if (!Array.isArray(localReviews[id])) localReviews[id] = [];
    const entry = {
      id: "local-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      name, rating, body, date: new Date().toISOString(), local: true
    };
    localReviews[id].unshift(entry);
    write("reviews", localReviews);
    dispatchState();
    return entry;
  }

  function localReviewCount() {
    return Object.keys(localReviews).reduce((n, id) => n + (Array.isArray(localReviews[id]) ? localReviews[id].length : 0), 0);
  }

  async function myReviews() {
    const rows = [];
    Object.keys(localReviews).forEach(courseId => {
      const c = courseOf(courseId);
      if (!c) return;
      (Array.isArray(localReviews[courseId]) ? localReviews[courseId] : []).forEach(r => {
        rows.push({ ...r, courseId, course: c, own: true, remote: false });
      });
    });

    if (sb && remoteUser && DB_CONFIGURED) {
      try {
        const { data, error } = await sb.from("course_reviews")
          .select("id,user_id,course_id,author_name,rating,body,created_at")
          .eq("user_id", remoteUser.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        (data || []).forEach(r => {
          const c = courseOf(r.course_id);
          if (!c) return;
          rows.push({
            id: r.id, name: r.author_name || "Learner", rating: Number(r.rating),
            body: r.body, date: r.created_at, courseId: r.course_id, course: c,
            remote: true, own: true
          });
        });
      } catch (err) {
        console.warn("Learnova reviews: showing this device's reviews only.", err.message || err);
      }
    }

    return rows.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }

  /* ---------- auth / profile modal ---------- */
  let modalReturnFocus = null;
  let authStep = "main";
  let pendingEmail = "";
  let allowLocalAuth = !DB_CONFIGURED;

  function ensureAuthModal() {
    let modal = $("#ln-auth-modal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "ln-auth-modal";
    modal.className = "modal-backdrop";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "ln-auth-title");
    modal.innerHTML = '<div class="modal-card" id="ln-auth-card"></div>';
    document.body.appendChild(modal);
    modal.addEventListener("click", e => { if (e.target === modal) closeAuth(); });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && modal.classList.contains("open")) closeAuth();
    });
    return modal;
  }

  function closeAuth() {
    const modal = $("#ln-auth-modal");
    if (!modal) return;
    modal.classList.remove("open");
    if (modalReturnFocus && document.contains(modalReturnFocus)) modalReturnFocus.focus();
  }

  function openAuth() {
    const modal = ensureAuthModal();
    modalReturnFocus = document.activeElement;
    authStep = "main";
    renderAuthModal();
    modal.classList.add("open");
    setTimeout(() => {
      const input = modal.querySelector("input");
      if (input) input.focus();
    }, 30);
  }

  function authHeader(title, note) {
    return '<button class="modal-close" type="button" data-auth-action="close" aria-label="Close">&times;</button>' +
      '<h2 id="ln-auth-title">' + esc(title) + "</h2>" +
      '<p>' + note + "</p>";
  }

  function renderAuthModal() {
    const modal = ensureAuthModal();
    const card = $("#ln-auth-card", modal);
    if (!card) return;
    const profile = getProfile();

    if (authStep === "code") {
      card.innerHTML = authHeader("Enter your sign-in code",
        "We sent a 6-digit code to <strong>" + esc(pendingEmail) + "</strong>. It expires in about an hour.") +
        '<form id="ln-otp-code-form" novalidate>' +
          '<div class="field"><label for="ln-otp-code">6-digit code</label>' +
            '<input id="ln-otp-code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456" required></div>' +
          '<div class="auth-actions"><button class="btn btn-primary" type="submit">Verify &amp; sign in</button>' +
            '<button class="btn btn-ghost btn-sm" type="button" data-auth-action="back-email">Use a different email</button></div>' +
          '<p class="form-msg" id="ln-auth-msg" role="status" aria-live="polite"></p>' +
        "</form>";
      bindAuthForms();
      return;
    }

    if (authStep === "edit-local") {
      card.innerHTML = authHeader("Edit your profile", "This information stays in this browser and appears on reviews you write.") +
        '<form id="ln-local-profile-form" novalidate>' +
          '<div class="field"><label for="ln-profile-name">Your name</label>' +
            '<input id="ln-profile-name" type="text" autocomplete="name" maxlength="60" placeholder="e.g. Priya" value="' + esc(localProfile ? localProfile.name : "") + '" required></div>' +
          '<div class="field"><label for="ln-profile-email">Email <span class="muted small">(optional)</span></label>' +
            '<input id="ln-profile-email" type="email" autocomplete="email" placeholder="you@example.com" value="' + esc(localProfile ? localProfile.email : "") + '"></div>' +
          '<div class="auth-actions"><button class="btn btn-primary" type="submit">Save profile</button>' +
            '<button class="btn btn-ghost btn-sm" type="button" data-auth-action="close">Cancel</button></div>' +
        "</form>";
      bindAuthForms();
      return;
    }

    if (profile) {
      card.innerHTML = authHeader("Your Learnova account", "Your saved courses, progress, and reviews are linked to this profile.") +
        '<div class="profile-summary">' +
          '<span class="avatar">' + esc(avatarLetter(profile.name)) + "</span>" +
          '<div><strong>' + esc(profile.name) + "</strong><span>" + esc(profile.email || (profile.remote ? "Signed in" : "Saved on this device")) + "</span></div>" +
        "</div>" +
        '<div class="auth-actions">' +
          '<a class="btn btn-primary" href="my-learning.html">Go to My learning</a>' +
          (!profile.remote ? '<button class="btn btn-outline" type="button" data-auth-action="edit-local">Edit profile</button>' : "") +
          '<button class="btn btn-ghost btn-sm" type="button" data-auth-action="signout">Sign out</button>' +
        "</div>" +
        (!profile.remote && !DB_CONFIGURED
          ? '<p class="auth-note">This profile and your saved courses live in this browser. Connect Supabase in <code>assets/js/config.js</code> to sync across devices.</p>'
          : "");
      bindAuthForms();
      return;
    }

    if (DB_CONFIGURED && !allowLocalAuth) {
      card.innerHTML = authHeader("Sign in to Learnova", "Use your email and a one-time code. No password to remember.") +
        '<form id="ln-otp-email-form" novalidate>' +
          '<div class="field"><label for="ln-auth-email">Email address</label>' +
            '<input id="ln-auth-email" type="email" autocomplete="email" placeholder="you@example.com" required></div>' +
          '<div class="auth-actions"><button class="btn btn-primary" type="submit">Send my code</button></div>' +
          '<p class="form-msg" id="ln-auth-msg" role="status" aria-live="polite"></p>' +
          '<p class="auth-note">Want to use this device only? <button class="filters-clear" type="button" data-auth-action="use-local">Create a local profile</button></p>' +
        "</form>";
      bindAuthForms();
      return;
    }

    card.innerHTML = authHeader(
      localProfile ? "Edit your profile" : "Create your profile",
      "Save courses, track progress, and write reviews. In local mode, this information stays in this browser."
    ) +
      '<form id="ln-local-profile-form" novalidate>' +
        '<div class="field"><label for="ln-profile-name">Your name</label>' +
          '<input id="ln-profile-name" type="text" autocomplete="name" maxlength="60" placeholder="e.g. Priya" value="' + esc(localProfile ? localProfile.name : "") + '" required></div>' +
        '<div class="field"><label for="ln-profile-email">Email <span class="muted small">(optional)</span></label>' +
          '<input id="ln-profile-email" type="email" autocomplete="email" placeholder="you@example.com" value="' + esc(localProfile ? localProfile.email : "") + '"></div>' +
        '<div class="auth-actions"><button class="btn btn-primary" type="submit">Save profile</button></div>' +
        '<p class="auth-note">No password, no spam. Your name appears on reviews you write. Connect Supabase to sync with an email code.</p>' +
      "</form>";
    bindAuthForms();
  }

  function bindAuthForms() {
    const card = $("#ln-auth-card");
    if (!card) return;

    const localForm = $("#ln-local-profile-form", card);
    if (localForm) localForm.addEventListener("submit", e => {
      e.preventDefault();
      const name = $("#ln-profile-name", card).value.trim();
      const email = $("#ln-profile-email", card).value.trim();
      if (name.length < 2) { $("#ln-profile-name", card).focus(); return; }
      localProfile = { name: name, email: email, local: true };
      write("profile", localProfile);
      renderAuth();
      dispatchState();
      closeAuth();
      toast("Profile saved. Welcome, " + firstName(name) + "!");
    });

    const emailForm = $("#ln-otp-email-form", card);
    if (emailForm) emailForm.addEventListener("submit", async e => {
      e.preventDefault();
      const email = $("#ln-auth-email", card).value.trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) return authMessage("Please enter a valid email address.", true);
      if (!sb) {
        try { await loadSupabase(); } catch (err) { return authMessage("Could not reach the sign-in service. You can use a local profile instead.", true); }
      }
      const { error } = await sb.auth.signInWithOtp({ email: email, options: { shouldCreateUser: true } });
      if (error) return authMessage(friendlyAuthError(error), true);
      pendingEmail = email;
      authStep = "code";
      renderAuthModal();
      const code = $("#ln-otp-code");
      if (code) code.focus();
    });

    const codeForm = $("#ln-otp-code-form", card);
    if (codeForm) codeForm.addEventListener("submit", async e => {
      e.preventDefault();
      const code = $("#ln-otp-code", card).value.trim();
      if (code.length !== 6) return authMessage("Please enter the 6-digit code.", true);
      if (!sb) return authMessage("Sign-in is not available right now. Please try again.", true);
      const { data, error } = await sb.auth.verifyOtp({ email: pendingEmail, token: code, type: "email" });
      if (error) return authMessage(friendlyAuthError(error), true);
      setRemoteUser(data && data.session ? data.session.user : null);
      closeAuth();
      toast("Signed in" + (pendingEmail ? " as " + pendingEmail : ""));
    });
  }

  function authMessage(text, isError) {
    const el = $("#ln-auth-msg");
    if (!el) return;
    el.textContent = text;
    el.className = "form-msg show" + (isError ? " error" : "");
  }

  function friendlyAuthError(error) {
    const m = String((error && error.message) || "");
    if (/rate limit|too many|60 second/i.test(m)) return "Too many attempts. Please wait a minute and try again.";
    if (/expired/i.test(m)) return "That code has expired. Please request a new one.";
    if (/invalid/i.test(m)) return "That code is not correct. Please check it and try again.";
    if (/fetch|network/i.test(m)) return "Could not reach the sign-in service. Please try again in a minute.";
    return "Could not sign you in right now. Please try again in a minute.";
  }

  async function signOut() {
    if (sb && remoteUser) {
      try { await sb.auth.signOut(); } catch (e) {}
    }
    localProfile = null;
    remoteUser = null;
    try { localStorage.removeItem(PREFIX + "profile"); } catch (e) {}
    renderAuth();
    dispatchState();
    closeAuth();
    toast("Signed out. Your saved courses are still on this device.");
  }

  function renderAuth() {
    const profile = getProfile();
    $$("[data-auth-zone]").forEach(zone => {
      if (profile) {
        zone.innerHTML = '<a class="user-chip" href="my-learning.html" aria-label="Open My learning">' +
          '<span class="avatar">' + esc(avatarLetter(profile.name)) + "</span>" +
          '<span class="name">' + esc(firstName(profile.name)) + "</span></a>" +
          '<button class="btn btn-ghost btn-sm" type="button" data-auth-open>Account</button>';
      } else {
        zone.innerHTML = '<button class="btn btn-primary" type="button" data-auth-open>Sign in</button>';
      }
    });
  }

  /* ---------- header search + suggestions ---------- */
  let suggestionIndex = -1;

  function scanSuggestion(q) {
    return '<div class="suggest-scan">' +
      '<div class="suggest-label">Live scan</div>' +
      '<a class="suggest-scan-link" href="' + scanPath(q) + '" data-live-scan>' +
        '<span class="suggest-scan-icon" aria-hidden="true"><span class="live-dot"></span></span>' +
        '<span class="suggest-scan-copy">' +
          '<strong>Scan the live web for &ldquo;' + esc(q) + '&rdquo;</strong>' +
          '<span>YouTube, edX, Coursera, open libraries and more</span>' +
        '</span>' +
        '<span class="suggest-scan-arrow" aria-hidden="true">&rarr;</span>' +
      '</a>' +
    '</div>';
  }

  function renderSuggestions(form, q) {
    let box = form.querySelector(".search-suggest");
    if (!box) {
      box = document.createElement("div");
      box.className = "search-suggest";
      form.appendChild(box);
    }
    const nq = normalize(q);
    if (nq.length < 2) { box.classList.remove("open"); box.innerHTML = ""; suggestionIndex = -1; return; }

    const results = searchCourses(q, 5).map(r => r.course);
    const subjectHits = SUBJECTS.filter(s =>
      normalize(s.name).includes(nq) || normalize(s.blurb).includes(nq)
    ).slice(0, 2);
    const providerHits = Object.keys(PROVIDERS).filter(k => {
      const p = PROVIDERS[k];
      return normalize(p.name).includes(nq) || normalize(p.type).includes(nq);
    }).slice(0, 2);

    let html = "";
    if (results.length) {
      html += '<div class="suggest-group"><div class="suggest-label">Courses</div>';
      results.forEach(c => {
        const s = subjectOf(c);
        html += '<a class="suggest-item" href="' + coursePath(c.id) + '">' +
          '<span class="suggest-cover" style="--c1:' + s.c1 + ';--c2:' + s.c2 + '">' + esc(s.icon) + "</span>" +
          '<span class="suggest-info"><span class="suggest-title">' + esc(c.title) + "</span>" +
          '<span class="suggest-meta">' + esc(c.institution) + " · " + esc(c.level) + " · ★ " + scoreText(c.score) + "</span></span></a>";
      });
      html += "</div>";
    }
    if (subjectHits.length) {
      html += '<div class="suggest-group"><div class="suggest-label">Subjects</div>';
      subjectHits.forEach(s => {
        html += '<a class="suggest-item" href="' + browsePath({ subject: s.id }) + '">' +
          '<span class="suggest-cover" style="--c1:' + s.c1 + ';--c2:' + s.c2 + '">' + esc(s.icon) + "</span>" +
          '<span class="suggest-info"><span class="suggest-title">' + esc(s.name) + "</span>" +
          '<span class="suggest-meta">' + COURSES.filter(c => c.subject === s.id).length + " free courses</span></span></a>";
      });
      html += "</div>";
    }
    if (providerHits.length) {
      html += '<div class="suggest-group"><div class="suggest-label">Providers</div>';
      providerHits.forEach(k => {
        const p = PROVIDERS[k];
        const count = COURSES.filter(c => c.provider === k).length;
        html += '<a class="suggest-item" href="' + browsePath({ provider: k }) + '">' +
          '<span class="suggest-cover" style="--c1:' + p.color + ';--c2:' + p.color + ';color:' + (p.text || "#fff") + '">' + esc(p.initials) + "</span>" +
          '<span class="suggest-info"><span class="suggest-title">' + esc(p.name) + "</span>" +
          '<span class="suggest-meta">' + count + " " + plural(count, "course") + "</span></span></a>";
      });
      html += "</div>";
    }

    const hasCatalogue = Boolean(html);
    if (!hasCatalogue) {
      html = '<div class="suggest-empty">No catalogue match yet. A live scan can look outside the catalogue.</div>';
    }
    html += scanSuggestion(q);
    if (hasCatalogue) {
      html += '<div class="suggest-footer"><span>Press Enter for all results</span><a href="' + browsePath({ q: q }) + '">See all &rarr;</a></div>';
    }
    box.innerHTML = html;
    box.classList.add("open");
    suggestionIndex = -1;
  }

  function setupSearchForms() {
    $$("form[data-global-search]").forEach(form => {
      const input = form.querySelector("input");
      if (!input) return;
      let timer = null;
      input.addEventListener("input", () => {
        clearTimeout(timer);
        const value = input.value;
        timer = setTimeout(() => renderSuggestions(form, value), 110);
      });
      input.addEventListener("focus", () => {
        $$(".search-suggest.open").forEach(box => {
          if (!form.contains(box)) box.classList.remove("open");
        });
        if (input.value.trim().length >= 2) renderSuggestions(form, input.value);
      });
      input.addEventListener("keydown", e => {
        const box = form.querySelector(".search-suggest");
        if (!box || !box.classList.contains("open")) return;
        const items = $$(".suggest-item, .suggest-scan-link", box);
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          if (!items.length) return;
          suggestionIndex = e.key === "ArrowDown"
            ? (suggestionIndex + 1) % items.length
            : (suggestionIndex - 1 + items.length) % items.length;
          items.forEach((a, i) => a.classList.toggle("active", i === suggestionIndex));
          if (items[suggestionIndex]) items[suggestionIndex].scrollIntoView({ block: "nearest" });
        } else if (e.key === "Enter" && suggestionIndex >= 0 && items[suggestionIndex]) {
          e.preventDefault();
          window.location.href = items[suggestionIndex].getAttribute("href");
        } else if (e.key === "Escape") {
          box.classList.remove("open");
          suggestionIndex = -1;
        }
      });
      form.addEventListener("submit", () => {
        const box = form.querySelector(".search-suggest");
        if (box) box.classList.remove("open");
      });
    });

    document.addEventListener("click", e => {
      if (!e.target.closest("form[data-global-search]")) {
        $$(".search-suggest.open").forEach(box => box.classList.remove("open"));
        suggestionIndex = -1;
      }
    });

    document.addEventListener("keydown", e => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable) return;
      const input = $(".header-search input") || $("form[data-global-search] input");
      if (input) { e.preventDefault(); input.focus(); }
    });
  }

  /* ---------- header / nav ---------- */
  function setupNav() {
    const toggle = $("#menuToggle");
    const menu = $("#mobileMenu");
    if (toggle && menu) {
      toggle.addEventListener("click", () => {
        const open = menu.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      });
      $$("a", menu).forEach(a => a.addEventListener("click", () => {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }));
      document.addEventListener("keydown", e => {
        if (e.key === "Escape" && menu.classList.contains("open")) {
          menu.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
          toggle.focus();
        }
      });
    }

    const page = document.body.getAttribute("data-page");
    if (page) {
      $$("[data-nav]").forEach(a => {
        if (a.getAttribute("data-nav") === page) a.classList.add("active");
      });
    }
    const year = $("#year");
    if (year) year.textContent = new Date().getFullYear();
  }

  /* ---------- newsletter / waitlist ---------- */
  async function subscribe(email) {
    const clean = String(email || "").trim();
    if (!/^\S+@\S+\.\S+$/.test(clean)) throw new Error("Please enter a valid email address.");

    let localOnly = true;
    if (sb && DB_CONFIGURED) {
      try {
        const { error } = await sb.from("waitlist").insert({
          full_name: "Course picks subscriber", email: clean, language: "English"
        });
        if (error && error.code !== "23505") throw error;
        localOnly = false;
      } catch (err) {
        console.warn("Learnova newsletter: saving locally.", err.message || err);
      }
    }

    let list = read("newsletter", []);
    if (!Array.isArray(list)) list = [];
    if (!list.includes(clean)) list.push(clean);
    write("newsletter", list);
    return { ok: true, local: localOnly };
  }

  /* ---------- event delegation ---------- */
  document.addEventListener("click", e => {
    const save = e.target.closest("[data-save]");
    if (save) {
      e.preventDefault();
      toggleSave(save.getAttribute("data-save"));
      return;
    }
    const remove = e.target.closest("[data-remove-course]");
    if (remove) {
      e.preventDefault();
      removeCourse(remove.getAttribute("data-remove-course"));
      return;
    }
    if (e.target.closest("[data-auth-open]")) {
      e.preventDefault();
      openAuth();
      return;
    }
    const authAction = e.target.closest("[data-auth-action]");
    if (authAction) {
      e.preventDefault();
      const action = authAction.getAttribute("data-auth-action");
      if (action === "close") closeAuth();
      if (action === "signout") signOut();
      if (action === "use-local") { allowLocalAuth = true; authStep = "main"; renderAuthModal(); }
      if (action === "back-email") { authStep = "main"; renderAuthModal(); }
      if (action === "edit-local") { authStep = "edit-local"; renderAuthModal(); }
    }
  });

  document.addEventListener("change", e => {
    const sel = e.target.closest("[data-status-select]");
    if (sel) setStatus(sel.getAttribute("data-status-select"), sel.value);
  });

  /* ---------- public API ---------- */
  window.LN = {
    data: D,
    courses: COURSES,
    subjects: SUBJECTS,
    providers: PROVIDERS,
    collections: COLLECTIONS,
    config: CFG,
    esc, $, $$, normalize, plural, scoreText, formatDate,
    subjectOf, providerOf, courseOf,
    searchCourses, matchesQuery, courseHaystack,
    courseCard, coverColors, starsMarkup, badgesFor, miniCourseRow, saveButtonHTML,
    coursePath, browsePath, scanPath,
    getProfile, openAuth, closeAuth, signOut,
    isSaved: id => saved.has(id),
    getStatus, toggleSave, setStatus, removeCourse,
    savedCourses, savedCount: () => saved.size,
    markViewed, recentCourses,
    fetchReviews, addReview, localReviewCount, myReviews,
    subscribe, toast, dispatchState,
    isRemoteReady: () => Boolean(sb && remoteUser),
    isBackendConfigured: () => DB_CONFIGURED
  };

  /* ---------- boot ---------- */
  function boot() {
    ensureToast();
    setupNav();
    setupSearchForms();
    renderAuth();
    initSupabase();
    $$("[data-save]").forEach(btn => updateSaveButtons(btn.getAttribute("data-save")));
    dispatchState();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
