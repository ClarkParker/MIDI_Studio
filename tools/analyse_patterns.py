#!/usr/bin/env python3
"""Measure how much musical variety a MIDI Studio v0.2 DSP file actually holds.

v0.2 stores every note of every composition in four parallel `let` tables:

    offsets[2561]    CSR-style index: notes for step `s` are  [offsets[s], offsets[s+1])
    degrees[1337]    scale degree (or raw GM note number for the drum pattern)
    durations[1337]  length in ticks
    velocities[1337] 1..127

`slot = (pattern * 4 + variation) * 64 + step`, so the tables cover
10 patterns x 4 variations x 64 sixteenth-note steps = 40 four-bar loops.

This script decodes those tables and reports the numbers behind the
"feels too fixed" complaint. Run it against any later revision to check that a
change actually added variety instead of just adding rows.

Usage:
    python3 tools/analyse_patterns.py alpha/v0.2/MIDIStudioDSP.cmajor
"""
from __future__ import annotations

import argparse
import pathlib
import re

STEPS_PER_BAR = 16
BARS = 4
STEPS = STEPS_PER_BAR * BARS
VARIATIONS = 4

PATTERNS = [
    "Piano", "Lead Synth", "Bass", "Electric Keys", "Pluck",
    "Drums", "Guitar", "Strings", "Flute", "Brass",
]
DRUM_PATTERN = 5

GM_DRUMS = {
    35: "Acoustic Bass Drum", 36: "Kick", 37: "Side Stick", 38: "Snare",
    39: "Hand Clap", 40: "Electric Snare", 41: "Low Floor Tom", 42: "Closed Hat",
    43: "High Floor Tom", 44: "Pedal Hat", 45: "Low Tom", 46: "Open Hat",
    47: "Low-Mid Tom", 48: "Hi-Mid Tom", 49: "Crash", 50: "High Tom",
    51: "Ride", 53: "Ride Bell", 54: "Tambourine", 56: "Cowbell",
}


def read_table(src: str, name: str, cast):
    """Pull `let <name> = T[N] (a, b, c, ...);` out of the Cmajor source."""
    m = re.search(rf"\b{re.escape(name)}\s*=\s*\w+\[(\d+)\]\s*\((.*?)\);", src, re.S)
    if m is None:
        raise SystemExit(f"table '{name}' not found — is this a MIDI Studio v0.2 DSP file?")
    values = [cast(v.strip().rstrip("f")) for v in m.group(2).split(",")]
    declared = int(m.group(1))
    if len(values) != declared:
        raise SystemExit(f"table '{name}': declared {declared} entries, found {len(values)}")
    return values


class Loop:
    """One (pattern, variation) pair: four bars of sixteenth-note steps."""

    def __init__(self, tables, pattern: int, variation: int):
        offsets, degrees, durations, velocities = tables
        base = (pattern * VARIATIONS + variation) * STEPS
        self.pattern, self.variation = pattern, variation
        self.steps = [
            [
                (degrees[i], durations[i], velocities[i])
                for i in range(offsets[base + s], offsets[base + s + 1])
            ]
            for s in range(STEPS)
        ]

    @property
    def notes(self):
        return [n for step in self.steps for n in step]

    def onset_map(self, bar: int) -> tuple[int, ...]:
        """Which sixteenths of this bar fire at all — the rhythm, ignoring chord size."""
        lo = bar * STEPS_PER_BAR
        return tuple(1 if self.steps[s] else 0 for s in range(lo, lo + STEPS_PER_BAR))

    def density_map(self, bar: int) -> tuple[int, ...]:
        """How many notes fire on each sixteenth — rhythm plus chord size."""
        lo = bar * STEPS_PER_BAR
        return tuple(len(self.steps[s]) for s in range(lo, lo + STEPS_PER_BAR))

    def bar_velocities(self, bar: int) -> tuple[int, ...]:
        lo = bar * STEPS_PER_BAR
        return tuple(v for s in range(lo, lo + STEPS_PER_BAR) for _, _, v in self.steps[s])

    @property
    def is_one_bar_loop(self) -> bool:
        """True when all four bars fire on the same sixteenths — a 1-bar loop in disguise."""
        return len({self.onset_map(b) for b in range(BARS)}) == 1

    @property
    def density_repeats(self) -> bool:
        """Stricter: same sixteenths *and* the same number of notes on each."""
        return len({self.density_map(b) for b in range(BARS)}) == 1

    @property
    def velocity_repeats(self) -> bool:
        return len({self.bar_velocities(b) for b in range(BARS)}) == 1

    def grid(self) -> str:
        cells = "".join("x" if self.steps[s] else "." for s in range(STEPS))
        return "|".join(cells[b * STEPS_PER_BAR:(b + 1) * STEPS_PER_BAR] for b in range(BARS))


