# Abhinav Sreesan - Data Engineering Portfolio

[![pages-build-deployment](https://github.com/abhinavsreesan/abhinavsreesan.github.io/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/abhinavsreesan/abhinavsreesan.github.io/actions/workflows/pages/pages-build-deployment)

A personal portfolio website for GitHub Pages showcasing experience, projects, skills, certifications, and contact details with project deep-dives and a downloadable resume.

## Live Site

- https://abhinavsreesan.github.io/

## Features

- One-page, interactive layout with section-based navigation.
- Project summaries with detailed project pages.
- Certifications and academic publication links.
- Resume download and contact links.

## Structure

- `index.html` - Main site content and sections.
- `assets/css/` - Styling, layout overrides, and theme.
- `assets/js/` - Section transitions and navigation behavior.
- `assets/resume/Abhinav's Resume Rev2.pdf` - Resume PDF.
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

## Deployment

Push to the default branch and enable GitHub Pages in the repository settings. The `CNAME` file supports a custom domain if configured.

## Credits

Base template adapted from HTML5 UP (Dimension). See `LICENSE.txt` for details.
