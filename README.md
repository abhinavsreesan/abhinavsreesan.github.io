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

## Structure

- `index.html` - Main site content and sections.
- `assets/css/` - Styling, layout overrides, and theme.
- `assets/js/` - Section transitions and navigation behavior.
- `_posts/` - Markdown blog posts (`YYYY-MM-DD-title.md`).
- `blog/` - Blog index page.
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

## Deployment

Push to the default branch and enable GitHub Pages in the repository settings. The `CNAME` file supports a custom domain if configured.

## Credits

Base template adapted from HTML5 UP (Dimension). See `LICENSE.txt` for details.
