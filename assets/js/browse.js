/* ============================================================
   LEARNOVA — course catalogue browser
   ============================================================ */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", init);

  const PAGE_SIZE = 12;
  let D, LN, state, results, view = "grid";
  let searchTimer = null;

  const FILTER_KEYS = ["subjects", "providers", "levels", "languages", "prices", "certificates", "durations"];
  const PARAM_BY_KEY = {
    subjects: "subject", providers: "provider", levels: "level", languages: "language",
    prices: "price", certificates: "certificate", durations: "duration"
  };

  function init() {
    D = window.LN_DATA;
    LN = window.LN;
    if (!D || !LN) return;

    state = readState();
    try { view = localStorage.getItem("lnv1_view") === "list" ? "list" : "grid"; } catch (e) {}

    syncSearchInputs();
    renderFilters();
    bindEvents();
    updateViewButtons();
    render();
  }

  function readState() {
    const p = new URLSearchParams(location.search);
    const list = key => {
      const values = [];
      p.getAll(key).forEach(v => String(v).split(",").forEach(x => { if (x.trim()) values.push(x.trim()); }));
      return values;
    };
    return {
      q: (p.get("q") || "").trim(),
      subjects: new Set(list("subject")),
      providers: new Set(list("provider")),
      levels: new Set(list("level")),
      languages: new Set(list("language")),
      prices: new Set(list("price")),
      certificates: new Set(list("certificate")),
      durations: new Set(list("duration")),
      collection: p.get("collection") || "",
      sort: p.get("sort") || "recommended",
      shown: PAGE_SIZE
    };
  }

  function writeURL() {
    const p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    FILTER_KEYS.forEach(key => {
      state[key].forEach(value => p.append(PARAM_BY_KEY[key], value));
    });
    if (state.collection) p.set("collection", state.collection);
    if (state.sort && state.sort !== "recommended") p.set("sort", state.sort);
    const qs = p.toString();
    try {
      history.replaceState(null, "", "courses.html" + (qs ? "?" + qs : ""));
    } catch (e) {}
  }

  function syncSearchInputs() {
    const input = document.getElementById("browseSearch");
    if (input) input.value = state.q;
    const sort = document.getElementById("sortSelect");
    if (sort) sort.value = state.sort;
  }

  function optionMeta(key) {
    switch (key) {
      case "subjects":
        return { label: "Subject", open: true, options: D.subjects.map(s => ({ value: s.id, label: s.name })) };
      case "providers": {
        const counts = {};
        D.courses.forEach(c => { counts[c.provider] = (counts[c.provider] || 0) + 1; });
        return {
          label: "Provider", open: false, scroll: true,
          options: Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b))
            .map(id => ({ value: id, label: D.providers[id] ? D.providers[id].name : id }))
        };
      }
      case "levels":
        return { label: "Level", open: true, options: D.levels.map(v => ({ value: v, label: v })) };
      case "languages":
        return { label: "Language", open: false, options: D.languages.map(v => ({ value: v, label: v })) };
      case "prices":
        return {
          label: "Price", open: true,
          options: [
            { value: "free", label: "Completely free" },
            { value: "audit", label: "Free to audit" }
          ]
        };
      case "certificates":
        return {
          label: "Certificate", open: true,
          options: [
            { value: "free", label: "Free certificate" },
            { value: "paid", label: "Paid certificate" },
            { value: "none", label: "No certificate" }
          ]
        };
      case "durations":
        return {
          label: "Duration", open: false,
          options: [
            { value: "short", label: "Under 10 hours" },
            { value: "medium", label: "10–40 hours" },
            { value: "long", label: "40+ hours" }
          ]
        };
      default:
        return { label: key, open: false, options: [] };
    }
  }

  function renderFilters() {
    const host = document.getElementById("filterGroups");
    if (!host) return;
    host.innerHTML = FILTER_KEYS.map(key => {
      const meta = optionMeta(key);
      const selected = state[key].size > 0;
      return '<details class="filter-group"' + (meta.open || selected ? " open" : "") + '>' +
        "<summary>" + LN.esc(meta.label) + "</summary>" +
        '<div class="filter-options' + (meta.scroll ? " filter-scroll" : "") + '">' +
          meta.options.map(opt => {
            const count = countFor(key, opt.value);
            const checked = state[key].has(opt.value);
            return '<label class="filter-option' + (count === 0 && !checked ? " is-empty" : "") + '">' +
              '<input type="checkbox" data-filter="' + key + '" value="' + LN.esc(opt.value) + '"' + (checked ? " checked" : "") + " />" +
              '<span class="label">' + LN.esc(opt.label) + "</span>" +
              '<span class="filter-count">' + count + "</span></label>";
          }).join("") +
        "</div></details>";
    }).join("");

    updateCountBadges();
  }

  function updateCountBadges() {
    const activeCount = FILTER_KEYS.reduce((n, key) => n + state[key].size, 0) + (state.collection ? 1 : 0);
    ["filterCount", "filterCountMobile"].forEach(id => {
      const badge = document.getElementById(id);
      if (!badge) return;
      badge.textContent = activeCount;
      badge.hidden = activeCount === 0;
    });
  }

  function updateFilterCounts() {
    document.querySelectorAll("input[data-filter]").forEach(input => {
      const key = input.getAttribute("data-filter");
      const value = input.value;
      const count = countFor(key, value);
      const label = input.closest(".filter-option");
      const span = label ? label.querySelector(".filter-count") : null;
      if (span) span.textContent = count;
      if (label) label.classList.toggle("is-empty", count === 0 && !state[key].has(value));
    });
    updateCountBadges();
  }

  function matchValue(course, key) {
    switch (key) {
      case "subjects": return course.subject;
      case "providers": return course.provider;
      case "levels": return course.level;
      case "languages": return course.language;
      case "prices": return course.price;
      case "certificates": return course.certificate;
      case "durations": return durationBucket(course.durationHours);
      default: return "";
    }
  }

  function durationBucket(hours) {
    const h = Number(hours || 0);
    if (h < 10) return "short";
    if (h <= 40) return "medium";
    return "long";
  }

  function collectionCourseIds() {
    if (!state.collection) return null;
    const col = D.collections.find(c => c.id === state.collection);
    return col ? new Set(col.courseIds) : new Set();
  }

  function matches(course, excludeKey) {
    if (state.q && !LN.matchesQuery(course, state.q)) return false;
    const ids = collectionCourseIds();
    if (ids && !ids.has(course.id)) return false;
    for (const key of FILTER_KEYS) {
      if (key === excludeKey) continue;
      const set = state[key];
      if (set.size && !set.has(matchValue(course, key))) return false;
    }
    return true;
  }

  function countFor(key, value) {
    return D.courses.filter(c => matches(c, key) && matchValue(c, key) === value).length;
  }

  function getResults() {
    return D.courses.filter(c => matches(c, null));
  }

  function sortResults(list) {
    const arr = list.slice();
    switch (state.sort) {
      case "rating":
        arr.sort((a, b) => Number(b.score) - Number(a.score) || Number(b.popularity) - Number(a.popularity));
        break;
      case "popular":
        arr.sort((a, b) => Number(b.popularity) - Number(a.popularity) || Number(b.score) - Number(a.score));
        break;
      case "newest":
        arr.sort((a, b) => new Date(b.added) - new Date(a.added));
        break;
      case "shortest":
        arr.sort((a, b) => Number(a.durationHours) - Number(b.durationHours) || Number(b.score) - Number(a.score));
        break;
      default:
        arr.sort((a, b) =>
          Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
          Number(b.popularity) - Number(a.popularity) ||
          Number(b.score) - Number(a.score));
    }
    return arr;
  }

  function currentCollection() {
    return state.collection ? D.collections.find(c => c.id === state.collection) : null;
  }

  function render() {
    results = sortResults(getResults());
    const collection = currentCollection();

    const title = document.getElementById("browseTitle");
    const sub = document.getElementById("browseSub");
    if (title) {
      if (collection) title.textContent = collection.title;
      else if (state.q) title.textContent = "Search results for “" + state.q + "”";
      else if (state.subjects.size === 1) {
        const s = D.subjects.find(x => x.id === Array.from(state.subjects)[0]);
        title.textContent = s ? s.name + " courses" : "Free courses";
      } else if (state.providers.size === 1) {
        const p = D.providers[Array.from(state.providers)[0]];
        title.textContent = p ? "Courses from " + p.name : "Free courses";
      } else {
        title.textContent = "All free courses";
      }
    }
    if (sub) {
      if (collection) sub.textContent = collection.blurb;
      else if (state.q) sub.textContent = "Free courses in the Learnova catalogue that match your search.";
      else sub.textContent = "Hand-checked courses from " + new Set(D.courses.map(c => c.provider)).size +
        " providers. Filter by level, language, price, certificate, and time commitment.";
    }

    const banner = document.getElementById("collectionBanner");
    if (banner) {
      banner.hidden = !collection;
      banner.innerHTML = collection
        ? '<span class="collection-icon" aria-hidden="true">' + LN.esc(collection.icon) + "</span>" +
          "<div><h2>" + LN.esc(collection.title) + "</h2><p>" + LN.esc(collection.blurb) + "</p></div>"
        : "";
    }

    const summary = document.getElementById("resultSummary");
    if (summary) {
      const shown = Math.min(state.shown, results.length);
      summary.innerHTML = results.length
        ? "Showing <strong>" + shown + "</strong> of <strong>" + results.length + "</strong> " + LN.plural(results.length, "course")
        : "No courses match these filters";
    }

    const shown = results.slice(0, state.shown);
    const grid = document.getElementById("courseGrid");
    if (grid) {
      grid.classList.toggle("is-list", view === "list");
      grid.innerHTML = shown.map(c => LN.courseCard(c)).join("");
    }

    const empty = document.getElementById("emptyState");
    if (empty) empty.hidden = results.length > 0;
    if (grid) grid.hidden = results.length === 0;

    const moreWrap = document.getElementById("loadMoreWrap");
    if (moreWrap) moreWrap.hidden = results.length <= state.shown;
    const moreBtn = document.getElementById("loadMoreBtn");
    if (moreBtn) moreBtn.textContent = "Show more courses (" + Math.max(0, results.length - state.shown) + " left)";

    renderActiveFilters();
    const scanLink = document.getElementById("emptyScanLink");
    if (scanLink) scanLink.href = LN.scanPath(state.q || "free courses");
    const calloutLink = document.getElementById("browseScanLink");
    if (calloutLink) calloutLink.href = LN.scanPath(state.q || "free courses");

    writeURL();
    document.title = (title ? title.textContent : "All free courses") + " — Learnova";
  }

  function filterLabel(key, value) {
    if (key === "subjects") {
      const s = D.subjects.find(x => x.id === value);
      return s ? s.name : value;
    }
    if (key === "providers") return D.providers[value] ? D.providers[value].name : value;
    if (key === "prices") return value === "free" ? "Completely free" : "Free to audit";
    if (key === "certificates") return value === "free" ? "Free certificate" : value === "paid" ? "Paid certificate" : "No certificate";
    if (key === "durations") return value === "short" ? "Under 10 hours" : value === "medium" ? "10–40 hours" : "40+ hours";
    return value;
  }

  function renderActiveFilters() {
    const host = document.getElementById("activeFilters");
    if (!host) return;
    const chips = [];
    if (state.q) {
      chips.push('<span class="filter-chip">Search: ' + LN.esc(state.q) +
        '<button type="button" data-clear-filter="q" aria-label="Clear search">×</button></span>');
    }
    if (state.collection) {
      const col = currentCollection();
      chips.push('<span class="filter-chip">' + LN.esc(col ? col.title : state.collection) +
        '<button type="button" data-clear-filter="collection" aria-label="Clear collection">×</button></span>');
    }
    FILTER_KEYS.forEach(key => {
      state[key].forEach(value => {
        chips.push('<span class="filter-chip">' + LN.esc(filterLabel(key, value)) +
          '<button type="button" data-clear-filter="' + key + '" data-clear-value="' + LN.esc(value) + '" aria-label="Clear filter">×</button></span>');
      });
    });
    if (chips.length > 1) {
      chips.push('<button class="filters-clear" type="button" data-clear-all>Clear all</button>');
    }
    host.innerHTML = chips.join("");
  }

  function clearGroup(key, value) {
    if (key === "q") state.q = "";
    else if (key === "collection") state.collection = "";
    else if (state[key]) state[key].delete(value);
    state.shown = PAGE_SIZE;
    syncSearchInputs();
    updateFilterCounts();
    render();
  }

  function clearAll() {
    state.q = "";
    state.collection = "";
    FILTER_KEYS.forEach(key => state[key].clear());
    state.shown = PAGE_SIZE;
    syncSearchInputs();
    updateFilterCounts();
    render();
  }

  function toggleFilters(open) {
    const aside = document.getElementById("filters");
    const btn = document.getElementById("filtersToggle");
    if (!aside) return;
    const next = typeof open === "boolean" ? open : !aside.classList.contains("open");
    aside.classList.toggle("open", next);
    document.body.classList.toggle("filters-open", next);
    if (btn) btn.setAttribute("aria-expanded", String(next));
  }

  function updateViewButtons() {
    document.querySelectorAll("[data-view]").forEach(btn => {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-view") === view));
    });
    const grid = document.getElementById("courseGrid");
    if (grid) grid.classList.toggle("is-list", view === "list");
  }

  function bindEvents() {
    const search = document.getElementById("browseSearch");
    const searchForm = document.getElementById("browseSearchForm");
    if (searchForm) searchForm.addEventListener("submit", e => {
      e.preventDefault();
      state.q = search ? search.value.trim() : state.q;
      state.shown = PAGE_SIZE;
      updateFilterCounts();
      render();
    });
    if (search) search.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.q = search.value.trim();
        state.shown = PAGE_SIZE;
        updateFilterCounts();
        render();
      }, 220);
    });

    const sort = document.getElementById("sortSelect");
    if (sort) sort.addEventListener("change", () => {
      state.sort = sort.value;
      state.shown = PAGE_SIZE;
      render();
    });

    const grid = document.getElementById("courseGrid");
    if (grid) grid.addEventListener("change", e => {
      if (!e.target.matches("[data-filter]")) return;
      const key = e.target.getAttribute("data-filter");
      const value = e.target.value;
      if (e.target.checked) state[key].add(value);
      else state[key].delete(value);
      state.shown = PAGE_SIZE;
      updateFilterCounts();
      render();
    });

    const filterGroups = document.getElementById("filterGroups");
    if (filterGroups) filterGroups.addEventListener("change", e => {
      if (!e.target.matches("[data-filter]")) return;
      const key = e.target.getAttribute("data-filter");
      const value = e.target.value;
      if (e.target.checked) state[key].add(value);
      else state[key].delete(value);
      state.shown = PAGE_SIZE;
      updateFilterCounts();
      render();
    });

    const clearBtn = document.getElementById("clearFilters");
    if (clearBtn) clearBtn.addEventListener("click", clearAll);
    const emptyClear = document.getElementById("emptyClearBtn");
    if (emptyClear) emptyClear.addEventListener("click", clearAll);
    const active = document.getElementById("activeFilters");
    if (active) active.addEventListener("click", e => {
      const clear = e.target.closest("[data-clear-filter]");
      if (clear) {
        clearGroup(clear.getAttribute("data-clear-filter"), clear.getAttribute("data-clear-value"));
        return;
      }
      if (e.target.closest("[data-clear-all]")) clearAll();
    });

    const moreBtn = document.getElementById("loadMoreBtn");
    if (moreBtn) moreBtn.addEventListener("click", () => {
      state.shown += PAGE_SIZE;
      render();
    });

    const filtersToggle = document.getElementById("filtersToggle");
    if (filtersToggle) filtersToggle.addEventListener("click", () => toggleFilters());
    const filterClose = document.getElementById("filtersClose");
    if (filterClose) filterClose.addEventListener("click", () => toggleFilters(false));
    const overlay = document.getElementById("filterOverlay");
    if (overlay) overlay.addEventListener("click", () => toggleFilters(false));
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") toggleFilters(false);
    });

    document.querySelectorAll("[data-view]").forEach(btn => btn.addEventListener("click", () => {
      view = btn.getAttribute("data-view") === "list" ? "list" : "grid";
      try { localStorage.setItem("lnv1_view", view); } catch (e) {}
      updateViewButtons();
      render();
    }));

    window.addEventListener("ln:state", () => {
      // Keep card save buttons in sync without losing the current results.
      document.querySelectorAll("[data-course-card]").forEach(card => {
        const id = card.getAttribute("data-course-card");
        const btn = card.querySelector("[data-save]");
        if (!btn) return;
        const isSaved = Boolean(LN.getStatus(id));
        btn.setAttribute("aria-pressed", String(isSaved));
        btn.setAttribute("aria-label", isSaved ? "Remove from My learning" : "Save to My learning");
      });
    });
  }
})();
