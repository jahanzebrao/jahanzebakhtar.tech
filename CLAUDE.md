# Project notes for Claude

- Static site: index.html + assets/css/style.css + assets/js/main.js. No framework, no build step. Keep it that way.
- Owner: Jahanzeb Akhtar (Laravel developer, founder of ZebCore Systems). Talks in Roman Urdu/English mix.
- Design: clean premium light theme. Fonts Geist (body), Instrument Serif italic (accents), Geist Mono (labels/numbers). Accent orange `--accent: #ff5a1f`. Keep colors in the :root tokens.
- Project cards are generated from the `P` array in main.js. A project with `href` shows a live demo link.
- Must stay responsive from 320px to 1920px with no horizontal scroll and no overlapping elements. Check phone, tablet and desktop after every layout change.
- Respect `prefers-reduced-motion`; mouse-based 3D tilt only runs on fine pointers.
- No fake testimonials, client logos or invented numbers.
- Contact form auto-reply: `netlify/functions/contact-reply.js` (signed Netlify webhook → Hostinger SMTP, Node built-ins only). Deploy by `git push` to `main` (Netlify builds from GitHub, see netlify.toml); `python deploy.py` is the API fallback. Never drag-and-drop (that drops the function).
