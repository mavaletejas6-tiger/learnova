/* ============================================================
   LEARNOVA — provider directory
   ============================================================ */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", init);

  let D, LN, search = "", type = "", searchTimer = null;
  let providers = [];

  function init() {
    D = window.LN_DATA;
    LN = window.LN;
    if (!D || !LN) return;

    const params = new URLSearchParams(location.search);
    search = (params.get("q") || "").trim();
    type = (params.get("type") || "").trim();

    providers = Object.keys(D.providers).map(id => {
      const p = D.providers[id];
      const courses = D.courses.filter(c => c.provider === id);
      const subjectCounts = {};
      courses.forEach(c => { subjectCounts[c.subject] = (subjectCounts[c.subject] || 0) + 1; });
      const subjects = Object.keys(subjectCounts)
        .sort((a, b) => subjectCounts[b] - subjectCounts[a] || a.localeCompare(b))
        .map(sid => ({ id: sid, name: nameOfSubject(sid), count: subjectCounts[sid] }));
      return { id, ...p, courses, subjects };
    }).sort((a, b) => b.courses.length - a.courses.length || a.name.localeCompare(b.name));

    renderFilters();
    const input = document.getElementById("providerSearch");
    if (input) {
      input.value = search;
      input.addEventListener("input", () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          search = input.value.trim();
          render();
        }, 140);
      });
    }

    const host = document.getElementById("providerFilters");
    if (host) host.addEventListener("click", e => {
      const btn = e.target.closest("[data-provider-type]");
      if (!btn) return;
      type = btn.getAttribute("data-provider-type") || "";
      renderFilters();
      render();
    });

    const clear = document.getElementById("clearProviderSearch");
    if (clear) clear.addEventListener("click", () => {
      search = "";
      type = "";
      if (input) input.value = "";
      renderFilters();
      render();
      if (input) input.focus();
    });

    render();
  }

  function nameOfSubject(id) {
    const s = D.subjects.find(x => x.id === id);
    return s ? s.name : id;
  }

  function typeCounts() {
    const counts = {};
    providers.forEach(p => { counts[p.type] = (counts[p.type] || 0) + 1; });
    return counts;
  }

  function renderFilters() {
    const host = document.getElementById("providerFilters");
    if (!host) return;
    const counts = typeCounts();
    const types = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
    const button = (value, label, count) =>
      '<button class="provider-filter" type="button" data-provider-type="' + LN.esc(value) + '" aria-pressed="' + String((type || "") === value) + '">' +
        LN.esc(label) + ' <span class="muted">' + count + "</span></button>";

    host.innerHTML = button("", "All providers", providers.length) +
      types.map(t => button(t, t, counts[t])).join("");
  }

  function render() {
    const q = LN.normalize(search);
    const list = providers.filter(p => {
      if (type && p.type !== type) return false;
      if (!q) return true;
      const haystack = LN.normalize([
        p.name, p.type, p.about, p.initials,
        p.subjects.map(s => s.name).join(" "),
        p.courses.map(c => c.title + " " + (c.skills || []).join(" ")).join(" ")
      ].join(" "));
      return q.split(" ").filter(Boolean).every(term => haystack.includes(term));
    });

    const grid = document.getElementById("providerGrid");
    if (grid) grid.innerHTML = list.map(providerCard).join("");
    const empty = document.getElementById("providerEmpty");
    if (empty) empty.hidden = list.length > 0;
    if (grid) grid.hidden = list.length === 0;

    const count = document.getElementById("providerCount");
    if (count) {
      count.innerHTML = list.length === providers.length
        ? "<strong>" + providers.length + "</strong> providers · <strong>" + D.courses.length + "</strong> free courses"
        : "Showing <strong>" + list.length + "</strong> of <strong>" + providers.length + "</strong> providers";
    }

    try {
      const p = new URLSearchParams();
      if (search) p.set("q", search);
      if (type) p.set("type", type);
      history.replaceState(null, "", "providers.html" + (p.toString() ? "?" + p.toString() : ""));
    } catch (e) {}

    document.title = (type ? type + " providers" : search ? "Provider search for “" + search + "”" : "Course providers") + " — Learnova";
  }

  function providerCard(p) {
    const topSubjects = p.subjects.slice(0, 3);
    return '<a class="provider-card" href="' + LN.browsePath({ provider: p.id }) + '" aria-label="Browse courses from ' + LN.esc(p.name) + '">' +
      '<div class="provider-card-top">' +
        '<span class="provider-logo" style="--pcolor:' + p.color + ';--ptext:' + (p.text || "#fff") + '" aria-hidden="true">' + LN.esc(p.initials) + "</span>" +
        '<span><span class="provider-name">' + LN.esc(p.name) + '</span><span class="provider-type">' + LN.esc(p.type) + "</span></span>" +
      "</div>" +
      '<p class="provider-about">' + LN.esc(p.about) + "</p>" +
      (topSubjects.length
        ? '<div class="provider-subjects" aria-label="Popular subjects">' +
            topSubjects.map(s => '<span class="provider-subject">' + LN.esc(s.name) + "</span>").join("") +
          "</div>"
        : "") +
      '<div class="provider-card-meta">' +
        "<span><b>" + p.courses.length + "</b> " + LN.plural(p.courses.length, "course") + "</span>" +
        '<span style="display:inline-flex;align-items:center;gap:.25rem">View courses ' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>' +
      "</div>" +
    "</a>";
  }
})();
