#!/usr/bin/env python3
"""Extract the DSP and UI source out of an Amorph `.amorph` project file.

An `.amorph` file is a single XML document: `<AmorphAlgorithm>` carries the
plugin metadata, `<PresentationConfig>` the window/preset info, `<Code>` the
Cmajor DSP source and `<UICode>` the JavaScript UI module.

Usage:
    python3 tools/amorph_extract.py PATCH.amorph [-o OUTDIR]
"""
from __future__ import annotations

import argparse
import pathlib
import xml.etree.ElementTree as ET


def extract(patch: pathlib.Path, outdir: pathlib.Path) -> dict[str, pathlib.Path]:
    root = ET.parse(patch).getroot()
    outdir.mkdir(parents=True, exist_ok=True)
    written: dict[str, pathlib.Path] = {}

    stem = (root.get("name") or patch.stem).replace(" ", "_")
    for tag, suffix in (("Code", ".cmajor"), ("UICode", "UI.js")):
        node = root.find(f".//{tag}")
        if node is None or not (node.text or "").strip():
            continue
        target = outdir / f"{stem}{suffix}"
        target.write_text(node.text, encoding="utf-8")
        written[tag] = target

    meta = outdir / f"{stem}.meta.txt"
    lines = [f"{k} = {v}" for k, v in root.attrib.items()]
    pc = root.find("PresentationConfig")
    if pc is not None:
        lines += [f"PresentationConfig.{k} = {v}" for k, v in pc.attrib.items()]
    meta.write_text("\n".join(lines) + "\n", encoding="utf-8")
    written["meta"] = meta
    return written


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("patch", type=pathlib.Path)
    ap.add_argument("-o", "--outdir", type=pathlib.Path, default=pathlib.Path("."))
    args = ap.parse_args()

    for tag, path in extract(args.patch, args.outdir).items():
        print(f"{tag:8s} -> {path}")


if __name__ == "__main__":
    main()
