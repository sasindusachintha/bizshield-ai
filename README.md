# BizShield Frontend

Static frontend for BizShield, an AI-powered startup toolkit that helps users generate business ideas, analyze them, build launch plans, and create marketing content.

## Pages

- `index.html` - landing page with animated hero, stats, feature cards, and CTA.
- `pages/dashboard.html` - overview dashboard and feasibility score tools.
- `pages/ideas.html` - business idea generation form and results.
- `pages/analysis.html` - market demand, competition, risk, and cost analysis.
- `pages/plan.html` - launch roadmap and milestone planner.
- `pages/marketing.html` - Instagram posts, ads, slogans, and social captions.

## Project Structure

```text
frontend/
  css/
    style.css          Shared theme, layout, Bootstrap overrides, dark mode
  js/
    api.js             API helper and shared loading/error utilities
    theme.js           Light/dark theme toggle and persistence
    dashboard.js       Dashboard tools logic
    ideas.js           Idea generation logic
    analysis.js        Analysis page logic
    plan.js            Launch plan logic
    marketing.js       Marketing kit logic
  pages/
    *.html             Tool pages
  index.html           Landing page
```

## Run Locally

This frontend is static HTML/CSS/JavaScript. You can open `index.html` directly in a browser.

For API-powered features to work, the backend must be running at:

```text
http://localhost:3000
```

The API base URL is configured in `js/api.js`:

```js
const API_BASE = 'http://localhost:3000';
```

Update that value if the backend runs on another host or port.

## Theme

The site uses a shared color system in `css/style.css`, including shaded light mode and dark mode. The dark-mode toggle is injected by `js/theme.js` into each page's navigation bar.

Theme choice is saved in `localStorage`, so the selected mode persists across pages.

## External Dependencies

Loaded from CDNs:

- Bootstrap 5.3.1
- Font Awesome 6.5.0
- Three.js r128
- Google Fonts Inter

No package install or build step is required for the frontend.
