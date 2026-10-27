/* ============================================================
   LEARNOVA — homepage
   ============================================================ */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    const D = window.LN_DATA;
    const LN = window.LN;
    if (!D || !LN) return;

    renderStats(D);
    renderHero(D, LN);
    renderSubjects(D, LN);
    renderFeatured(D, LN);
    renderCollections(D, LN);
    renderFreeCertificates(D, LN);
    renderProviders(D, LN);
    renderIndia(D, LN);
    bindNewsletter(LN);
  }

  function renderStats(D) {
    const providers = Object.keys(D.providers).length;
    const freeCerts = D.courses.filter(c => c.certificate === "free").length;
    setText("statCourses", D.courses.length + "+");
    setText("statProviders", providers);
    setText("statSubjects", D.subjects.length);
    setText("statCertificates", freeCerts);
    setText("subjectCourseCount", D.courses.length);
    setText("heroCourseCount", D.courses.length + " hand-picked free courses");
  }

  function renderHero(D, LN) {
    const ids = ["cs50x", "coursera-wellbeing", "fcc-responsive"];
    const host = document.getElementById("heroMiniCourses");
    if (host) host.innerHTML = ids.map(id => LN.courseOf(id)).filter(Boolean).map(LN.miniCourseRow).join("");
  }

  function renderSubjects(D, LN) {
    const host = document.getElementById("subjectGrid");
    if (!host) return;
    host.innerHTML = D.subjects.map(s => {
      const count = D.courses.filter(c => c.subject === s.id).length;
      return '<a class="subject-tile" href="' + LN.browsePath({ subject: s.id }) + '" style="--c1:' + s.c1 + ';--c2:' + s.c2 + '">' +
        '<span class="subject-icon" aria-hidden="true">' + LN.esc(s.icon) + "</span>" +
        '<span><span class="subject-name">' + LN.esc(s.name) + "</span>" +
        '<span class="subject-count">' + count + " " + LN.plural(count, "course") + "</span></span></a>";
    }).join("");
  }

  function renderFeatured(D, LN) {
    const host = document.getElementById("featuredGrid");
    if (!host) return;
    const featured = D.courses
      .filter(c => c.featured)
      .sort((a, b) => Number(b.popularity) - Number(a.popularity))
      .slice(0, 8);
    host.innerHTML = featured.map(c => LN.courseCard(c)).join("");
  }

  function renderCollections(D, LN) {
    const host = document.getElementById("collectionsGrid");
    if (!host) return;
    host.innerHTML = D.collections.slice(0, 3).map(col => {
      const courses = col.courseIds.map(id => LN.courseOf(id)).filter(Boolean);
      const count = courses.length;
      return '<a class="collection-card" href="' + LN.browsePath({ collection: col.id }) + '">' +
        '<span class="collection-icon" aria-hidden="true">' + LN.esc(col.icon) + "</span>" +
        "<div><h3>" + LN.esc(col.title) + "</h3><p>" + LN.esc(col.blurb) + "</p></div>" +
        '<span class="collection-meta"><span>' + count + " " + LN.plural(count, "course") + "</span>" +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></a>';
    }).join("");
  }

  function renderFreeCertificates(D, LN) {
    const host = document.getElementById("freeCertGrid");
    if (!host) return;
    const picks = D.courses
      .filter(c => c.certificate === "free")
      .sort((a, b) => Number(b.score) - Number(a.score))
      .slice(0, 4);
    host.innerHTML = picks.map(c => LN.courseCard(c)).join("");
  }

  function renderProviders(D, LN) {
    const host = document.getElementById("providerStrip");
    if (!host) return;
    const counts = {};
    D.courses.forEach(c => { counts[c.provider] = (counts[c.provider] || 0) + 1; });
    const ids = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 12);
    host.innerHTML = ids.map(id => {
      const p = D.providers[id];
      if (!p) return "";
      return '<a class="provider-chip" href="' + LN.browsePath({ provider: id }) + '">' +
        '<span class="provider-initial" style="--pcolor:' + p.color + ';--ptext:' + (p.text || "#fff") + '">' + LN.esc(p.initials) + "</span>" +
        LN.esc(p.name) + "</a>";
    }).join("");
  }

  function renderIndia(D, LN) {
    const host = document.getElementById("indiaGrid");
    if (!host) return;
    const col = D.collections.find(c => c.id === "india-picks");
    const courses = (col ? col.courseIds : []).map(id => LN.courseOf(id)).filter(Boolean).slice(0, 3);
    host.innerHTML = courses.map(c => LN.courseCard(c)).join("");
  }

  function bindNewsletter(LN) {
    const form = document.getElementById("newsletterForm");
    if (!form) return;
    const input = document.getElementById("newsletterEmail");
    const msg = document.getElementById("newsletterMsg");
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const email = input.value.trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        show(msg, "Please enter a valid email address.", true);
        input.focus();
        return;
      }
      const button = form.querySelector("button[type=submit]");
      const old = button.textContent;
      button.disabled = true;
      button.textContent = "Saving…";
      try {
        const result = await LN.subscribe(email);
        form.reset();
        show(msg, result.local
          ? "You’re on the list on this device. Connect Supabase to collect sign-ups for real."
          : "You’re on the list. We’ll send occasional course picks — no spam.", false);
        LN.toast("You’re on the list!");
      } catch (err) {
        show(msg, err.message || "Could not save your email right now. Please try again.", true);
      } finally {
        button.disabled = false;
        button.textContent = old;
      }
    });
  }

  function show(el, text, isError) {
    if (!el) return;
    el.textContent = text;
    el.classList.add("show");
    el.classList.toggle("error", Boolean(isError));
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }
})();
