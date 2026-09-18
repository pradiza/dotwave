# dot.wave

Bilingual, static multi-page website for the Indonesia–Japan consulting collective.

## Develop and verify

Requires Node 24. No JavaScript packages are needed.

```
npm run build
npm test
npm run dev
```

Open `http://127.0.0.1:4173`. All visible content is rendered into HTML; navigation and content work without JavaScript. JavaScript progressively enhances the mobile menu, filters and inquiry confirmation.

## Edit content

- `src/content.mjs`: paired English/Japanese member, service and project content. `site.featured` selects the three homepage cases.
- `scripts/build.mjs`: shared page templates, metadata, structured data, sitemap and robots.
- `dist/styles.css` and `dist/script.js`: shared presentation and interactions.
- `dist/assets/`: approved existing portraits and attributed member project imagery.

Generated HTML is committed for straightforward static hosting. Run the build after content changes. Rini owns website content and bilingual consistency. No individual member pages, Insights, social channels, testimonials, sector pages or advanced filters are part of this release.

## Deployment

Verified on 18 September 2026 in the Vercel dashboard:

- GitHub: `pradiza/dotwave`, production branch `main`.
- Vercel: `rinintha1 / dotwave`, domain `dotwave.vercel.app`.
- Previous production: `c5aef109b02868d2d47042fc7311d97c17373ab0`, deployment `BhPBETCq4p8zee45DmHS7ebFEzWT`.
- Framework: Other. Root directory: repository root. Output: `dist`. Runtime: Node 24.
- The live homepage matched the original repository HTML byte-for-byte.
- A second Vercel project, `dotwave-collective`, also uses this repository. Verify its effect before merging changes to main.

`vercel.json` preserves the output directory and adds the build command, clean URLs, old `/jp.html` redirect and response headers. Non-production branches should be verified through Vercel previews before merging. Do not alter the separate `dot-wave` or Rinintha portfolio projects.

## Contact delivery: launch gate

The old site had only email links. The new `api/contact.js` supports Formspree delivery to the Gmail inbox. Create and verify a Formspree account for `dotwave.creative@gmail.com`, create the dot.wave enquiries form, and set its ID as `FORMSPREE_FORM_ID` in Vercel for Preview and Production. Confirm the recipient and spam settings in Formspree, then test a real submission before launch. Formspree stores submissions according to the account plan and settings.

Resend remains an alternative when no Formspree ID is set: configure `RESEND_API_KEY` and `CONTACT_FROM` (a verified sender). Never place secrets in browser code or commit them.

The form returns an explicit failure until delivery is configured, preserving entered data and offering direct email. It never reports success before provider acceptance. Server validation, origin checking and a honeypot are included; the Resend path also uses provider idempotency. Verify real delivery and reply-to before production.

## Analytics

Vercel Web Analytics and Speed Insights scripts are included. Enable both in the **dotwave** project dashboard. Custom events require a supported Vercel plan; `VERCEL_CUSTOM_EVENTS=true` enables the existing event hooks at build time. On Hobby, event hooks remain disabled while page views and performance collection work when enabled. No form fields or email addresses enter analytics. Events: Discuss Project Click, Case Study Opened, Language Changed, Member Profile Click, Profile Download, Contact Started, Contact Submitted.

## Company profiles

`dist/downloads/dotwave-profile-en.pdf` and `dotwave-profile-ja.pdf` are separate eight-page credentials documents. The website links them only from About and Footer. Regenerate content export with the build, then run `scripts/profiles.py` using Python with ReportLab and Pillow. Set `PROFILE_FONT` to a Japanese-capable TrueType font when not on macOS; the default is Arial Unicode. Render and visually review all pages after edits.

## Launch verification

Automated tests cover 28 routes, internal links and anchors, images, unique metadata, bilingual alternates, project attribution and contact failure/success contracts. Browser review must additionally cover desktop/mobile EN/JP, Work filters, keyboard menu/Escape, form validation and real delivery. PDFs must be visually checked. See `docs/revision-scope.md` for scope and evidence.
