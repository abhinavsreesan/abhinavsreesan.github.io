# Abhinav Sreesan - Data Engineering Portfolio

[![pages-build-deployment](https://github.com/abhinavsreesan/abhinavsreesan.github.io/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/abhinavsreesan/abhinavsreesan.github.io/actions/workflows/pages/pages-build-deployment)

A personal portfolio website for GitHub Pages showcasing experience, projects, skills, certifications, and contact details with project deep-dives, a downloadable resume, and a markdown-based blog.

## Live Site

- https://abhinavsreesan.github.io/

## Features

- One-page, interactive layout with section-based navigation.
- Project summaries with detailed project pages.
- Certifications and academic publication links.
- Resume download and contact links.
- Blog powered by Jekyll posts in markdown.
- Books page powered by GitHub Issues (`books` label) with Amazon links parsed from issue body.

## Structure

- `index.html` - Main site content and sections.
- `assets/css/` - Styling, layout overrides, and theme.
- `assets/js/` - Section transitions and navigation behavior.
- `_posts/` - Markdown blog posts (`YYYY-MM-DD-title.md`).
- `blog/` - Blog index page.
- `books/` - Books index page.
- `_layouts/` - Blog and post layouts for Jekyll.
- `assets/resume/Abhinav's Resume Rev2.pdf` - Resume PDF.
- `assets/resume/Abhinav's Resume Rev2.md` - Resume markdown source used for content updates.
- `images/profile.jpg` - Profile image used in the header.
- `CNAME` - Custom domain configuration (optional).

## Local Development

You can open `index.html` directly, or run a simple local server:

```bash
python -m http.server 8080
```

Then visit:

```
http://localhost:8080
```

For Jekyll blog preview, install dependencies and run:

```bash
bundle exec jekyll serve
```

Then visit:

```
http://localhost:4000
```

## Updating Content

### Home page markdown-managed copy

The landing page now uses one markdown file per major page section:

- `_includes/content/home/overview.md`
- `_includes/content/home/experience.md`
- `_includes/content/home/projects.md`
- `_includes/content/home/certifications.md`
- `_includes/content/home/contact.md`

For files that contain multiple blocks, `index.html` splits using:

- Delimiter: `[[[SECTION]]]`

Keep delimiter order unchanged inside `overview.md`, `experience.md`, and `projects.md`.

Section mapping for delimiter-based files:

- `overview.md`: intro, at-a-glance stats (HTML block), what-I-build list, core-platform badges (HTML block), recent impact list.
- `experience.md`: intro, YipitData bullets, Neudesic bullets, TCS bullets.
- `projects.md`: dynamic project list. Add a new project block and it will automatically appear in Projects and create a matching `View details` article.

`projects.md` structure:

- File starts with one projects intro paragraph.
- Separate each project with `[[[PROJECT]]]`.
- Inside each project block, split fields with `[[[FIELD]]]` in this exact order:
  1) project title
  2) project card summary
  3) project card metadata (optional bullets)
  4) details intro paragraph
  5) details markdown body (can include `###` headings and bullets)

### Resume
Replace the PDF at:

- `assets/resume/Abhinav's Resume Rev2.pdf`

### Profile Image
Replace the image at:

- `images/profile.jpg`

### Projects
Edit summary cards and detailed project sections in `index.html`:

- Summary cards: `#work`
- Detail pages: `#project-*`

### Certifications
Links and details are in the `#certifications` section in `index.html`.

### Blog posts
Create a new file in `_posts/` using:

- `YYYY-MM-DD-title.md`

Template:

```md
---
layout: post
title: "Your Post Title"
date: 2026-03-22 09:00:00 +0530
tags: [azure, databricks]
excerpt: "One-line summary of the post"
---

Write your markdown content here.
```

### Books issues format (recommended)

Create a GitHub issue with label `books` and optionally `books-academic`.

You can use either:

- one issue per book, or
- one issue with multiple ` ```book ` blocks (now supported)

Use this issue body template:

```md
```book
title: Designing Data-Intensive Applications
author: Martin Kleppmann
category: academic
status: reading
amazon: https://www.amazon.in/dp/9352135245
cover: https://images-na.ssl-images-amazon.com/images/P/9352135245.01.LZZZZZZZ.jpg
```

Your notes here...
```

Fields:

- `title` (required for best results)
- `author` (optional)
- `category` (optional: `academic` or `reading`)
- `status` (optional: `reading`, `completed`, etc.)
- `amazon` (recommended; used for button + ASIN cover fallback)
- `cover` (optional override image)

Rendering behavior:

- Books are split into two sections on `/books/`:
  - `Other Books I Am Reading`
  - `Academic Books`
- Category is determined by `category` field or `books-academic` label.
- If `cover` is not provided, the site attempts to derive an Amazon cover image from the ASIN in the `amazon` URL.
- Books are sorted by status priority (`reading` first, then `up next`/`to read`, then `completed`).
- `reading` status renders a visible `Currently Reading` badge on the card.

Multiple books in one issue example:

```md
```book
title: Book One
author: Author One
category: academic
status: reading
amazon: https://www.amazon.in/dp/9352135245
Notes for book one.
```

```book
title: Book Two
author: Author Two
category: reading
status: completed
amazon: https://www.amazon.in/dp/1098108302
Notes for book two.
```
```

Issue template:

- `.github/ISSUE_TEMPLATE/book-entry.yml`

## Deployment

Push to the default branch and enable GitHub Pages in the repository settings. The `CNAME` file supports a custom domain if configured.

## Changelog

<!-- changelog:start -->
- PR #6: Integrate GitHub Issues as a CMS for blog posts, enabling issue-based RSS feeds and dynamic blog rendering via JavaScript. ([link](https://github.com/abhinavsreesan/abhinavsreesan.github.io/pull/6))
- PR #5: Add a Copilot-powered workflow and script to automatically update the README changelog for PRs targeting the master branch. ([link](https://github.com/abhinavsreesan/abhinavsreesan.github.io/pull/5))
- PR #0: Changelog automation initialized. New PR entries will appear here once the workflow runs.
<!-- changelog:end -->

## Automated PR Changelog

- Workflow: `.github/workflows/pr-readme-changelog.yml`
- Script: `scripts/update_readme_changelog.py`
- Trigger: pull request events targeting `master`
- Required secret: `COPILOT_TOKEN` (GitHub token with `models:read` and repository write access)
- Optional variable: `COPILOT_MODEL` (default: `openai/gpt-4.1`)

## Credits

Base template adapted from HTML5 UP (Dimension). See `LICENSE.txt` for details.
