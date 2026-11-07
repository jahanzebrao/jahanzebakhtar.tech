# Jahanzeb Akhtar — Portfolio

Static portfolio site (no build step). Plain HTML, CSS and JavaScript.

## Structure
```
index.html              Page content (all sections)
assets/css/style.css    All styles (tokens at the top in :root)
assets/js/main.js       Projects list, filters, 3D effects, animations, form
assets/img/             Portrait photos + og-image.jpg (1200×630 social share card)
assets/fonts/           Self-hosted latin woff2 (Geist, Geist Mono, Instrument Serif italic; OFL), @font-face at the top of style.css
*.html (root)           Keyword pages: software-developer-karachi, custom-erp-software-pakistan, onepackerp-case-study (add new ones to sitemap.xml)
favicon.svg, apple-touch-icon.png   Site icons
robots.txt, sitemap.xml             SEO (update <lastmod> in sitemap.xml after big edits)
_headers                            Netlify security + image cache headers
```

## SEO
- Title, description, canonical, Open Graph/Twitter tags and JSON-LD (Person, ZebCore Systems, OnePackERP) are in the `<head>` of index.html.
- Add LinkedIn/GitHub profile URLs to the `sameAs` list in the JSON-LD when available.

## Contact form
- The form posts to Netlify Forms (form name `contact`). Netlify emails each enquiry to the owner (Gmail + the domain mailbox).
- Netlify then calls a signed outgoing webhook → `netlify/functions/contact-reply.js`, which emails the client a branded confirmation from `jahanzeb@jahanzebakhtar.tech` (Hostinger SMTP, no npm packages).
- Netlify environment variables: `SMTP_PASS` (mailbox password, set by the owner in the Netlify UI) and `HOOK_SECRET` (webhook signature secret). After changing either one, redeploy.
- If the post fails, the visitor gets a prefilled WhatsApp link instead.

## Run locally
Open the folder in VS Code and use the **Live Server** extension (right-click index.html → Open with Live Server).

## Common edits
- **Projects / demo links:** edit the `P` array at the top of `assets/js/main.js`. Add `href:"https://..."` to a project to show a "Live demo" button.
- **Colors and fonts:** edit the `:root` tokens at the top of `assets/css/style.css` (`--accent` is the orange).
- **Text, sections, contact details:** edit `index.html`.

## Deploy (Netlify)
Netlify site: **jahanzeb-akhtar** (https://jahanzeb-akhtar.netlify.app).

**Normal way: `git push` to `main`.** The Netlify site is linked to the GitHub repo and builds every push (settings in `netlify.toml`: no build command, publish the repo root, functions in `netlify/functions`, repo-only files return 404).

Fallback: `python deploy.py` uploads straight through the Netlify API (needs a Netlify token in `C:\Users\<you>\netlify-token.txt`, never inside this folder). **Never drag-and-drop the folder onto Netlify**: drag-and-drop deploys drop `netlify/functions`, which switches the client auto-reply off.

The domain jahanzebakhtar.tech stays on Hostinger DNS:
- `A @ → 75.2.60.5` and `CNAME www → jahanzeb-akhtar.netlify.app` (www redirects to the bare domain; HTTPS by Netlify, auto-renews)
- Email records must stay as they are: MX, SPF TXT, `CNAME autoconfig`, and the three `hostingermail-*._domainkey` DKIM CNAMEs. Do not change nameservers.
