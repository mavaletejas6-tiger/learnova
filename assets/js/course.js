/* ============================================================
   LEARNOVA — course detail page
   ============================================================ */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", init);

  let D, LN, course, reviews = [], reviewsLoaded = false, reviewRating = 0;
  let activeTab = "overview";

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "syllabus", label: "Syllabus" },
    { id: "reviews", label: "Learner reviews" }
  ];

  function init() {
    D = window.LN_DATA;
    LN = window.LN;
    if (!D || !LN) return;

    const params = new URLSearchParams(location.search);
    const id = (params.get("id") || "").trim();
    course = LN.courseOf(id);

    if (!course) {
      renderNotFound();
      return;
    }

    const hashTab = (location.hash || "").replace("#", "");
    if (TABS.some(t => t.id === hashTab)) activeTab = hashTab;

    renderHero();
    renderBody();
    bindTabs();
    bindLearning();
    bindShare();
    window.addEventListener("hashchange", () => {
      const tab = (location.hash || "").replace("#", "");
      if (TABS.some(t => t.id === tab)) selectTab(tab);
    });
    updateLearningUI();
    markMeta();
    LN.markViewed(course.id);
    loadReviews();
  }

  /* ---------- formatting ---------- */
  function priceText(c) {
    return c.price === "free" ? "Free" : "Free to audit";
  }

  function priceNote(c) {
    return c.price === "free"
      ? "Completely free to learn"
      : "Lessons are free to audit; a certificate may cost money";
  }

  function certificateText(c) {
    if (c.certificate === "free") return "Free certificate";
    if (c.certificate === "paid") return "Paid certificate";
    return "No certificate";
  }

  function externalLink(url, label, extraClass) {
    return '<a class="' + (extraClass || "") + '" href="' + LN.esc(url) + '" target="_blank" rel="noopener noreferrer">' +
      label + ' <span aria-hidden="true">↗</span></a>';
  }

  function statusOptions(current) {
    return '<option value=""' + (!current ? " selected" : "") + ">Not in My learning</option>" +
      '<option value="saved"' + (current === "saved" ? " selected" : "") + ">Saved</option>" +
      '<option value="learning"' + (current === "learning" ? " selected" : "") + ">In progress</option>" +
      '<option value="completed"' + (current === "completed" ? " selected" : "") + ">Completed</option>";
  }

  /* ---------- hero ---------- */
  function renderHero() {
    const c = course;
    const s = LN.subjectOf(c);
    const p = LN.providerOf(c);
    const cover = LN.coverColors(c);
    const certBadge = c.certificate === "free"
      ? '<span class="badge badge-cert">Free certificate</span>'
      : c.certificate === "paid"
        ? '<span class="badge badge-cert-paid">Certificate paid</span>'
        : '<span class="badge badge-none">No certificate</span>';

    const html =
      '<nav class="breadcrumbs" aria-label="Breadcrumb">' +
        '<a href="index.html">Home</a><span class="sep" aria-hidden="true">/</span>' +
        '<a href="courses.html">Courses</a><span class="sep" aria-hidden="true">/</span>' +
        '<a href="' + LN.browsePath({ subject: c.subject }) + '">' + LN.esc(s.name) + '</a>' +
        '<span class="sep" aria-hidden="true">/</span><span aria-current="page">' + LN.esc(c.title) + "</span>" +
      "</nav>" +
      '<div class="course-hero-grid">' +
        "<div>" +
          '<div class="course-kicker">' +
            '<span class="badge ' + (c.price === "free" ? "badge-free" : "badge-audit") + '">' + priceText(c) + "</span>" +
            certBadge +
            '<span class="badge badge-level">' + LN.esc(c.level) + "</span>" +
          "</div>" +
          '<h1 class="course-title">' + LN.esc(c.title) + "</h1>" +
          '<p class="course-lead">' + LN.esc(c.short) + "</p>" +
          '<div class="course-meta-row">' +
            '<span class="card-score" title="Learnova editorial score"><span class="star" aria-hidden="true">★</span>' + LN.scoreText(c.score) + "</span>" +
            '<span class="score-label">Learnova score</span>' +
            '<span class="meta-dot" aria-hidden="true">·</span><span>' + LN.esc(c.durationLabel) + "</span>" +
            '<span class="meta-dot" aria-hidden="true">·</span><span>' + LN.esc(c.level) + "</span>" +
            '<span class="meta-dot" aria-hidden="true">·</span><span>' + LN.esc(c.language) + "</span>" +
          "</div>" +
          '<div class="instructor-row">' +
            '<span class="provider-initial" style="--pcolor:' + p.color + ';--ptext:' + (p.text || "#fff") + '">' + LN.esc(p.initials) + "</span>" +
            "<span>" + (c.instructor ? "Taught by <strong>" + LN.esc(c.instructor) + "</strong> · " : "Created by ") +
            "<a href=" + '"' + LN.browsePath({ provider: c.provider }) + '"' + ">" + LN.esc(c.institution || p.name) + "</a></span>" +
          "</div>" +
        "</div>" +
        '<aside class="enroll-card" aria-label="Start this course">' +
          '<a class="enroll-cover" href="' + LN.esc(c.url) + '" target="_blank" rel="noopener noreferrer" style="' + cover + '" aria-label="Open ' + LN.esc(c.title) + ' on ' + LN.esc(p.name) + '">' +
            '<span class="cover-icon" aria-hidden="true">' + LN.esc(s.icon) + "</span>" +
            '<span class="cover-provider">' + LN.esc(p.initials) + "</span>" +
          "</a>" +
          '<div class="enroll-body">' +
            '<div class="enroll-price"><strong>' + priceText(c) + "</strong><span>" + certLabelShort(c) + "</span></div>" +
            '<div class="enroll-actions">' +
              '<a class="btn btn-primary btn-lg" href="' + LN.esc(c.url) + '" target="_blank" rel="noopener noreferrer">Start on ' + LN.esc(p.name) + ' <span aria-hidden="true">↗</span></a>' +
              '<button class="btn btn-outline" type="button" id="detailSaveBtn" aria-pressed="false">Save for later</button>' +
            "</div>" +
            '<div class="enroll-status">' +
              '<label for="heroStatus">Your learning status</label>' +
              '<select class="select" id="heroStatus" data-detail-status aria-label="Your learning status for ' + LN.esc(c.title) + '">' +
                statusOptions(LN.getStatus(c.id)) +
              "</select>" +
            "</div>" +
            '<p class="enroll-note">Opens on ' + LN.esc(p.name) + '. Learnova never re-hosts course content.</p>' +
          "</div>" +
          '<dl class="detail-list">' +
            '<div class="detail-row"><dt>Time</dt><dd>' + LN.esc(c.durationLabel) + "</dd></div>" +
            '<div class="detail-row"><dt>Commitment</dt><dd>' + LN.esc(c.weekly || "Self-paced") + "</dd></div>" +
            '<div class="detail-row"><dt>Level</dt><dd>' + LN.esc(c.level) + "</dd></div>" +
            '<div class="detail-row"><dt>Language</dt><dd>' + LN.esc(c.language) + "</dd></div>" +
            '<div class="detail-row"><dt>Certificate</dt><dd>' + certificateText(c) + "</dd></div>" +
          "</dl>" +
          '<div class="provider-box">' +
            '<span class="provider-initial" style="--pcolor:' + p.color + ';--ptext:' + (p.text || "#fff") + '">' + LN.esc(p.initials) + "</span>" +
            "<div><strong>" + LN.esc(p.name) + "</strong><span>" + LN.esc(p.type) + "</span>" +
              '<a href="' + LN.browsePath({ provider: c.provider }) + '">See all courses</a></div>' +
          "</div>" +
        "</aside>" +
      "</div>";

    document.getElementById("courseHeroInner").innerHTML = html;
  }

  function certLabelShort(c) {
    if (c.certificate === "free") return "Free certificate";
    if (c.certificate === "paid") return "Paid certificate";
    return "No certificate";
  }

  /* ---------- body ---------- */
  function renderBody() {
    const c = course;
    const s = LN.subjectOf(c);
    const related = relatedCourses();
    const body = document.getElementById("courseBodyInner");

    body.innerHTML =
      '<div class="course-layout">' +
        '<div class="course-main">' +
          '<div class="tabs" role="tablist" aria-label="Course information">' +
            TABS.map(t =>
              '<button class="tab-btn" type="button" role="tab" id="tab-' + t.id + '" ' +
              'aria-controls="panel-' + t.id + '" aria-selected="' + String(activeTab === t.id) + '" ' +
              'tabindex="' + (activeTab === t.id ? "0" : "-1") + '" data-tab="' + t.id + '">' + t.label + "</button>"
            ).join("") +
          "</div>" +
          '<div id="tabPanels">' +
            '<section class="tab-panel" id="panel-overview" role="tabpanel" aria-labelledby="tab-overview"' + (activeTab === "overview" ? "" : " hidden") + ">" +
              overviewHTML(c) +
            "</section>" +
            '<section class="tab-panel" id="panel-syllabus" role="tabpanel" aria-labelledby="tab-syllabus"' + (activeTab === "syllabus" ? "" : " hidden") + ">" +
              syllabusHTML(c, s) +
            "</section>" +
            '<section class="tab-panel" id="panel-reviews" role="tabpanel" aria-labelledby="tab-reviews"' + (activeTab === "reviews" ? "" : " hidden") + ">" +
              '<div id="reviewRegion" aria-live="polite">' + reviewsLoadingHTML() + "</div>" +
            "</section>" +
          "</div>" +
        "</div>" +
        '<aside class="course-side" aria-label="More course details">' +
          '<div class="side-card side-skills-card">' +
            "<h3>Skills you’ll practise</h3>" +
            '<div class="side-skills">' + (c.skills || []).map(skill => '<span class="skill-chip">' + LN.esc(skill) + "</span>").join("") + "</div>" +
          "</div>" +
          '<div class="side-card">' +
            "<h3>Course at a glance</h3>" +
            '<ul class="side-list">' +
              "<li><span>Provider</span><b>" + LN.esc(c.institution || LN.providerOf(c).name) + "</b></li>" +
              "<li><span>Subject</span><b>" + LN.esc(s.name) + "</b></li>" +
              "<li><span>Duration</span><b>" + LN.esc(c.durationLabel) + "</b></li>" +
              "<li><span>Commitment</span><b>" + LN.esc(c.weekly || "Self-paced") + "</b></li>" +
              "<li><span>Language</span><b>" + LN.esc(c.language) + "</b></li>" +
              "<li><span>Certificate</span><b>" + certificateText(c) + "</b></li>" +
            "</ul>" +
          "</div>" +
          '<div class="side-card">' +
            "<h3>Keep exploring</h3>" +
            '<div class="side-cta">' +
              '<a class="btn btn-outline btn-sm" href="' + LN.browsePath({ subject: c.subject }) + '">More ' + LN.esc(s.name.toLowerCase()) + "</a>" +
              '<a class="btn btn-ghost btn-sm" href="' + LN.browsePath({ provider: c.provider }) + '">Courses from ' + LN.esc(LN.providerOf(c).name) + "</a>" +
              '<a class="btn btn-ghost btn-sm" href="' + LN.scanPath(c.title) + '">Scan the live web</a>' +
            "</div>" +
          "</div>" +
          '<div class="side-card">' +
            "<h3>Share this course</h3>" +
            '<div class="share-row">' +
              '<button class="btn btn-outline btn-sm" type="button" id="shareBtn">Copy link</button>' +
              '<button class="btn btn-outline btn-sm" type="button" id="nativeShareBtn" hidden>Share</button>' +
            "</div>" +
          "</div>" +
        "</aside>" +
      "</div>" +
      '<section class="related-section" aria-labelledby="relatedTitle">' +
        '<div class="section-head">' +
          "<div><span class=\"eyebrow\">Keep going</span><h2 id=\"relatedTitle\">Related free courses</h2>" +
          "<p>More " + LN.esc(s.name.toLowerCase()) + " courses that are free to start.</p></div>" +
          '<a class="link-arrow" href="' + LN.browsePath({ subject: c.subject }) + '">Browse the subject <span aria-hidden="true">→</span></a>' +
        "</div>" +
        '<div class="course-grid course-grid--4">' + related.map(item => LN.courseCard(item)).join("") + "</div>" +
      "</section>";
  }

  function overviewHTML(c) {
    const s = LN.subjectOf(c);
    return '<div class="prose">' +
      "<h2>About this course</h2>" +
      "<p>" + LN.esc(c.description) + "</p>" +
      '<h2>What you’ll learn</h2>' +
      '<div class="skills-list">' + (c.skills || []).map(skill => '<span class="skill-chip">' + LN.esc(skill) + "</span>").join("") + "</div>" +
      '<div class="info-grid">' +
        '<div class="info-card"><h3>Who it’s for</h3><p>' + LN.esc(c.audience || "Anyone who wants to learn " + s.name.toLowerCase() + " for free.") + "</p></div>" +
        '<div class="info-card"><h3>Before you start</h3><p>' + LN.esc(c.requirements || "No prerequisites are listed by the provider.") + "</p></div>" +
      "</div>" +
      "<h2>How to start</h2>" +
      "<p>This course is taught on " + LN.esc(LN.providerOf(c).name) + "’s own website. Use the “Start” button to open the course there, create an account if the provider asks for one, and begin. " +
      (c.price === "free"
        ? "The course itself is free. "
        : "You can usually audit the lessons for free, while graded assignments or a certificate may be paid. ") +
      (c.certificate === "free" ? "A free certificate is available when you finish." : c.certificate === "paid" ? "A certificate may be available for a fee." : "The provider does not list a certificate for this course.") +
      "</p>" +
      '<h2>About the Learnova score</h2>' +
      "<p>The Learnova score is our editorial quality signal, based on the provider’s reputation, the depth of the syllabus, and how useful the course is to a self-directed learner. " +
      "It is not a provider rating and it is not a learner review. Learner reviews below are written by people using Learnova and are shown separately.</p>" +
    "</div>";
  }

  function syllabusHTML(c, s) {
    return '<div class="prose">' +
      "<h2>Typical syllabus</h2>" +
      "<p>This is the sequence published by " + LN.esc(LN.providerOf(c).name) + ". Providers can revise their courses, so check the live course page for the latest version.</p>" +
      '<ol class="syllabus">' +
        (c.syllabus || []).map((topic, i) =>
          "<li><span class=\"syllabus-num\" aria-hidden=\"true\">" + (i + 1) + "</span><span>" + LN.esc(topic) + "</span></li>"
        ).join("") +
      "</ol>" +
      '<p class="syllabus-note">Free to start · ' + LN.esc(c.durationLabel) + " · " + LN.esc(c.level) + " · " + LN.esc(s.name) + "</p>" +
      '<div class="side-cta" style="max-width:280px;margin-top:1.2rem"><a class="btn btn-primary" href="' + LN.esc(c.url) + '" target="_blank" rel="noopener noreferrer">Open the course on ' + LN.esc(LN.providerOf(c).name) + ' <span aria-hidden="true">↗</span></a></div>' +
    "</div>";
  }

  /* ---------- related ---------- */
  function relatedCourses() {
    const sameSubject = D.courses.filter(x => x.id !== course.id && x.subject === course.subject);
    const sameProvider = D.courses.filter(x => x.id !== course.id && x.provider === course.provider && x.subject !== course.subject);
    const fallback = D.courses.filter(x => x.id !== course.id && x.featured);
    const picked = [];
    [sameSubject, sameProvider, fallback].forEach(list => {
      list.forEach(x => {
        if (picked.length < 4 && !picked.some(y => y.id === x.id)) picked.push(x);
      });
    });
    return picked.slice(0, 4);
  }

  /* ---------- tabs ---------- */
  function bindTabs() {
    const buttons = Array.from(document.querySelectorAll(".tab-btn"));
    buttons.forEach(btn => {
      btn.addEventListener("click", () => selectTab(btn.getAttribute("data-tab")));
      btn.addEventListener("keydown", e => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        const current = buttons.indexOf(btn);
        const nextIndex = e.key === "ArrowRight"
          ? (current + 1) % buttons.length
          : (current - 1 + buttons.length) % buttons.length;
        buttons[nextIndex].focus();
        selectTab(buttons[nextIndex].getAttribute("data-tab"));
      });
    });
  }

  function selectTab(id) {
    if (!TABS.some(t => t.id === id)) return;
    activeTab = id;
    document.querySelectorAll(".tab-btn").forEach(btn => {
      const selected = btn.getAttribute("data-tab") === id;
      btn.setAttribute("aria-selected", String(selected));
      btn.setAttribute("tabindex", selected ? "0" : "-1");
    });
    TABS.forEach(t => {
      const panel = document.getElementById("panel-" + t.id);
      if (panel) panel.hidden = t.id !== id;
    });
    const url = location.pathname + location.search + "#" + id;
    try { history.replaceState(null, "", url); } catch (e) {}
  }

  /* ---------- learning state ---------- */
  function bindLearning() {
    const saveBtn = document.getElementById("detailSaveBtn");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        LN.toggleSave(course.id);
        updateLearningUI();
      });
    }

    document.querySelectorAll("[data-detail-status]").forEach(select => {
      select.addEventListener("change", () => {
        LN.setStatus(course.id, select.value);
        updateLearningUI();
      });
    });

    window.addEventListener("ln:state", updateLearningUI);
  }

  function updateLearningUI() {
    if (!course) return;
    const status = LN.getStatus(course.id);
    const saveBtn = document.getElementById("detailSaveBtn");
    if (saveBtn) {
      saveBtn.setAttribute("aria-pressed", String(Boolean(status)));
      saveBtn.textContent = status ? "Remove from My learning" : "Save for later";
    }
    document.querySelectorAll("[data-detail-status]").forEach(select => {
      select.value = status || "";
    });
  }

  /* ---------- reviews ---------- */
  async function loadReviews() {
    try {
      reviews = await LN.fetchReviews(course.id);
    } catch (err) {
      reviews = [];
    }
    reviewsLoaded = true;
    renderReviewsRegion();
  }

  function reviewsLoadingHTML() {
    return '<div class="review-summary" aria-busy="true">' +
      '<div class="review-score"><span class="big">—</span><span class="small">Loading learner reviews…</span></div>' +
      '<p class="muted">Reviews are loaded from this browser, or from the Learnova backend when it is connected.</p>' +
    "</div>";
  }

  function renderReviewsRegion() {
    const host = document.getElementById("reviewRegion");
    if (!host) return;

    if (!reviewsLoaded) {
      host.innerHTML = reviewsLoadingHTML();
      return;
    }

    host.innerHTML =
      reviewSummaryHTML() +
      '<div class="review-list" id="reviewList">' +
        (reviews.length
          ? reviews.map(reviewCardHTML).join("")
          : '<div class="review-empty"><strong>No learner reviews yet.</strong><p>Be the first to share what the course is really like. Reviews are about the learning experience, not the Learnova score.</p></div>') +
      "</div>" +
      reviewFormHTML();

    bindStarPicker();
    bindReviewForm();
  }

  function reviewSummaryHTML() {
    if (!reviews.length) {
      return '<div class="review-summary">' +
        '<div class="review-score"><span class="big">—</span><span class="stars" aria-hidden="true">☆☆☆☆☆</span><span class="small">No learner reviews yet</span></div>' +
        '<div><p style="margin:0 0 .4rem"><strong>Learner reviews are separate from the Learnova score.</strong></p>' +
        '<p class="small muted" style="margin:0">This course has a Learnova editorial score of ' + LN.scoreText(course.score) + ' out of 5 in the box above. ' +
        (LN.isBackendConfigured()
          ? "Learner reviews sync when you sign in; otherwise they stay in this browser."
          : "In local mode, learner reviews are saved only in this browser.") + "</p></div>" +
      "</div>";
    }

    const count = reviews.length;
    const average = reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / count;
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => { const n = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 0))); counts[n] += 1; });

    return '<div class="review-summary">' +
      '<div class="review-score"><span class="big">' + average.toFixed(1) + '</span>' +
      LN.starsMarkup(average) +
      '<span class="small">' + count + " learner " + LN.plural(count, "review") + "</span></div>" +
      '<div class="rating-bars" aria-label="Learner rating breakdown">' +
        [5, 4, 3, 2, 1].map(n => {
          const pct = Math.round((counts[n] / count) * 100);
          return '<div class="rating-bar"><span>' + n + " star" + (n === 1 ? "" : "s") + '</span>' +
            '<span class="rating-track"><span class="rating-fill" style="width:' + pct + '%"></span></span>' +
            "<span>" + counts[n] + "</span></div>";
        }).join("") +
      "</div>" +
    "</div>";
  }

  function reviewCardHTML(r) {
    const name = String(r.name || "Learner");
    const initial = name.trim().charAt(0).toUpperCase() || "L";
    return '<article class="review-card">' +
      '<div class="review-head">' +
        '<span class="avatar" aria-hidden="true">' + LN.esc(initial) + "</span>" +
        '<div class="review-author"><strong>' + LN.esc(name) + "</strong>" +
          "<span>" + (r.date ? "Reviewed " + LN.esc(LN.formatDate(r.date)) : "Learner review") + "</span></div>" +
        LN.starsMarkup(r.rating || 0) +
      "</div>" +
      '<p class="review-body">' + LN.esc(r.body) + "</p>" +
    "</article>";
  }

  function reviewFormHTML() {
    const profile = LN.getProfile();
    const localNote = LN.isBackendConfigured()
      ? "Sign in to save your review to your account. If you are not signed in, it stays in this browser."
      : "Learnova is in local mode, so your review is saved in this browser only. Nothing is sent anywhere.";
    return '<form class="review-form" id="reviewForm" novalidate>' +
      "<h3>Write a learner review</h3>" +
      '<p class="form-note">Share how the course actually felt: the pace, the teaching, and what helped. ' + localNote + "</p>" +
      '<div class="field">' +
        '<label id="ratingLabel">Your rating</label>' +
        '<div class="star-picker" role="group" aria-labelledby="ratingLabel">' +
          [1, 2, 3, 4, 5].map(n =>
            '<button class="star-btn" type="button" data-star="' + n + '" aria-label="' + n + ' star' + (n === 1 ? "" : "s") + '" aria-pressed="false">★</button>'
          ).join("") +
          '<span class="star-picker-label" id="starPickerLabel">Choose a rating</span>' +
        "</div>" +
      "</div>" +
      '<div class="form-row">' +
        '<div class="field"><label for="reviewName">Your name</label>' +
          '<input id="reviewName" type="text" maxlength="60" autocomplete="name" placeholder="e.g. Priya" value="' + LN.esc(profile ? profile.name : "") + '" required /></div>' +
      "</div>" +
      '<div class="field"><label for="reviewBody">What was the course like?</label>' +
        '<textarea id="reviewBody" maxlength="2000" placeholder="What did you learn? Was the pace right? Would you recommend it to another beginner?" required></textarea>' +
      "</div>" +
      '<button class="btn btn-primary" type="submit">Publish review</button>' +
      '<p class="form-msg" id="reviewMsg" role="status" aria-live="polite"></p>' +
    "</form>";
  }

  function bindStarPicker() {
    const buttons = Array.from(document.querySelectorAll("[data-star]"));
    const label = document.getElementById("starPickerLabel");
    if (!buttons.length) return;

    const descriptions = { 1: "Not for me", 2: "Could be better", 3: "Decent", 4: "Really good", 5: "Excellent" };
    const paint = value => {
      buttons.forEach(btn => {
        const n = Number(btn.getAttribute("data-star"));
        btn.classList.toggle("active", n <= value);
        btn.setAttribute("aria-pressed", String(n === value));
      });
      if (label) label.textContent = value ? value + " of 5 · " + descriptions[value] : "Choose a rating";
    };

    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        reviewRating = Number(btn.getAttribute("data-star"));
        paint(reviewRating);
      });
      btn.addEventListener("mouseenter", () => {
        buttons.forEach(b => b.classList.toggle("active", Number(b.getAttribute("data-star")) <= Number(btn.getAttribute("data-star"))));
      });
    });
    const picker = document.querySelector(".star-picker");
    if (picker) picker.addEventListener("mouseleave", () => paint(reviewRating));
    paint(reviewRating);
  }

  function bindReviewForm() {
    const form = document.getElementById("reviewForm");
    if (!form) return;
    const msg = document.getElementById("reviewMsg");

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const nameInput = document.getElementById("reviewName");
      const bodyInput = document.getElementById("reviewBody");
      const name = nameInput.value.trim();
      const body = bodyInput.value.trim();
      const button = form.querySelector("button[type=submit]");

      if (!reviewRating) {
        showMessage(msg, "Please choose a star rating first.", true);
        return;
      }
      if (!body) {
        showMessage(msg, "Please write a short review.", true);
        bodyInput.focus();
        return;
      }
      if (!name) {
        showMessage(msg, "Please add a name for your review.", true);
        nameInput.focus();
        return;
      }

      const old = button.textContent;
      button.disabled = true;
      button.textContent = "Publishing…";
      try {
        const entry = await LN.addReview(course.id, { name: name, rating: reviewRating, body: body });
        reviews.unshift(entry);
        reviewRating = 0;
        renderReviewsRegion();
        LN.toast("Review published. Thank you!");
      } catch (err) {
        showMessage(msg, err.message || "Could not publish your review. Please try again.", true);
        button.disabled = false;
        button.textContent = old;
      }
    });
  }

  function showMessage(el, text, isError) {
    if (!el) return;
    el.textContent = text;
    el.classList.add("show");
    el.classList.toggle("error", Boolean(isError));
  }

  /* ---------- share ---------- */
  function bindShare() {
    const copy = document.getElementById("shareBtn");
    const native = document.getElementById("nativeShareBtn");
    if (native && navigator.share) {
      native.hidden = false;
      native.addEventListener("click", () => {
        navigator.share({ title: course.title, text: course.short, url: location.href }).catch(() => {});
      });
    }
    if (copy) copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        LN.toast("Course link copied");
      } catch (err) {
        LN.toast("Copy the address from your browser to share this course");
      }
    });
  }

  /* ---------- metadata ---------- */
  function markMeta() {
    const c = course;
    const p = LN.providerOf(c);
    const pageUrl = (D.siteUrl || "https://mavaletejas6-tiger.github.io/learnova/") + "course.html?id=" + encodeURIComponent(c.id);
    document.title = c.title + " — Learnova";

    const description = c.short + " Free to " + (c.price === "free" ? "learn" : "audit") + " from " + (c.institution || p.name) + ".";
    setMeta("name", "description", description);
    setMeta("property", "og:title", c.title + " — Learnova");
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", pageUrl);
    setMeta("name", "twitter:title", c.title + " — Learnova");
    setMeta("name", "twitter:description", description);
    setCanonical(pageUrl);

    let script = document.getElementById("courseJsonLd");
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = "courseJsonLd";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Course",
      "name": c.title,
      "description": c.description,
      "url": pageUrl,
      "provider": {
        "@type": "Organization",
        "name": p.name,
        "sameAs": p.url
      },
      "educationalLevel": c.level,
      "inLanguage": c.language,
      "teaches": c.skills || [],
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "category": c.price === "free" ? "Free" : "Free to audit",
        "availability": "https://schema.org/InStock",
        "url": c.url
      }
    });
  }

  function setMeta(attr, value, content) {
    let el = document.querySelector('meta[' + attr + '="' + value + '"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, value);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  function setCanonical(url) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = url;
  }

  /* ---------- not found ---------- */
  function renderNotFound() {
    const hero = document.getElementById("courseHero");
    if (hero) hero.hidden = true;
    document.title = "Course not found — Learnova";
    const body = document.getElementById("courseBodyInner");
    if (!body) return;
    body.innerHTML = '<div class="error-page">' +
      '<span class="eyebrow">Course not found</span>' +
      "<h1>That course isn’t in the catalogue</h1>" +
      "<p>The link may be out of date, or the course may not have been added yet. Browse the catalogue or scan the live web instead.</p>" +
      '<div class="empty-actions">' +
        '<a class="btn btn-primary" href="courses.html">Browse all courses</a>' +
        '<a class="btn btn-outline" href="scan.html">Try the live scan</a>' +
      "</div>" +
    "</div>";
  }
})();
