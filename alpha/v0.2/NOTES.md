# Alpha v0.2 — provenance

`MIDI_Studio_v0.2.amorph` is the maker's original file, **unmodified**, as shared
with the beta group.

The other two files are extracted from it losslessly and are here only so the
source is diffable and greppable in git:

```bash
python3 ../../tools/amorph_extract.py MIDI_Studio_v0.2.amorph -o .
```

## Patch metadata

| Field | Value |
|---|---|
| name | MIDI Studio v0.2 |
| author | Laurenz Fregnan |
| date | 2026-09-13 |
| format_version | 2 |
| plugin_type | midi |
| id | `98766291-f90b-42ec-96f1-b01b64f353cf` |
| origin_id / parent_id | `99a0d407-78de-4428-94d4-e5bfc16ce58a` |
| presentation size | 952 x 585 |
| lab size | 1020 x 830 |
| declared paramCount | 0 (the patch actually declares 10 parameters) |

## File anatomy

An `.amorph` file is a single XML document, not an archive:

```xml
<AmorphAlgorithm format_version="2" name="..." plugin_type="midi" ...>
  <PresentationConfig ...>
    <ParameterNames>          <!-- 128 slots, mostly placeholder names -->
  </PresentationConfig>
  <Code>      <!-- Cmajor DSP source, 41491 chars -->
  <UICode>    <!-- JavaScript UI module, 13355 chars -->
</AmorphAlgorithm>
```

Do not hand-edit the `.amorph`. Amorph's own write path is
`edit_lines → task_complete → apply_draft`; a change is only live once
`apply_draft` returns OK and `get_error` returns `none`.

## Do not modify

Keep this directory byte-identical to what the maker sent. New work goes in a
sibling version directory, so that any change remains diffable against the
original.
