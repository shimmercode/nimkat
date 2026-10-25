# 21st community components → Nimkat adaptations

Fetched/reviewed on 2026-10-20. These are local source adaptations, NOT an npm
package named `21st`, and not runtime requests to 21st or a remote registry.

## Discovery

- https://21st.dev/community/components
- https://21st.dev/community/components/s/navigation-menu
- https://21st.dev/community/components/s/footer
- https://21st.dev/community/components/s/cta
- https://21st.dev/@meschacirung/library/tailark
- https://21st.dev/@meschacirung/components/hero-section-1
- https://21st.dev/@meschacirung/components/call-to-action/default
- https://21st.dev/@meschacirung/components/footer-2

Also reviewed: shadcnui-blocks Navbar 02, shadcnblocks Footer 7, brijr CTA and
Aceternity Spotlight. These alternatives are NOT imported or copied into the app.

## Actual upstream code

Repository: https://github.com/tailark/blocks
Pinned commit: `8139698115c1341bfd2e3e286c04bb4d8146f472`
License: MIT, Copyright (c) 2025 Irung; full notice in `upstream/LICENSE.txt`.
Fetched through the GitHub contents API, decoded without editing. The registry
has evolved since the 21st previews; these are current upstream variants, not
claims that the older preview and the current source are pixel-identical.

| Preserved source (`upstream/`) | Upstream path at pinned commit | Runtime adaptation |
| --- | --- | --- |
| header.tsx.txt | registry/bases/radix/veil/blocks/hero-section/one/header.tsx | navigation.jsx + Header.jsx |
| hero-section.tsx.txt | registry/bases/radix/veil/blocks/hero-section/one/hero-section.tsx | hero-frame.jsx |
| call-to-action.tsx.txt | registry/bases/radix/mist/blocks/call-to-action/one.tsx | action-panel.jsx |
| footer.tsx.txt | registry/bases/radix/mist/blocks/footer/two.tsx | footer-grid.jsx + Footer.jsx |

Original TSX is kept as `.txt` for provenance, not compiled or shipped. It still
contains upstream demo imports/links/serif fonts. Only adapted JSX is imported
by the app; see manifest.json for original SHA-256 checksums.

## Intentional adaptations

- Replace demo fonts and colors with self-hosted YekanBakh and Nimkat CSS tokens.
- Keep the approved teacher/student photos, heading/search content and booking
  flow; adapt the layered hero stage instead of importing SaaS product logos.
- Use real Persian routes and filters, Next links and RTL direction.
- Upgrade the original state-only mobile menu to Radix Dialog for focus trapping,
  Escape/overlay closing, scroll lock and focus restoration. Desktop mega menu
  uses Radix NavigationMenu. Imports are real production dependencies.
- CTA retains paired actions and centered composition; accepts page-editor title,
  description and buttons, plus editable eyebrow/showSteps. Hero eyebrow is editable.
- Footer retains the source's data-driven grouped navigation; no fake social URLs,
  telephone numbers or certification badges. Support opens the existing widget.
- Brand-only patterns, hover states and short entrance transitions; reduced-motion
  is respected. No WebGL, cursor takeover, videos or external image/font requests.

The entire community catalog was NOT downloaded or installed: discovery focused
on the requested sections, and only these selected sources were vendored.
