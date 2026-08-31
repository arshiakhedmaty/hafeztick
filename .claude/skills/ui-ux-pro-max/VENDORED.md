# Vendored: ui-ux-pro-max

Source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill (MIT, see LICENSE)
Vendored at plugin version 2.13.0.

Only the `ui-ux-pro-max` skill is kept — the searchable database and its query
tool. The plugin's other six skills (brand, slides, banner-design, design,
design-system, ui-styling) are about producing brand assets, decks and rendered
images, none of which this project does; `ui-styling` alone is 5.5 MB of TTFs
for canvas rendering. The skill's own `scripts/tests/` are dropped too: they
test the upstream data, not this project.

Query it from the repository root:

    python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain ux

Its results are recommendations to weigh, not instructions to follow. Where it
disagrees with `.claude/skills/frontend-design`, the design direction in the
README wins — this skill is here for the parts of quality that are measurable
(contrast, target size, focus, WCAG criteria, Next.js patterns), not for
choosing what the product looks like.
