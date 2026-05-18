# Spark Design System Docs

Static HTML documentation for Spark DS tokens and components.

## View locally

Open `index.html` in a browser, or from the repo root:

```bash
open index.html
```

## Publish with GitHub Pages

### Option A: GitHub Actions (workflow in this repo)

1. On GitHub open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.  
   If it is set to **Deploy from a branch**, the **Deploy GitHub Pages** workflow fails with **Get Pages site failed / Not Found** until you switch the source to GitHub Actions.
3. Push to `cursor/add-colors-tokens-docs` (or run the workflow manually: **Actions → Deploy GitHub Pages → Run workflow**).

After a successful run:

**`https://irazu-personal.github.io/spark-ds-docs/`**

### Option B: Deploy from a branch (no Actions)

1. **Settings → Pages → Source: Deploy from a branch**
2. Branch: `cursor/add-colors-tokens-docs`, folder: `/ (root)`, Save.

You can ignore or disable the Actions workflow if you use this option.

If the repo name or owner changes, replace them in the URL.

### Private repositories

GitHub Pages on private repos may require a paid GitHub plan for access control. On free accounts, consider keeping the repo public for shared docs or exporting a ZIP of the folder instead.
