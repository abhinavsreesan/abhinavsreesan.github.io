# Abhinav Sreesan - Data Engineering Portfolio

[![pages-build-deployment](https://github.com/abhinavsreesan/abhinavsreesan.github.io/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/abhinavsreesan/abhinavsreesan.github.io/actions/workflows/pages/pages-build-deployment)

A personal portfolio website for GitHub Pages showcasing experience, projects, skills, certifications, and contact details with project deep-dives, a downloadable resume, and issue-powered content pages.

## Live Site

- https://abhinavsreesan.github.io/

## Features

- Simpler one-page layout with sticky top navigation and section-based anchors.
- Project summaries with detailed project pages.
- Certifications and academic publication links.
- Resume download and contact links.
- Blog powered by GitHub Issues (`blog` label) with tag filters and search.
- Bookshelf powered by GitHub Issues (`bookshelf` label) with tag filters and search.

## Structure

- `index.html` - Main site content and sections.
- `assets/css/` - Styling, layout overrides, and theme.
- `assets/js/` - Section transitions and navigation behavior.
- `_posts/` - Markdown blog posts (`YYYY-MM-DD-title.md`).
- `blog/` - Blog index page.
- `bookshelf/` - Bookshelf index page.
- `_layouts/` - Blog and post layouts for Jekyll.
- `assets/resume/Abhinav's Resume Rev2.pdf` - Resume PDF.
- `assets/resume/Abhinav's Resume Rev2.md` - Resume markdown source used for content updates.
- `images/profile.jpg` - Profile image used in the header.
- `CNAME` - Custom domain configuration (optional).
- `scripts/serve-local.sh` - Simple local server script (no Ruby required).

## Local Development

Use this branch locally without Ruby:

```bash
git fetch origin
git checkout refactor/simple-layout-issues-search
```

Start a local server:

```bash
./scripts/serve-local.sh 8080
```

Windows one-click setup and run:

```bat
scripts\setup-local-windows.bat
```

Direct PowerShell option:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-local-windows.ps1
```

Then visit:

```
http://localhost:8080
```

Alternative command (same result):

```bash
python3 -m http.server 8080
```

If you still want Jekyll preview for markdown posts, install dependencies and run:

```bash
bundle exec jekyll serve
```

Then visit:

```
http://localhost:4000
```

## Updating Content

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
Create a GitHub issue in `abhinavsreesan/abhinavsreesan.github.io` with label `blog`.

Recommended:

- Add extra labels like `azure`, `spark`, `architecture` for tag filtering.
- Write post content in issue body using markdown.

### Bookshelf entries

Create a GitHub issue with label `bookshelf`.

Recommended:

- Keep issue title as the book name.
- Add labels like `non-fiction`, `data`, `leadership` for filtering.
- Use issue body for notes, takeaways, and highlights.

### Optional Jekyll markdown posts

You can still create markdown files in `_posts/` using:

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
