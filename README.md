# Spark Design System Docs

Static HTML documentation for Spark DS tokens and components.

## View locally

Open `index.html` in a browser, or from the repo root:

```bash
open index.html
```

## Publish with GitHub Pages

This repo includes a workflow that deploys the site to **GitHub Pages** when you push to the default branch (`cursor/add-colors-tokens-docs`).

1. On GitHub: **Settings → Pages → Build and deployment**
2. Set **Source** to **GitHub Actions** (not “Deploy from a branch”).
3. Push these files to the default branch. The **Deploy GitHub Pages** workflow uploads the site root (`index.html`, `css/`, `js/`, and HTML pages).

After the first successful run, the site is available at:

**`https://irazu-personal.github.io/spark-ds-docs/`**

Share that URL with your team. If the repo name or owner changes, replace them in the URL.

### Private repositories

GitHub Pages on private repos may require a paid GitHub plan for access control. On free accounts, consider keeping the repo public for shared docs or exporting a ZIP of the folder instead.
