# Astra Retrieval — website

Information site for **Astra Retrieval**: asteroid capture and cislunar return.
It explains what the company is building and lets people reach out by email.

It's a static site — plain HTML, CSS, and JavaScript with no build step.

## Structure

```
index.html              The whole site (single page)
404.html                Not-found page
favicon.ico
assets/css/styles.css   Styles (colors/fonts are CSS variables at the top)
assets/js/main.js       Mobile menu, header, scroll reveal, copy-email button
assets/img/             Logos, favicon, and background photos
```

Images in `assets/img/` come from the company pitch deck and logo files:

| File | Use |
| --- | --- |
| `logo-wordmark.png` | Header / footer logo (white, transparent) |
| `logo-mark.png` | "A ◆ R" monogram (white, transparent) |
| `asteroid-icon.png` | Asteroid glyph used as an icon |
| `favicon.png`, `apple-touch-icon.png`, `/favicon.ico` | Browser and home-screen icons |
| `hero-asteroid.jpg` | Hero background |
| `asteroid-milkyway.jpg` | Mission section background |
| `starfield.jpg` | Section background |
| `asteroid-dark.jpg` | Contact section background |
| `og-image.jpg` | Link preview image for social sharing |

## Run locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy

Any static host works (GitHub Pages, Netlify, Vercel, Cloudflare Pages).

**GitHub Pages:** Settings → Pages → *Deploy from a branch* → pick the branch and
`/ (root)`. To use `astraretrieval.com`, add a `CNAME` file containing the domain
and point the domain's DNS at GitHub Pages.

## Editing content

All copy lives in `index.html`, one commented block per section
(Hero, Focus, How it works, Asteroids, Critical minerals, Markets, Why now,
Roadmap, Mission, Team, Contact). The contact email appears in the Contact
section in two places (the `mailto:` link and the copy button's `data-email`).

### Updating roadmap progress

In the Roadmap section of `index.html`, edit the `style` on the `<div class="rm">` element:

- `--phase` is the phase you're in (1–5).
- `--within` is how far the glowing line extends toward the next phase: `0` = just started,
  `0.25` = a quarter of the way, `0.5` = halfway, and so on.

When you move into a new phase, also move `class="current"` and the
`<span class="rm-badge">We are here</span>` to that phase's `<li>`.

### Follow our progress (email updates)

The "Follow our progress" form in the Join us section signs people up for
email updates through [Buttondown](https://buttondown.com) (free for up to
100 subscribers; double opt-in by default).

1. Create a Buttondown account and pick a username (e.g. `astraretrieval`).
2. In `index.html`, search for `YOUR-BUTTONDOWN-USERNAME` and replace it with
   that username.
3. Commit and push. New subscribers appear in Buttondown under Subscribers,
   tagged with what they picked in the "I'm following as…" menu
   (investor, partner, engineer, curious).

Until step 2 is done, the form still works: it opens an email to
Stephen.Hilton@astraretrieval.com asking to be added, so no sign-ups are lost.

To use a different service (Mailchimp, Kit, beehiiv…), swap the form's
`action` URL for that service's embed/subscribe URL and make sure the email
field's `name` matches what it expects.
