#!/usr/bin/env python3
"""Export Spark DS icons from Figma into assets/icons/.

Input modes:
1. Figma REST API: set FIGMA_ACCESS_TOKEN (or FIGMA_TOKEN), or pass --token-file
2. JSON manifest: --manifest path (from use_figma batches)
3. Local dev fallback: --from-repo-batches merges scripts/.icon_batches batch_*.json
   and icons/icon_*.json (incomplete vs Figma; use --allow-partial when count is not 130)
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import re
import urllib.parse
import urllib.request
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SCRIPT_DIR = Path(__file__).resolve().parent
ICONS_DIR = ROOT / "assets" / "icons"
ICON_BATCHES_DIR = SCRIPT_DIR / ".icon_batches"
FILE_KEY = "KYq9ka9Hg16HdfzR4gMoMH"
SECTION_NODE_ID = "984:12"
SVG_NS = "http://www.w3.org/2000/svg"
DEFAULT_EXPECTED_SETS = 130


def to_kebab(name: str) -> str:
    s = name.strip()
    s = re.sub(r"\s+Icons$", "", s)
    s = re.sub(r"\s+Icon$", "", s)
    s = re.sub(r"\s*\+\s*", "-plus-", s)
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-").lower()
    return s


def _local(tag: str) -> str:
    return tag.split("}", 1)[-1] if "}" in tag else tag


def normalize_svg(raw: str, *, size: int) -> str:
    """Normalize Figma SVG export to Chevron example format."""
    root = ET.fromstring(raw)
    if _local(root.tag) != "svg":
        raise ValueError("Expected root <svg>")

    paths: list[ET.Element] = []
    for elem in root.iter():
        if _local(elem.tag) == "path":
            paths.append(elem)

    if not paths:
        raise ValueError("No <path> elements found")

    out = ET.Element(
        "svg",
        {
            "width": str(size),
            "height": str(size),
            "viewBox": f"0 0 {size} {size}",
            "fill": "none",
            "xmlns": SVG_NS,
        },
    )

    for path in paths:
        clone = ET.Element("path")
        clone.set("d", path.get("d", ""))
        for attr in ("fill-rule", "clip-rule"):
            if path.get(attr):
                clone.set(attr, path.get(attr))
        clone.set("fill", "black")
        out.append(clone)

    return ET.tostring(out, encoding="unicode")


def validate_inventory(items: list[dict[str, str]]) -> None:
    seen: dict[str, str] = {}
    for item in items:
        base = to_kebab(item["frameName"])
        if base in seen:
            raise SystemExit(
                f"Kebab-case collision for {base!r}: "
                f"{seen[base]!r} and {item['frameName']!r}"
            )
        seen[base] = item["frameName"]


def clear_icons_dir() -> None:
    """Remove existing exports (SVGs and junk); keep the directory."""
    ICONS_DIR.mkdir(parents=True, exist_ok=True)
    for path in ICONS_DIR.iterdir():
        if not path.is_file():
            continue
        if path.suffix.lower() == ".svg" or path.name == ".DS_Store":
            path.unlink()


def write_icons(items: list[dict[str, str]]) -> int:
    validate_inventory(items)
    clear_icons_dir()
    written = 0
    for item in items:
        base = to_kebab(item["frameName"])
        for size_key, size_px, suffix in (
            ("mediumSvg", 24, "medium"),
            ("smallSvg", 16, "small"),
        ):
            svg = normalize_svg(item[size_key], size=size_px)
            out_path = ICONS_DIR / f"{base}-{suffix}.svg"
            out_path.write_text(svg + "\n")
            written += 1
    return written


def figma_request(token: str, path: str, params: dict[str, str] | None = None) -> dict:
    url = f"https://api.figma.com/v1{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"X-Figma-Token": token})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())


def download_text(url: str) -> str:
    with urllib.request.urlopen(url) as resp:
        return resp.read().decode()


def _variant_ids_from_node(node: dict) -> tuple[str | None, str | None]:
    """Resolve Size=Medium / Size=Small child node ids (COMPONENT or COMPONENT_SET children)."""
    medium_id: str | None = None
    small_id: str | None = None
    for variant in node.get("children") or []:
        if variant.get("name") == "Size=Medium":
            medium_id = variant.get("id")
        elif variant.get("name") == "Size=Small":
            small_id = variant.get("id")
    return medium_id, small_id


def resolve_token(token_file: Path | None) -> str | None:
    for key in ("FIGMA_ACCESS_TOKEN", "FIGMA_TOKEN"):
        v = os.environ.get(key)
        if v:
            return v.strip()
    if token_file is not None and token_file.is_file():
        return token_file.read_text().strip().splitlines()[0].strip()
    home_token = Path.home() / ".figma_access_token"
    if home_token.is_file():
        return home_token.read_text().strip().splitlines()[0].strip()
    return None


def load_merged_local_batches(base: Path = ICON_BATCHES_DIR) -> list[dict[str, str]]:
    """Merge batch_*.json, icons/icon_*.json, and figma_export/batch_*.json by frameName."""
    merged: dict[str, dict[str, str]] = {}
    for pattern in ("batch_*.json",):
        for path in sorted(base.glob(pattern)):
            data = json.loads(path.read_text())
            for icon in data.get("icons") or []:
                merged[icon["frameName"]] = icon
    export_dir = base / "figma_export"
    if export_dir.is_dir():
        for path in sorted(export_dir.glob("batch_*.json")):
            data = json.loads(path.read_text())
            for icon in data.get("icons") or []:
                merged[icon["frameName"]] = icon
    # MCP-persisted icon_*.json wins over older figma_export batches.
    icons_dir = base / "icons"
    if icons_dir.is_dir():
        for path in sorted(icons_dir.glob("icon_*.json")):
            icon = json.loads(path.read_text())
            merged[icon["frameName"]] = icon
    return list(merged.values())


def build_inventory_from_figma(
    token: str,
    file_key: str,
    *,
    expected_sets: int,
) -> list[dict[str, str]]:
    node = figma_request(
        token,
        f"/files/{file_key}/nodes",
        {"ids": SECTION_NODE_ID},
    )
    section = node["nodes"][SECTION_NODE_ID]["document"]
    items: list[dict[str, str]] = []

    for child in section.get("children", []):
        ctype = child.get("type")
        if ctype == "INSTANCE":
            continue
        medium_id: str | None = None
        small_id: str | None = None
        if ctype in ("COMPONENT_SET", "FRAME"):
            medium_id, small_id = _variant_ids_from_node(child)
        if not medium_id or not small_id:
            continue
        items.append(
            {
                "frameName": child["name"],
                "mediumId": medium_id,
                "smallId": small_id,
            }
        )

    if expected_sets and len(items) != expected_sets:
        raise SystemExit(
            f"Expected {expected_sets} icon sets, found {len(items)}. "
            "Fix Figma section Icons Outlined (984:12), adjust --expected-sets, "
            "or use --allow-partial with --from-repo-batches."
        )

    validate_inventory(items)

    node_ids: list[str] = []
    for item in items:
        node_ids.extend([item["mediumId"], item["smallId"]])

    svg_by_id: dict[str, str] = {}
    batch_size = 100
    for i in range(0, len(node_ids), batch_size):
        batch = node_ids[i : i + batch_size]
        images = figma_request(
            token,
            f"/images/{file_key}",
            {"ids": ",".join(batch), "format": "svg"},
        )
        if images.get("err"):
            raise SystemExit(images["err"])
        for node_id, url in images["images"].items():
            if not url:
                raise SystemExit(f"No SVG URL returned for node {node_id}")
            svg_by_id[node_id] = download_text(url)

    export_items: list[dict[str, str]] = []
    for item in items:
        export_items.append(
            {
                "frameName": item["frameName"],
                "mediumSvg": svg_by_id[item["mediumId"]],
                "smallSvg": svg_by_id[item["smallId"]],
            }
        )
    return export_items


def decode_manifest_svg(value: str) -> str:
    if value.strip().startswith("<"):
        return value
    raw = base64.b64decode(value)
    return raw.decode("utf-8")


def load_manifest(path: Path) -> list[dict[str, str]]:
    data = json.loads(path.read_text())
    icons = data["icons"]
    items: list[dict[str, str]] = []
    for icon in icons:
        items.append(
            {
                "frameName": icon["frameName"],
                "mediumSvg": decode_manifest_svg(icon["mediumSvg"]),
                "smallSvg": decode_manifest_svg(icon["smallSvg"]),
            }
        )
    return items


def main() -> None:
    parser = argparse.ArgumentParser(description="Export Spark DS icons from Figma")
    parser.add_argument("--manifest", type=Path, help="JSON manifest from use_figma batches")
    parser.add_argument(
        "--from-repo-batches",
        action="store_true",
        help=f"Merge local {ICON_BATCHES_DIR.relative_to(ROOT)}/batch_*.json and icons/icon_*.json",
    )
    parser.add_argument(
        "--token-file",
        type=Path,
        help="Read token from first line (do not commit this file)",
    )
    parser.add_argument("--file-key", default=FILE_KEY, help="Figma file key")
    parser.add_argument(
        "--expected-sets",
        type=int,
        default=DEFAULT_EXPECTED_SETS,
        help=f"REST mode: require this many icon rows (default {DEFAULT_EXPECTED_SETS}; 0 to skip)",
    )
    parser.add_argument(
        "--allow-partial",
        action="store_true",
        help="With --from-repo-batches: do not require 130 merged icon sets",
    )
    args = parser.parse_args()

    if args.manifest and args.from_repo_batches:
        raise SystemExit("Use only one of --manifest or --from-repo-batches")

    if args.manifest:
        items = load_manifest(args.manifest)
    elif args.from_repo_batches:
        items = load_merged_local_batches()
        if not args.allow_partial and len(items) != DEFAULT_EXPECTED_SETS:
            raise SystemExit(
                f"Merged {len(items)} icon sets from repo batches (expected {DEFAULT_EXPECTED_SETS}). "
                "Set FIGMA_ACCESS_TOKEN for a full REST export, or pass --allow-partial."
            )
        if args.allow_partial and len(items) != DEFAULT_EXPECTED_SETS:
            print(
                f"Warning: partial export ({len(items)}/{DEFAULT_EXPECTED_SETS} icon sets). "
                "Re-run with FIGMA_ACCESS_TOKEN for all 260 SVGs.",
                flush=True,
            )
    else:
        token = resolve_token(args.token_file)
        if not token:
            raise SystemExit(
                "Set FIGMA_ACCESS_TOKEN (or FIGMA_TOKEN), use --token-file, "
                "place token in ~/.figma_access_token, pass --manifest, "
                "or use --from-repo-batches --allow-partial for cached icons only."
            )
        expect = args.expected_sets if args.expected_sets != 0 else 0
        items = build_inventory_from_figma(token, args.file_key, expected_sets=expect)

    count = write_icons(items)
    print(f"Wrote {count} SVG files to {ICONS_DIR}")


if __name__ == "__main__":
    main()
