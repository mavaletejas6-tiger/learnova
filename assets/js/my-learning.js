/* ============================================================
   LEARNOVA — My learning
   ============================================================ */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", init);

  const TABS = ["saved", "learning", "completed", "reviews"];
  let D, LN, activeTab = "saved", allReviews = [], reviewsLoaded = false;
  let remoteAtBoot = false;

  const STATUS_COPY = {
    saved: {
      title: "Saved for later",
      blurb: "Courses you want to come back to. Open one when you are ready to start.",
      emptyTitle: "Nothing saved yet",
      emptyText: "Tap the bookmark on any course to keep it here. No account is needed."
    },
    learning: {
      title: "In progress",
      blurb: "Courses you have started. Move them to completed when you finish.",
      emptyTitle: "No courses in progress",
      emptyText: "Mark a saved course as “In progress” to keep your current learning front and centre."
    },
    completed: {
      title: "Completed",
      blurb: "A record of what you have finished — useful when you need a confidence boost.",
      emptyTitle: "No completed courses yet",
      emptyText: "When you finish a course, change its status to completed. The progress stays in this browser."
    }
  };

  function init() {
    D = window.LN_DATA;
    LN = window.LN;
    if (!D || !LN) return;

    const hash = (location.hash || "").replace("#", "");
    if (TABS.includes(hash)) activeTab = hash;

    bindTabs();
    window.addEventListener("ln:state", () => {
      renderProfile();
      updateStats();
      updateTabState();
      renderRecent();
      const isRemote = LN.isRemoteReady();
      if (isRemote !== remoteAtBoot) {
        remoteAtBoot = isRemote;
        loadReviews();
      } else if (activeTab !== "reviews" || reviewsLoaded) {
        renderPanel();
      }
    });

    renderProfile();
    updateStats();
    updateTabState();
    renderPanel();
    renderRecent();
    remoteAtBoot = LN.isRemoteReady();
    loadReviews();
    document.title = "My learning — Learnova";
  }

  /* ---------- profile ---------- */
  function renderProfile() {
    const host = document.getElementById("learningProfile");
    if (!host) return;
    const profile = LN.getProfile();
    const remote = Boolean(profile && profile.remote);
    const greeting = document.getElementById("learningGreeting");
    const firstName = profile ? String(profile.name || "Learner").trim().split(/\s+/)[0] : "";

    if (greeting) {
      greeting.textContent = profile
        ? "Welcome back, " + firstName + ". Your saved courses, progress, and reviews are here."
        : "Save courses, track your progress, and write reviews. You can start without an account.";
    }

    if (profile) {
      host.innerHTML =
        '<span class="avatar" aria-hidden="true">' + LN.esc((profile.name || "L").trim().charAt(0).toUpperCase() || "L") + "</span>" +
        '<div class="learning-profile-main"><strong>' + LN.esc(profile.name) + "</strong>" +
          "<span>" + LN.esc(profile.email || (remote ? "Signed in" : "Saved on this device")) +
          " · " + (remote ? "Synced account" : "Local profile") + "</span></div>" +
        '<div class="learning-profile-actions">' +
          '<button class="btn btn-outline btn-sm" type="button" data-auth-open>Manage profile</button>' +
          '<a class="btn btn-ghost btn-sm" href="courses.html">Find a course</a>' +
        "</div>";
    } else {
      host.innerHTML =
        '<span class="avatar" aria-hidden="true" style="background:linear-gradient(135deg,var(--teal),#54CDBF)">L</span>' +
        '<div class="learning-profile-main"><strong>Make this space yours</strong>' +
          "<span>A profile adds your name to reviews. Saving courses and tracking progress already work without one.</span></div>" +
        '<div class="learning-profile-actions">' +
          '<button class="btn btn-primary btn-sm" type="button" data-auth-open>Create a profile</button>' +
          '<a class="btn btn-ghost btn-sm" href="courses.html">Browse courses</a>' +
        "</div>";
    }

    const note = document.getElementById("privacyNote");
    if (note) {
      if (LN.isBackendConfigured()) {
        note.innerHTML = LN.isRemoteReady()
          ? "You are signed in. Saved courses and reviews sync to your Learnova account through Supabase."
          : "This browser is your workspace for now. Sign in to sync saved courses and reviews across devices.";
      } else {
        note.textContent = "Your saved courses, progress, and reviews live in this browser only. They are not sold or shared. Connect Supabase in assets/js/config.js to sync across devices.";
      }
    }
  }

  /* ---------- stats and tabs ---------- */
  function counts() {
    const result = { saved: 0, learning: 0, completed: 0 };
    D.courses.forEach(c => {
      const status = LN.getStatus(c.id);
      if (status) result[status] += 1;
    });
    result.reviews = reviewsLoaded ? allReviews.length : LN.localReviewCount();
    return result;
  }

  function updateStats() {
    const c = counts();
    setText("statSaved", c.saved);
    setText("statLearning", c.learning);
    setText("statCompleted", c.completed);
    setText("statReviews", c.reviews);
  }

  function updateTabState() {
    const c = counts();
    setText("tabCountSaved", c.saved);
    setText("tabCountLearning", c.learning);
    setText("tabCountCompleted", c.completed);
    setText("tabCountReviews", c.reviews);

    document.querySelectorAll("[data-learning-tab]").forEach(btn => {
      const tab = btn.getAttribute("data-learning-tab");
      const selected = tab === activeTab;
      btn.setAttribute("aria-selected", String(selected));
      btn.setAttribute("tabindex", selected ? "0" : "-1");
    });
    const panel = document.getElementById("learningPanel");
    if (panel) panel.setAttribute("aria-labelledby", "ltab-" + activeTab);
  }

  function bindTabs() {
    const buttons = Array.from(document.querySelectorAll("[data-learning-tab]"));
    buttons.forEach(btn => {
      btn.addEventListener("click", () => setTab(btn.getAttribute("data-learning-tab")));
      btn.addEventListener("keydown", e => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        const current = buttons.indexOf(btn);
        const next = e.key === "ArrowRight"
          ? (current + 1) % buttons.length
          : (current - 1 + buttons.length) % buttons.length;
        buttons[next].focus();
        setTab(buttons[next].getAttribute("data-learning-tab"));
      });
    });
  }

  function setTab(tab) {
    if (!TABS.includes(tab)) return;
    activeTab = tab;
    updateTabState();
    renderPanel();
    try {
      history.replaceState(null, "", location.pathname + location.search + "#" + tab);
    } catch (e) {}
  }

  /* ---------- panels ---------- */
  function renderPanel() {
    const panel = document.getElementById("learningPanel");
    if (!panel) return;
    if (activeTab === "reviews") {
      renderReviewsPanel(panel);
      return;
    }

    const meta = STATUS_COPY[activeTab];
    const list = D.courses
      .filter(c => LN.getStatus(c.id) === activeTab)
      .sort((a, b) => Number(b.popularity) - Number(a.popularity) || Number(b.score) - Number(a.score));

    panel.innerHTML =
      '<div class="learning-panel-head"><div><h2>' + meta.title + "</h2><p>" + meta.blurb + "</p></div>" +
        '<a class="btn btn-outline btn-sm" href="courses.html">Find more courses</a></div>' +
      (list.length
        ? '<div class="learning-list">' + list.map(learningItem).join("") + "</div>"
        : emptyState(meta.emptyTitle, meta.emptyText, activeTab));
  }

  function learningItem(c) {
    const s = LN.subjectOf(c);
    const p = LN.providerOf(c);
    const status = LN.getStatus(c.id) || "";
    const cert = c.certificate === "free" ? "Free certificate" : c.certificate === "paid" ? "Certificate paid" : "No certificate";
    return '<article class="learning-item" data-learning-id="' + LN.esc(c.id) + '">' +
      '<a class="learning-cover" href="' + LN.coursePath(c.id) + '" style="' + LN.coverColors(c) + '" aria-label="Open ' + LN.esc(c.title) + '">' +
        '<span class="cover-icon" aria-hidden="true">' + LN.esc(s.icon) + "</span>" +
        '<span class="cover-provider">' + LN.esc(p.initials) + "</span>" +
      "</a>" +
      '<div class="learning-info">' +
        '<div class="card-provider"><span class="provider-initial" style="--pcolor:' + p.color + ';--ptext:' + (p.text || "#fff") + '">' + LN.esc(p.initials) + "</span>" + LN.esc(c.institution || p.name) + "</div>" +
        '<h3><a href="' + LN.coursePath(c.id) + '">' + LN.esc(c.title) + "</a></h3>" +
        '<div class="small">' + LN.esc(c.durationLabel) + " · " + LN.esc(c.level) + " · " + cert + "</div>" +
      "</div>" +
      '<div class="learning-actions">' +
        '<label class="sr-only" for="status-' + LN.esc(c.id) + '">Learning status for ' + LN.esc(c.title) + "</label>" +
        '<select class="select status-select" id="status-' + LN.esc(c.id) + '" data-status-select="' + LN.esc(c.id) + '">' +
          '<option value=""' + (!status ? " selected" : "") + ">Not saved</option>" +
          '<option value="saved"' + (status === "saved" ? " selected" : "") + ">Saved</option>" +
          '<option value="learning"' + (status === "learning" ? " selected" : "") + ">In progress</option>" +
          '<option value="completed"' + (status === "completed" ? " selected" : "") + ">Completed</option>" +
        "</select>" +
        '<button class="btn btn-icon btn-outline" type="button" data-remove-course="' + LN.esc(c.id) + '" aria-label="Remove ' + LN.esc(c.title) + ' from My learning" title="Remove from My learning">' +
          '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/></svg>' +
        "</button>" +
      "</div>" +
    "</article>";
  }

  function emptyState(title, text, tab) {
    const secondary = tab === "saved"
      ? '<a class="btn btn-outline" href="scan.html">Try the live scan</a>'
      : '<button class="btn btn-outline" type="button" data-learning-tab-link="saved">See saved courses</button>';
    return '<div class="learning-empty"><h2>' + LN.esc(title) + "</h2><p>" + text + "</p>" +
      '<div class="empty-actions"><a class="btn btn-primary" href="courses.html">Browse free courses</a>' + secondary + "</div></div>";
  }

  /* ---------- reviews ---------- */
  async function loadReviews() {
    try {
      allReviews = await LN.myReviews();
    } catch (err) {
      allReviews = [];
    }
    reviewsLoaded = true;
    updateStats();
    updateTabState();
    if (activeTab === "reviews") renderPanel();
  }

  function renderReviewsPanel(panel) {
    const head = '<div class="learning-panel-head"><div><h2>Your learner reviews</h2>' +
      '<p>Reviews you have written. They are separate from the Learnova editorial score.</p></div>' +
      '<a class="btn btn-outline btn-sm" href="courses.html">Review another course</a></div>';

    if (!reviewsLoaded) {
      panel.innerHTML = head + '<div class="learning-empty"><h2>Loading your reviews…</h2></div>';
      return;
    }

    if (!allReviews.length) {
      panel.innerHTML = head + '<div class="learning-empty">' +
        "<h2>No reviews yet</h2>" +
        "<p>Open any course, read its overview, and use the learner reviews tab when you are ready to share your experience.</p>" +
        '<div class="empty-actions"><a class="btn btn-primary" href="courses.html">Find a course to review</a></div>' +
      "</div>";
      return;
    }

    panel.innerHTML = head +
      '<div class="learning-list">' + allReviews.map(r => reviewItem(r)).join("") + "</div>";
  }

  function reviewItem(r) {
    const c = r.course;
    if (!c) return "";
    const p = LN.providerOf(c);
    return '<article class="review-item">' +
      '<div class="review-item-head">' +
        LN.starsMarkup(r.rating || 0) +
        '<span class="small">' + LN.esc(LN.formatDate(r.date)) + " · " + (r.remote ? "Synced" : "This device") + "</span>" +
      "</div>" +
      '<h3><a href="' + LN.coursePath(c.id) + '#reviews">' + LN.esc(c.title) + "</a></h3>" +
      "<p>" + LN.esc(r.body) + "</p>" +
      '<div class="small" style="margin-top:.45rem">' + LN.esc(p.name) + " · " + LN.esc(c.durationLabel) + "</div>" +
    "</article>";
  }

  /* ---------- recently viewed ---------- */
  function renderRecent() {
    const section = document.getElementById("recentSection");
    const grid = document.getElementById("recentGrid");
    if (!section || !grid) return;
    const list = LN.recentCourses(3);
    section.hidden = list.length === 0;
    grid.innerHTML = list.map(c => LN.courseCard(c)).join("");
  }

  /* ---------- misc ---------- */
  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
  }

  document.addEventListener("click", e => {
    const link = e.target.closest("[data-learning-tab-link]");
    if (link) setTab(link.getAttribute("data-learning-tab-link"));
  });
})();
