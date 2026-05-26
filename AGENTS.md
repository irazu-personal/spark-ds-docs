# Spark Design System — Agent Guide

All UI work in React apps must follow **Spark DS**. Read this before writing or changing UI code.

## Source of truth

| Resource | Path / URL |
|----------|------------|
| Figma library | https://www.figma.com/design/KYq9ka9Hg16HdfzR4gMoMH/Spark---DS (`fileKey`: `KYq9ka9Hg16HdfzR4gMoMH`) |
| Published docs | https://irazu-personal.github.io/spark-ds-docs/ |
| Token definitions | `css/tokens.css` |
| Components | `button.html` (more added over time) |
| Foundations | `colors.html`, `typography.html`, `dimensions.html`, `shadows-effects.html` |
| Accessibility | `accessibility.html` |

**Priority:** Figma defines visual intent. `css/tokens.css` defines code values. HTML docs define usage and React API. When Figma and code disagree, implement with tokens and flag the drift.

## Figma MCP

Use the Figma MCP server for design-to-code and library work. Full workflow: `.cursor/rules/spark-ds-figma-mcp.mdc`.

Quick reference:

- **Design to React:** `get_design_context` → `search_design_system` → map to tokens → implement per React rules
- **Update Figma:** load `figma-use` skill → `search_design_system` → `use_figma` in small steps
- **Default node:** `620:10020` unless the user shares a specific frame URL

## UI task workflow

1. List UI elements needed (buttons, text, surfaces, forms).
2. If designing from Figma, call `get_design_context` with the user's node URL (or default `620:10020`).
3. Check component pages in this repo. Reuse documented components before custom markup.
4. Grep `css/tokens.css` for `--semantic-*` and component-scoped tokens.
5. Implement with React components + CSS custom properties. No hardcoded colors or spacing.
6. Run the accessibility checklist in `.cursor/rules/spark-ds-accessibility.mdc`.
7. If a component or token is missing, follow `.cursor/rules/spark-ds-extending.mdc` and ask before inventing patterns.

## React setup

- Import `tokens.css` once at the app root (e.g. `main.tsx` or `_app.tsx`).
- Place Spark component styles in shared packages or `components/` using token-backed CSS.
- Use functional components. Prefer typed props matching Spark DS docs.
- Compose `className` with a small helper (`clsx`, `cn`). Do not inline style objects with raw hex or px.

## Cursor rules

Rules live in `.cursor/rules/`:

- `spark-ds-source-of-truth.mdc` — discovery and workflow
- `spark-ds-token-hierarchy.mdc` — token tiers
- `spark-ds-react-components.mdc` — React component patterns
- `spark-ds-accessibility.mdc` — WCAG requirements
- `spark-ds-foundations.mdc` — typography, spacing, shadows
- `spark-ds-icons.mdc` — icon usage
- `spark-ds-extending.mdc` — adding tokens or components
- `spark-ds-docs-authoring.mdc` — writing DS documentation
- `spark-ds-figma-mcp.mdc` — Figma file, MCP tools, design-to-code workflow