def load(path: pathlib.Path) -> list[Loop]:
    src = path.read_text(encoding="utf-8")
    tables = (
        read_table(src, "offsets", int),
        read_table(src, "degrees", int),
        read_table(src, "durations", float),
        read_table(src, "velocities", int),
    )
    return [Loop(tables, p, v) for p in range(len(PATTERNS)) for v in range(VARIATIONS)]


def report(loops: list[Loop], show_grids: bool) -> None:
    print("=== Per-loop summary " + "=" * 47)
    header = (f"{'pattern':14s} {'idea':>4s} {'notes':>5s} {'onsets':>6s} {'max poly':>8s} "
              f"{'1-bar loop':>10s} {'same density':>12s} {'vel repeats':>11s}")
    print(header)
    for lp in loops:
        onsets = sum(1 for s in lp.steps if s)
        poly = max(len(s) for s in lp.steps)
        print(f"{PATTERNS[lp.pattern]:14s} {lp.variation + 1:4d} {len(lp.notes):5d} "
              f"{onsets:6d} {poly:8d} {str(lp.is_one_bar_loop):>10s} "
              f"{str(lp.density_repeats):>12s} {str(lp.velocity_repeats):>11s}")
        if show_grids:
            print(f"{'':14s}      {lp.grid()}")

    one_bar = sum(lp.is_one_bar_loop for lp in loops)
    density_rep = sum(lp.density_repeats for lp in loops)
    vel_rep = sum(lp.velocity_repeats for lp in loops)
    onset_maps = {tuple(1 if s else 0 for s in lp.steps) for lp in loops}
    cells = {lp.onset_map(b) for lp in loops for b in range(BARS)}

    print()
    print("=== Variety " + "=" * 56)
    print(f"advertised compositions ........... {len(loops)}")
    print(f"distinct 4-bar onset maps ......... {len(onset_maps)}")
    print(f"distinct 1-bar rhythm cells ....... {len(cells)}")
    print(f"same sixteenths fire in all 4 bars. {one_bar}/{len(loops)}")
    print(f"...and the same note count per step {density_rep}/{len(loops)}")
    print(f"loops with identical velocity/bar.. {vel_rep}/{len(loops)}")
    print(f"total stored notes ................ {sum(len(lp.notes) for lp in loops)}")

    print()
    print("=== Drum kit usage " + "=" * 49)
    for lp in (lp for lp in loops if lp.pattern == DRUM_PATTERN):
        used: dict[int, int] = {}
        for note, _, _ in lp.notes:
            used[note] = used.get(note, 0) + 1
        pieces = ", ".join(f"{GM_DRUMS.get(k, k)} x{n}" for k, n in sorted(used.items()))
        print(f"idea {lp.variation + 1}: {pieces}")
        hats = [v for n, _, v in lp.notes if n == 42]
        if hats:
            print(f"        closed-hat velocities used: {sorted(set(hats))}")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("dsp", type=pathlib.Path, help="MIDIStudioDSP.cmajor")
    ap.add_argument("--grids", action="store_true", help="print the onset grid for every loop")
    args = ap.parse_args()
    report(load(args.dsp), args.grids)


if __name__ == "__main__":
    main()
