# Nimkat — approved design contract

## Sources and precedence
1. User's approved UI PDFs and System Design PDF; Yekan Bakh overrides any font suggestion.
2. Technical breakdown PDF (24 pages), supplied October 20, 2026.
3. UI/UX Pro Max skill: interaction, accessibility, motion and implementation guidance only.

The skill is NOT a runtime component library. Installed under `.claude/skills` from
https://github.com/nextlevelbuilder/ui-ux-pro-max-skill at 56ea9cf174ed86786187daa9de0e6247cb0747e4.
License retained in `.claude/skills/UPSTREAM-LICENSE`.

## Accepted visual rules
- RTL; self-hosted Yekan Bakh FaNum; Persian numerals, Jalali presentation.
- Primary #0A6847, dark #053D29, fresh #21A878, accent #F28A3D.
- Neutral #F3F6F4 / #D9E1DE / #89938F / #46514D / #17211E.
- Orange buttons use #17211E text, never white. Secondary text on white #46514D.
- 4px spacing; radii 8/12/16/24/32/full; 20/24px stroke-2 SVG icons.
- Preserve approved hero photos, layout and class booking box.
- Primary conversion: «شروع رزرو کلاس».

## Reviewed skill output
The education query returned Claymorphism, teal and Baloo/Comic Neue; these do NOT
fit the approved brand and are rejected. Accepted recommendations: visible focus,
keyboard equivalents, feedback for actions, meaningful motion, reduced motion,
responsive verification and clear conversion hierarchy.
Raw targeted search results: docs/technical/motion-guidance.txt and nextjs-guidance.txt.

## Implementation
Tailwind v4 utilities are prefixed `tw:`; preflight is intentionally omitted to
avoid overwriting approved PDF styles. Next uses @tailwindcss/postcss. Tokens live in frontend/src/styles/tailwind.css.
Use logical spacing (`tw:ps-4`, `tw:me-2`) for new RTL components.
Motion: route entry 240ms; builder sections reveal 350ms/12px, once in view. SSR content remains visible without JavaScript.
Editor canvas stays static for reliable selection. Button press 180ms; no autoplay,
parallax, pinned scroll or distracting perpetual animation. Respect prefers-reduced-motion.
Visible keyboard focus is mandatory. Validate at 375/768/1024/1440 widths.
