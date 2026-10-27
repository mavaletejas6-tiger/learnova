# Learnova

Learnova is a free course discovery site for self-directed learners. It combines a
hand-checked catalogue of free-to-start courses with a live web scan for everything outside
the catalogue.

**Live site:** <https://mavaletejas6-tiger.github.io/learnova/>

## What is included

- **70 courses from 30 providers**, across 12 subjects and 6 curated collections.
- **Catalogue browsing** with keyword search, subject, provider, level, language, price,
  certificate, duration, sorting, grid/list layout, and load-more paging.
- **Live course search at the top of the browse page** that queries YouTube, the open web
  (via DuckDuckGo), GitHub, PeerTube, Wikiversity, and DEV Community directly from the
  browser, with per-source status and direct links to the original creator. No API keys are
  required.
- **Newly launched mode** that filters the dated sources — YouTube, GitHub, and PeerTube —
  to free courses and course projects published in the last 90 days. Results carry a date and
  a New/Recent badge, and a one-click fallback shows all-time results. The homepage links
  straight to it with `courses.html?fresh=1`.
- **Course pages** with an overview, typical syllabus, practical details, related courses,
  an honest editorial score, and separate learner reviews.
- **Provider directory** with search, type filters, and course counts.
- **My Learning** for saved courses, in-progress and completed courses, written reviews, and
  recently viewed courses.
- **Live AI scan** that plans searches with a free AI model and fetches real results in the
  browser from YouTube, GitHub, PeerTube, Wikiversity, DEV Community, and the open web.
- **Google web-search links** from both live-search tools for anything outside those indexes.
  Google blocks direct browser scans, so its results open in a new tab; the in-app Web source
  uses DuckDuckGo instead.
- **Local-first state.** Saves, progress, profiles, and reviews work without an account and are
  stored in `localStorage`. Supabase can be connected for email sign-in and cross-device sync.

Every course links to its original provider. Learnova never re-hosts course content.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Homepage: search, subjects, featured courses, collections, providers |
| `courses.html` | Full catalogue with filters, sorting, search, and live course search |
| `course.html?id=...` | Course details, syllabus, reviews, save/progress actions |
| `providers.html` | Provider directory |
| `my-learning.html` | Saved, in-progress, completed, and review history |
| `scan.html` | Existing live AI scan, with `?q=` handoff from the catalogue |

## Project layout

```
assets/
  css/site.css       shared design system and responsive layouts
  js/data.js         course, provider, subject, and collection data
  js/config.js       optional Supabase URL + anon key
  js/site.js         shared state, search, cards, auth, reviews, Supabase runtime
  js/home.js         homepage rendering
  js/browse.js       catalogue filters and search
  js/live-courses.js live web search embedded in the browse page
  js/course.js       course detail page
  js/providers.js    provider directory
  js/my-learning.js  learner workspace
supabase/
  schema.sql         tables, indexes, and row-level security
  README.md          backend setup guide
```

## Run locally

The site is fully static, so any static server works. From the repository root:

```bash
npx serve .
# or
python -m http.server 8000
```

Then open `http://localhost:8000/`.

Do not open the HTML files directly with `file://`; browser security rules can block module
loading and clipboard features. A local server is also required for the live scan and the
browse page’s live course search, which make cross-origin requests from the browser.

## Backend (optional)

Local mode is the default. To enable email sign-in, cross-device saves, and shared reviews:

1. Run [`supabase/schema.sql`](supabase/schema.sql) in a Supabase project.
2. Add the Project URL and publishable/anon key to [`assets/js/config.js`](assets/js/config.js).
3. Follow the full setup and email-template instructions in
   [`supabase/README.md`](supabase/README.md).

The same config is used by `scan.html`, so one backend connection covers the whole site.

## Editing the catalogue

Course data lives in `assets/js/data.js`. Each course needs a unique `id`, a provider/subject
that exists in the data, a real HTTPS course URL, a `price` of `free` or `audit`, and a
`certificate` of `free`, `paid`, or `none`. The UI treats “free to audit” and “completely free”
differently on purpose.

The **Learnova score** is an editorial quality signal, not a learner rating. Learner reviews are
stored and displayed separately.

## Deployment

Pushes to `main` deploy the repository root to GitHub Pages through
[`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml). No build step is
required. The workflow can also be run manually from the Actions tab.

## Design and accessibility

- Responsive from small phones to wide desktops, with no horizontal overflow.
- Keyboard support for tabs, menus, search suggestions, filters, and the review star picker.
- Visible focus styles, skip links, semantic headings, and `aria` labels on interactive controls.
- Reduced-motion and print styles are included.
- Course and review text is escaped before rendering.
