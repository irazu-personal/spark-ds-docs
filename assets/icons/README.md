# Spark DS icons

Outlined icons exported from the Spark Figma library (Icons Outlined). Each icon has two SVG files:

| Variant | File | ViewBox |
|---------|------|---------|
| Medium | `{name}-medium.svg` | 24×24 |
| Small | `{name}-small.svg` | 16×16 |

Browse and download from the docs: [Icons](https://irazu-personal.github.io/spark-ds-docs/icons.html)

**Repository path:** `assets/icons/`  
**Manifest:** `assets/icons/manifest.json` (v2: icon names plus Figma section groups for the docs browser)

Regenerate from Figma:

```bash
python3 scripts/export_figma_icons.py --from-repo-batches
```
